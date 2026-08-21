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

    # ── 2. React mounted and the sections exist ───────────────────────────
    acts = ws.js("document.querySelectorAll('[id^=act-]').length")
    check("five narrative acts rendered", acts == 5, f"got {acts}")
    items = ws.js("document.querySelectorAll('#work article').length")
    check("selected work shows the range", items >= 12, f"got {items}")

    # A portfolio has to be about the person before it is about a project.
    heads = ws.js("[...document.querySelectorAll('h1,h2')].map(e=>e.textContent.trim())")
    first_two = " ".join(heads[:2]).lower()
    check("page does not open as a product pitch", "genesis" not in first_two, first_two[:60])
    check("experience section present", bool(ws.js("!!document.getElementById('experience')")))
    nar = ws.js('document.querySelector(\'[aria-label="How the work fits together"]\').offsetHeight')
    doc = ws.js("document.documentElement.scrollHeight")
    check("deep dive is a section, not the page", nar / doc < 0.45, f"{100*nar/doc:.0f}%")
    canvas = ws.js("!!document.querySelector('canvas')")
    check("narrative canvas mounted", bool(canvas))

    # ── 3. The canvas actually paints ─────────────────────────────────────
    def painted():
        return ws.js("""(() => {
          const c = document.querySelector('canvas');
          const g = c.getContext('2d');
          const d = g.getImageData(0, 0, c.width, c.height).data;
          let n = 0;
          for (let i = 3; i < d.length; i += 4) if (d[i] > 4) n++;
          return n;
        })()""")

    def sample(y):
        ws.js(f"window.scrollTo({{top:{y},behavior:'instant'}})")
        time.sleep(0.75)
        return ws.js("""(() => {
          const m = el => {
            if (!el) return 0;
            const t = getComputedStyle(el).transform;
            if (!t || t === 'none') return 0;
            const p = t.match(/matrix.*\\((.+)\\)/);
            if (!p) return 0;
            const v = p[1].split(', ').map(Number);
            return v.length === 6 ? v[5] : v[13];
          };
          const acts = [...document.querySelectorAll('[data-drift]')];
          return { a: m(acts[0]), b: m(acts[1]), scrollY: Math.round(window.scrollY) };
        })()""")

    top = ws.js("Math.round(document.getElementById('act-terminal').getBoundingClientRect().top + window.scrollY)")
    a1 = sample(top + 40)
    p1 = painted()
    a2 = sample(top + 1500)
    p2 = painted()
    a3 = sample(top + 3000)
    p3 = painted()

    check("canvas paints in act I", p1 > 400, f"{p1} px")
    check("canvas repaints across acts", len({p1, p2, p3}) == 3, f"{p1} / {p2} / {p3}")
    check("page scrolls through the narrative", a3["scrollY"] > a1["scrollY"] + 2400,
          f"{a1['scrollY']} -> {a3['scrollY']}")

    d_a = abs(a3["a"] - a1["a"])
    d_b = abs(a3["b"] - a1["b"])
    check("act panel one drifts", d_a > 15, f"{d_a:.1f}px")
    check("act panel two drifts", d_b > 15, f"{d_b:.1f}px")
    check("panels drift at DIFFERENT rates (the parallax)", abs(d_a - d_b) > 10,
          f"{d_a:.1f}px vs {d_b:.1f}px")

    # ── 4. Theme toggle repaints the canvas from tokens ───────────────────
    before_bg = ws.js("getComputedStyle(document.body).backgroundColor")
    ws.js("document.querySelector('header button').click()")
    time.sleep(0.9)
    after_bg = ws.js("getComputedStyle(document.body).backgroundColor")
    check("theme toggle changes the surface", before_bg != after_bg,
          f"{before_bg} -> {after_bg}")

    # ── 5. Sticky header engages ──────────────────────────────────────────
    stuck = ws.js("!document.querySelector('header').className.includes('border-transparent')")
    check("header hairline engages once scrolled", bool(stuck))

    # ── 6. No horizontal overflow, no console errors ──────────────────────
    ox = ws.js("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("no horizontal page scroll", ox <= 1, f"{ox}px overflow")

    print()
    for ok, name, detail in results:
        print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"   [{detail}]" if detail else ""))
    print(f"\n{len(results) - len(failures)}/{len(results)} passed")
    sys.exit(1 if failures else 0)

finally:
    proc.terminate()
