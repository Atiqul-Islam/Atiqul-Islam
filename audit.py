#!/usr/bin/env python3
"""Audit the page against measured standards, not opinions.

Sources, with population and date, so every number here can be argued with:
  WebAIM Million 2026, top 1,000,000 home pages: 95.9% have detected WCAG 2
    failures; low contrast 83.9%, missing alt 53.1%, missing form labels 51%,
    empty links 46.3%, empty buttons 30.6%, missing lang 13.5%. Those six are
    96% of all detected errors.
  web.dev Core Web Vitals: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at p75.
  NN/g eyetracking 2018: 57% of viewing time above the fold, 74% in the first
    two screenfuls, 81% in the first three.
  NN/g 2008: users read at most 28% of words, 20% likelier; half only under
    111 words. Time on page = 25s + 4.4s per 100 words.
  web.dev: parallax is named as a vestibular trigger. reduced motion is a
    requirement here, not a nicety.
"""
import base64, json, os, socket, struct, subprocess, sys, time, urllib.request

src = open(os.path.join(os.path.dirname(__file__), "verify.py"), encoding="utf-8").read()
ns = {}
exec(src.split("proc = subprocess.Popen")[0], ns)
WS, CHROME = ns["WS"], ns["CHROME"]
URL = sys.argv[1]
PORT = 9601

proc = subprocess.Popen(
    [CHROME, "--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
     f"--remote-debugging-port={PORT}", "--window-size=1440,900", "about:blank"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    ws_url = None
    for _ in range(60):
        try:
            for t in json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json")):
                if t.get("type") == "page":
                    ws_url = t["webSocketDebuggerUrl"]; break
            if ws_url: break
        except Exception: time.sleep(0.25)
    ws = WS(ws_url); ws.call("Page.enable"); ws.call("Runtime.enable")
    ws.call("Page.navigate", url=URL); time.sleep(5)

    rows, fails = [], []
    def chk(group, name, ok, detail=""):
        rows.append((group, ok, name, detail))
        if not ok: fails.append(name)

    # ── The six WebAIM categories, which are 96% of all detected errors ──
    a = ws.js("""(() => {
      const imgs = [...document.querySelectorAll('img')];
      const links = [...document.querySelectorAll('a')];
      const btns = [...document.querySelectorAll('button')];
      const inputs = [...document.querySelectorAll('input,select,textarea')];
      const named = el => (el.textContent||'').trim() || el.getAttribute('aria-label') ||
                          el.getAttribute('title') ||
                          [...el.querySelectorAll('img')].some(i=>i.alt) ||
                          !!el.querySelector('svg[aria-label]');
      return {
        lang: document.documentElement.lang || '',
        imgsNoAlt: imgs.filter(i => !i.hasAttribute('alt') && i.getAttribute('aria-hidden')!=='true').length,
        emptyLinks: links.filter(l => !named(l)).length,
        emptyButtons: btns.filter(b => !named(b)).length,
        unlabelled: inputs.filter(i => !i.labels?.length && !i.getAttribute('aria-label')).length,
        h1: document.querySelectorAll('h1').length,
        canvasHidden: [...document.querySelectorAll('canvas')].every(c => c.getAttribute('aria-hidden')==='true'),
      };
    })()""")
    chk("a11y", "document language set (13.5% of the web fails this)", a["lang"] != "", a["lang"])
    chk("a11y", "no images missing alt (53.1% fail)", a["imgsNoAlt"] == 0, f"{a['imgsNoAlt']}")
    chk("a11y", "no empty links (46.3% fail)", a["emptyLinks"] == 0, f"{a['emptyLinks']}")
    chk("a11y", "no empty buttons (30.6% fail)", a["emptyButtons"] == 0, f"{a['emptyButtons']}")
    chk("a11y", "no unlabelled inputs (51% fail)", a["unlabelled"] == 0, f"{a['unlabelled']}")
    chk("a11y", "exactly one h1", a["h1"] == 1, f"{a['h1']}")
    chk("a11y", "decorative canvas hidden from AT", a["canvasHidden"])

    # Contrast is the single most common failure at 83.9%. Check body and the
    # dimmed text, which is where a design like this usually loses it.
    # Chrome returns oklab() for these tokens, so parsing the numbers out of
    # the string treats L, a and b as RGB and yields nonsense. Painting the
    # colour onto a canvas and reading the pixel back resolves any CSS colour
    # format to real sRGB, which is the only reliable way to do this.
    con = ws.js("""(() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 1;
      const g = cv.getContext('2d', { willReadFrequently: true });
      const toRGB = (css) => { g.clearRect(0,0,1,1); g.fillStyle = '#000';
        g.fillStyle = css; g.fillRect(0,0,1,1);
        const d = g.getImageData(0,0,1,1).data; return [d[0],d[1],d[2]]; };
      const lum = (rgb) => { const [r,gg,b] = rgb.map(v => { v/=255;
        return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
        return 0.2126*r + 0.7152*gg + 0.0722*b; };
      const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p);
        return (x+0.05)/(y+0.05); };
      const bg = toRGB(getComputedStyle(document.body).backgroundColor);
      const out = {};
      const probe = (key, sel) => { const e = document.querySelector(sel);
        if (e) out[key] = +ratio(toRGB(getComputedStyle(e).color), bg).toFixed(2); };
      probe('body', 'main p');
      probe('dim', '#work article p + details, #work article .text-ink-dim');
      probe('heading', 'h2');
      probe('eyebrow', '.eyebrow');
      probe('link', 'footer a');
      return out;
    })()""")

    for k, v in (con or {}).items():
        chk("a11y", f"contrast {k} meets WCAG AA 4.5:1", v >= 4.5, f"{v}:1")

    # ── Core Web Vitals ──────────────────────────────────────────────────
    v = ws.js("""new Promise(res => {
      const out = {cls: 0, lcp: 0};
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) out.cls += e.value; })
        .observe({type:'layout-shift', buffered:true});
      new PerformanceObserver(l => { const e = l.getEntries().at(-1); if (e) out.lcp = e.startTime; })
        .observe({type:'largest-contentful-paint', buffered:true});
      setTimeout(() => res(out), 1200);
    })""")
    chk("perf", "LCP under 2.5s", v["lcp"] / 1000 < 2.5, f"{v['lcp']/1000:.2f}s")
    chk("perf", "CLS under 0.1", v["cls"] < 0.1, f"{v['cls']:.3f}")

    # ── Attention: 81% of viewing time is in the first three screenfuls ──
    att = ws.js("""(() => {
      const vh = innerHeight, three = vh * 3;
      const hit = (sel) => { const e = document.querySelector(sel); if (!e) return 1e9;
        return e.getBoundingClientRect().top + scrollY; };
      return { vh, three,
        name: hit('h1'), avail: hit('#contact') < three,
        work: hit('#work'), firstCard: hit('#work article') };
    })()""")
    chk("attention", "name and role in the first screenful", att["name"] < att["vh"], f"{att['name']:.0f}px")
    chk("attention", "first work item within three screenfuls (81% of viewing time)",
        att["firstCard"] < att["three"], f"{att['firstCard']:.0f}px of {att['three']:.0f}px")

    # ── Reading load ─────────────────────────────────────────────────────
    counted = ws.js("""(() => {
      const skip = new Set(['SCRIPT','STYLE','CANVAS','NAV','HEADER','FOOTER']);
      let prose = 0, labels = 0;
      const walk = (el) => {
        if (skip.has(el.tagName)) return;
        if (el.tagName === 'DETAILS') { const s = el.querySelector('summary');
          if (s) labels += s.textContent.trim().split(/\\s+/).length; return; }
        // Chips, status pills and eyebrows are scanned tokens, not running
        // text. The reading-time formula is about prose.
        const isLabel = el.tagName === 'SPAN' || el.tagName === 'DT' ||
          (el.className && String(el.className).includes('eyebrow'));
        for (const c of el.childNodes) {
          if (c.nodeType === 3) { const t = c.textContent.trim();
            if (t) { if (isLabel) labels += t.split(/\\s+/).length; else prose += t.split(/\\s+/).length; } }
          else if (c.nodeType === 1) walk(c);
        }
      };
      walk(document.querySelector('main')); return { prose, labels };
    })()""")
    words = counted["prose"]
    read_s = 25 + 4.4 * words / 100
    chk("content", "visible prose readable inside a long visit", read_s < 60,
        f"{words} prose words plus {counted['labels']} label words, {read_s:.0f}s")

    # ── Motion: parallax is a named vestibular trigger ───────────────────
    rm = ws.js("!!([...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => (r.conditionText||'').includes('prefers-reduced-motion')); } catch (e) { return false; } }))")
    chk("motion", "honours prefers-reduced-motion (parallax is a vestibular trigger)", bool(rm))

    group = None
    for g, ok, name, detail in rows:
        if g != group: print(f"\n  [{g}]"); group = g
        print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"   [{detail}]" if detail else ""))
    print(f"\n{len(rows)-len(fails)}/{len(rows)} passed")
    sys.exit(1 if fails else 0)
finally:
    proc.terminate()
