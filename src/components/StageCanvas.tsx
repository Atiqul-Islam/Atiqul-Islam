import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The narrative stage.
 *
 * Three acts, scrubbed by scroll:
 *   I   a terminal, and Genesis building one agent out of it
 *   II  that agent becoming a supervisor with a team under it
 *   III a task arriving, an agent picking it up, and shipping a result
 *
 * The whole scene is drawn as a PURE FUNCTION of progress. Nothing accumulates
 * between frames and no state survives a draw, which is what makes scrubbing
 * backwards exact rather than approximately reversed. An animation that
 * integrates velocity per frame looks fine going down and falls apart the
 * moment someone flicks back up.
 */

const ACTS = 3;

/** Progress within one act, clamped, so each act can be written 0..1. */
const act = (p: number, i: number) => Math.min(Math.max(p * ACTS - i, 0), 1);
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const TERMINAL_LINES = [
  "$ genesis new agent",
  "  expertise  -> rules with ids",
  "  hooks      -> compiled, fail closed",
  "  memory     -> local, supersedes",
  "$ agent ready",
];

const TEAM = ["sql", "chat", "report", "chart", "review"];

export default function StageCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progress = useRef(0);

  useGSAP(
    () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { alpha: true })!;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let w = 0;
      let h = 0;
      let tone = "47,111,94";
      let aDot = 0.13;
      let aNode = 0.34;
      let aLine = 0.16;

      const readTokens = () => {
        const cs = getComputedStyle(document.documentElement);
        tone = (cs.getPropertyValue("--viz").trim() || "47 111 94").replace(/\s+/g, ",");
        aDot = parseFloat(cs.getPropertyValue("--viz-a-dot")) || 0.13;
        aNode = parseFloat(cs.getPropertyValue("--viz-a-node")) || 0.34;
        aLine = parseFloat(cs.getPropertyValue("--viz-a-line")) || 0.16;
      };

      const rgba = (a: number) => `rgba(${tone},${Math.max(a, 0)})`;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
      };

      /* ── Act I: the terminal, and one agent coming out of it ───────────── */
      function drawTerminal(p: number, cx: number, cy: number) {
        const open = ease(Math.min(p / 0.25, 1));
        if (open <= 0) return;

        const bw = Math.min(w * 0.34, 460) * open;
        const bh = Math.min(h * 0.34, 260) * open;
        const x = cx - bw / 2;
        const y = cy - bh / 2;

        ctx.strokeStyle = rgba(aLine * 2.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, 10);
        ctx.stroke();

        // Window chrome, three dots.
        ctx.fillStyle = rgba(aLine * 2.4);
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(x + 16 + i * 13, y + 15, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.lineTo(x + bw, y + 30);
        ctx.stroke();

        if (open < 1) return;

        // Lines type in across the middle half of the act.
        const typed = Math.min(Math.max((p - 0.2) / 0.55, 0), 1) * TERMINAL_LINES.length;
        ctx.font = `${Math.max(11, Math.min(13, bw / 36))}px ${
          getComputedStyle(document.body).getPropertyValue("--font-mono") || "monospace"
        }`;
        ctx.textBaseline = "middle";

        TERMINAL_LINES.forEach((line, i) => {
          const t = Math.min(Math.max(typed - i, 0), 1);
          if (t <= 0) return;
          const chars = Math.round(line.length * t);
          ctx.fillStyle = rgba(line.startsWith("$") ? aNode * 1.5 : aNode * 0.85);
          ctx.fillText(line.slice(0, chars), x + 16, y + 52 + i * 20);
          if (t < 1) {
            const cw = ctx.measureText(line.slice(0, chars)).width;
            ctx.fillStyle = rgba(aNode * 1.6);
            ctx.fillRect(x + 17 + cw, y + 45 + i * 20, 6, 13);
          }
        });
      }

      /** The agent that Genesis produced. Also the seed for act II. */
      function drawSeed(p: number, cx: number, cy: number, r: number) {
        if (p <= 0) return;
        const grow = ease(p);
        ctx.fillStyle = rgba(aNode * grow);
        ctx.beginPath();
        ctx.arc(cx, cy, r * grow, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = rgba(aLine * 2.4 * grow);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r * grow + 9 + (1 - grow) * 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* ── Act II: the seed becomes a supervisor with a team ─────────────── */
      function teamPositions(cx: number, cy: number, spread: number) {
        return TEAM.map((label, i) => {
          const a = (i / TEAM.length) * Math.PI * 2 - Math.PI / 2;
          return {
            label,
            x: cx + Math.cos(a) * spread,
            y: cy + Math.sin(a) * spread,
          };
        });
      }

      function drawTeam(p: number, cx: number, cy: number, radius: number) {
        if (p <= 0) return;
        const out = ease(p);
        const nodes = teamPositions(cx, cy, radius * out);

        ctx.lineWidth = 1;
        nodes.forEach((n, i) => {
          const t = Math.min(Math.max(p * TEAM.length - i * 0.55, 0), 1);
          if (t <= 0) return;
          ctx.strokeStyle = rgba(aLine * t);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(lerp(cx, n.x, t), lerp(cy, n.y, t));
          ctx.stroke();

          ctx.fillStyle = rgba(aNode * t);
          ctx.beginPath();
          ctx.arc(n.x, n.y, 4 * t, 0, Math.PI * 2);
          ctx.fill();
        });
        return nodes;
      }

      /* ── Act III: a task arrives, is routed, gets implemented ──────────── */
      function drawTask(p: number, cx: number, cy: number, radius: number) {
        if (p <= 0) return;
        const nodes = teamPositions(cx, cy, radius);
        const target = nodes[2];

        // 0.00-0.30 the task travels in from the left edge to the supervisor
        // 0.30-0.55 the supervisor routes it to one agent
        // 0.55-0.85 that agent works
        // 0.85-1.00 a result returns to the supervisor
        const inbound = Math.min(p / 0.3, 1);
        const routed = Math.min(Math.max((p - 0.3) / 0.25, 0), 1);
        const working = Math.min(Math.max((p - 0.55) / 0.3, 0), 1);
        const back = Math.min(Math.max((p - 0.85) / 0.15, 0), 1);

        const startX = -60;
        const startY = cy + radius * 0.75;

        let tx: number;
        let ty: number;
        if (routed <= 0) {
          tx = lerp(startX, cx, ease(inbound));
          ty = lerp(startY, cy, ease(inbound));
        } else {
          tx = lerp(cx, target.x, ease(routed));
          ty = lerp(cy, target.y, ease(routed));
        }

        // The task card itself.
        const cardW = 74;
        const cardH = 22;
        ctx.fillStyle = rgba(aNode * 0.9);
        ctx.strokeStyle = rgba(aLine * 3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tx - cardW / 2, ty - cardH / 2, cardW, cardH, 5);
        ctx.stroke();
        ctx.fillStyle = rgba(aNode * 0.55);
        ctx.fillRect(tx - cardW / 2 + 7, ty - 4, 30, 2);
        ctx.fillRect(tx - cardW / 2 + 7, ty + 2, 46, 2);

        // The working agent pulses while it implements.
        if (working > 0) {
          const pulse = Math.sin(working * Math.PI * 5) * 0.5 + 0.5;
          ctx.strokeStyle = rgba(aLine * (1.5 + pulse * 3));
          ctx.beginPath();
          ctx.arc(target.x, target.y, 10 + pulse * 9, 0, Math.PI * 2);
          ctx.stroke();
        }

        // The result travelling back up to the supervisor.
        if (back > 0) {
          const rx = lerp(target.x, cx, ease(back));
          const ry = lerp(target.y, cy, ease(back));
          ctx.fillStyle = rgba(0.9);
          ctx.beginPath();
          ctx.arc(rx, ry, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ── Ambient depth, present in every act ───────────────────────────── */
      function drawLattice(p: number) {
        const step = w < 700 ? 58 : 76;
        const drift = (p * h * 0.5) % step;
        ctx.fillStyle = rgba(aDot);
        for (let x = step / 2; x < w + step; x += step) {
          for (let y = -step; y < h + step; y += step) {
            ctx.beginPath();
            ctx.arc(x, y + drift, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      function draw() {
        if (!w || !h) return;
        const p = progress.current;
        ctx.clearRect(0, 0, w, h);
        readTokens();

        drawLattice(p);

        const cx = w < 900 ? w * 0.5 : w * 0.71;
        const cy = h * 0.47;
        const radius = Math.min(w, h) * (w < 700 ? 0.26 : 0.23);

        const a1 = act(p, 0);
        const a2 = act(p, 1);
        const a3 = act(p, 2);

        // The terminal fades out as the agent it produced takes over.
        if (a1 > 0 && a2 < 0.35) {
          ctx.globalAlpha = 1 - ease(Math.min(a2 / 0.35, 1));
          drawTerminal(a1, cx, cy);
          ctx.globalAlpha = 1;
        }

        const seed = Math.min(Math.max((a1 - 0.62) / 0.38, 0), 1);
        if (seed > 0 || a2 > 0) {
          drawSeed(Math.max(seed, a2 > 0 ? 1 : 0), cx, cy, 6.5);
        }

        if (a2 > 0) drawTeam(a2, cx, cy, radius);
        if (a3 > 0) drawTask(a3, cx, cy, radius);
      }

      readTokens();
      resize();
      window.addEventListener("resize", resize, { passive: true });

      // One ScrollTrigger scrubs the whole narrative. `scrub: 0.6` softens the
      // link so a flick does not snap the scene, without letting it drift out
      // of sync with the scrollbar the way a tween-per-section would.
      const st = ScrollTrigger.create({
        trigger: wrapRef.current!,
        start: "top top",
        end: "bottom bottom",
        scrub: reduced ? true : 0.6,
        onUpdate: (self) => {
          progress.current = self.progress;
          draw();
        },
      });

      // A theme flip changes the tokens the canvas reads, so repaint on it.
      const mo = new MutationObserver(draw);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      return () => {
        window.removeEventListener("resize", resize);
        mo.disconnect();
        st.kill();
      };
    },
    { scope: wrapRef },
  );

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 -z-10">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="sticky top-0 h-screen w-full"
        style={{
          maskImage:
            "radial-gradient(ellipse 110% 80% at 60% 40%, #000 45%, transparent 92%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 110% 80% at 60% 40%, #000 45%, transparent 92%)",
        }}
      />
    </div>
  );
}
