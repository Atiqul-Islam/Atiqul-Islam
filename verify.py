#!/usr/bin/env python3
"""Drive a real Chrome over CDP and assert the page actually behaves.

Screenshots prove layout and nothing else. This scrolls the live page and reads
back computed transforms, canvas pixels and console errors, so every claim about
motion is measured rather than asserted.

No third party packages: a minimal WebSocket client over a raw socket.
"""
import base64, json, os, socket, struct, subprocess, sys, time, urllib.request

CHROME = os.path.expanduser("~/.cache/ms-playwright/chromium-1237/chrome-linux64/chrome")
PORT = 9333
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8752/"


class WS:
    def __init__(self, url):
        _, rest = url.split("://", 1)
        hostport, path = rest.split("/", 1)
        host, port = hostport.split(":")
        self.s = socket.create_connection((host, int(port)))
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((
            f"GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\n"
            f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n").encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        self.buf = buf.split(b"\r\n\r\n", 1)[1]
        self.id = 0

    def send(self, payload):
        data = json.dumps(payload).encode()
        hdr = bytearray([0x81])
        n = len(data)
        if n < 126:
            hdr.append(0x80 | n)
        elif n < 65536:
            hdr.append(0x80 | 126); hdr += struct.pack(">H", n)
        else:
            hdr.append(0x80 | 127); hdr += struct.pack(">Q", n)
        mask = os.urandom(4)
        hdr += mask
        self.s.sendall(bytes(hdr) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def _read(self, n):
        while len(self.buf) < n:
            chunk = self.s.recv(65536)
            if not chunk:
                raise IOError("socket closed")
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def recv(self):
        b0, b1 = self._read(2)
        ln = b1 & 0x7F
        if ln == 126:
            ln = struct.unpack(">H", self._read(2))[0]
        elif ln == 127:
            ln = struct.unpack(">Q", self._read(8))[0]
        return json.loads(self._read(ln).decode())

    def call(self, method, **params):
        self.id += 1
        mine = self.id
        self.send({"id": mine, "method": method, "params": params})
        while True:
            msg = self.recv()
            if msg.get("id") == mine:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg.get("result", {})

    def js(self, expr):
        r = self.call("Runtime.evaluate", expression=expr,
                      returnByValue=True, awaitPromise=True)
        if r.get("exceptionDetails"):
            raise RuntimeError(r["exceptionDetails"].get("text"))
        return r["result"].get("value")


proc = subprocess.Popen(
    [CHROME, "--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
     f"--remote-debugging-port={PORT}", "--window-size=1280,900", "about:blank"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

try:
    ws_url = None
    for _ in range(60):
        try:
            tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
            for t in tabs:
                if t.get("type") == "page":
                    ws_url = t["webSocketDebuggerUrl"]; break
            if ws_url:
                break
        except Exception:
            time.sleep(0.25)
    assert ws_url, "no CDP page target"

    ws = WS(ws_url)
    ws.call("Page.enable"); ws.call("Runtime.enable"); ws.call("Log.enable")
    ws.call("Page.navigate", url=URL)
    time.sleep(4.0)

    results, failures = [], []

    def check(name, ok, detail=""):
        results.append((ok, name, detail))
        if not ok:
            failures.append(name)

    # ── 1. Nothing threw on load ───────────────────────────────────────────
    errs = ws.js("(window.__errs||[]).length") or 0
    ws.js("window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)))")
    check("no JS error captured after load", errs == 0, f"{errs} errors")

    # ── 2. The panel actually built its rows ───────────────────────────────
    steps = ws.js("document.querySelectorAll('#steps .step').length")
    check("panel rendered 5 steps (enforced run)", steps == 5, f"got {steps}")
    denied = ws.js("!!document.querySelector('#steps .step.is-deny')")
    check("a step is marked denied", bool(denied))

    # ── 3. The toggle changes the run ──────────────────────────────────────
    before = ws.js("document.querySelector('#verdict').textContent.slice(0,40)")
    ws.js("document.querySelector('.seg button[data-mode=\\'prompted\\']').click()")
    time.sleep(0.8)
    after = ws.js("document.querySelector('#verdict').textContent.slice(0,40)")
    n_prompted = ws.js("document.querySelectorAll('#steps .step').length")
    check("toggle swaps the verdict text", before != after, f"{before!r} -> {after!r}")
    check("prompted run has 4 steps", n_prompted == 4, f"got {n_prompted}")
    ws.js("document.querySelector('.seg button[data-mode=\\'enforced\\']').click()")
    time.sleep(0.5)

    # ── 4. The canvas actually paints ──────────────────────────────────────
    painted = ws.js("""(() => {
      const c = document.getElementById('field');
      const g = c.getContext('2d');
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 4) n++;
      return n;
    })()""")
    check("canvas field has painted pixels", painted > 500, f"{painted} non transparent px")

    # ── 5. Parallax: layers move, and by DIFFERENT amounts ─────────────────
    def sample(y):
        ws.js(f"window.scrollTo({{top:{y},behavior:'instant'}})")
        time.sleep(0.45)
        return ws.js("""(() => {
          const m = el => {
            if (!el) return null;
            const t = getComputedStyle(el).transform;
            if (!t || t === 'none') return 0;
            const p = t.match(/matrix.*\\((.+)\\)/);
            const v = p[1].split(', ').map(Number);
            return v.length === 6 ? v[5] : v[13];
          };
          return {
            hero: m(document.getElementById('top')),
            heroOpacity: parseFloat(getComputedStyle(document.getElementById('top')).opacity),
            mark: m(document.querySelector('.vista-mark')),
            cap:  m(document.querySelector('.vista-cap')),
            scrollY: Math.round(window.scrollY)
          };
        })()""")

    a = sample(0)
    b = sample(500)
    check("page actually scrolls", b["scrollY"] > 400, f"scrollY={b['scrollY']}")
    check("hero translates with scroll", abs(b["hero"] - a["hero"]) > 40,
          f"{a['hero']:.1f} -> {b['hero']:.1f}")
    check("hero fades as it leaves", b["heroOpacity"] < a["heroOpacity"] - 0.1,
          f"{a['heroOpacity']:.2f} -> {b['heroOpacity']:.2f}")

    # Put the vista band mid viewport, then move a little, and compare layers.
    vy = ws.js("Math.round(document.getElementById('vista').offsetTop - innerHeight/2)")
    c1 = sample(max(vy - 260, 0))
    c2 = sample(vy + 260)
    d_mark = abs(c2["mark"] - c1["mark"])
    d_cap = abs(c2["cap"] - c1["cap"])
    check("vista back mark travels", d_mark > 20, f"delta {d_mark:.1f}px")
    check("vista caption travels", d_cap > 20, f"delta {d_cap:.1f}px")
    check("layers travel at DIFFERENT rates (this is the parallax)",
          abs(d_mark - d_cap) > 15, f"mark {d_mark:.1f}px vs cap {d_cap:.1f}px")
    check("back mark moves opposite to the caption",
          (c2["mark"] - c1["mark"]) * (c2["cap"] - c1["cap"]) < 0,
          f"mark {c2['mark']-c1['mark']:.1f}, cap {c2['cap']-c1['cap']:.1f}")

    # ── 6. Canvas repaints as you scroll (the field parallaxes too) ────────
    def fingerprint():
        return ws.js("document.getElementById('field').toDataURL().length")
    ws.js("window.scrollTo({top:0,behavior:'instant'})"); time.sleep(0.5)
    f1 = ws.js("""(() => {const c=document.getElementById('field');
      const d=c.getContext('2d').getImageData(0,0,c.width,Math.min(c.height,400)).data;
      let s=0; for(let i=3;i<d.length;i+=40) s+=d[i]; return s;})()""")
    ws.js("window.scrollTo({top:900,behavior:'instant'})"); time.sleep(0.7)
    f2 = ws.js("""(() => {const c=document.getElementById('field');
      const d=c.getContext('2d').getImageData(0,0,c.width,Math.min(c.height,400)).data;
      let s=0; for(let i=3;i<d.length;i+=40) s+=d[i]; return s;})()""")
    check("canvas field repaints on scroll", f1 != f2, f"{f1} -> {f2}")

    # ── 7. Sticky header engages ───────────────────────────────────────────
    stuck = ws.js("document.querySelector('header.bar').classList.contains('stuck')")
    check("header hairline engages once scrolled", bool(stuck))

    # ── 8. No horizontal overflow ──────────────────────────────────────────
    ox = ws.js("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("no horizontal page scroll", ox <= 1, f"{ox}px overflow")

    print()
    for ok, name, detail in results:
        print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"   [{detail}]" if detail else ""))
    print(f"\n{len(results) - len(failures)}/{len(results)} passed")
    sys.exit(1 if failures else 0)

finally:
    proc.terminate()
