import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The narrative stage: an autonomous agentic system building itself, scrubbed
 * by scroll.
 *
 *   Act I    Genesis is installed from a terminal, and it spawns one agent
 *            whose rules arm a hook
 *   Act II   that agent uses Genesis to build more agents. The recursion is
 *            the point, and it is the claim a reader can actually check,
 *            because Genesis is self hosting
 *   Act III  the agents it built run as an autonomous agentic system. A task
 *            arrives, a write is DENIED, the agent cites the rule with
 *            evidence, tests pass, it merges. No person in the loop
 *
 * Three decisions hold this up.
 *
 * Everything is a PURE FUNCTION of progress. Nothing accumulates between frames
 * and no state survives a draw, which is what makes scrubbing backwards exact
 * rather than approximately reversed. An animation that integrates per frame
 * looks right going down and falls apart on a flick back up.
 *
 * Nothing is ever swapped for something else. The terminal shrinks and stays,
 * the first agent becomes the supervisor, and the agents it built settle into
 * the panes that run the task. Each act inherits the objects of the last, so
 * there is no cut to bridge. An earlier version cross faded two different
 * boxes, and that read as exactly what it was.
 *
 * The scene is authored at a fixed size and scaled into whatever box the
 * viewport allows, so every coordinate below is in scene units and the
 * composition cannot drift apart at an unusual window size.
 */

const SW = 520;
const SH = 520;
const ACT_COUNT = 5;

const clamp = (v: number, a = 0, b = 1) => Math.min(Math.max(v, a), b);
/** Progress within one act, so each act can be authored 0..1. */
const act = (p: number, i: number) => clamp(p * ACT_COUNT - i);
/** Progress of one beat inside an act. */
const beat = (p: number, from: number, to: number) => clamp((p - from) / (to - from));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const INSTALL = [
  { text: "$ /plugin marketplace add Atiqul-Islam/genesis", cmd: true },
  { text: "  added  genesis@genesis", cmd: false },
  { text: "$ /plugin install genesis@genesis", cmd: true },
  { text: "  genesis ready  ·  17 releases", cmd: false },
];

/** Where the built agents appear in act II, and where they sit once deployed.
    The system keeps the same three boxes the whole way through; only the frame
    around them changes. */
const SLOTS = [
  { name: "method", x: 8, deployX: 38 },
  { name: "mneme", x: 184, deployX: 200 },
  { name: "atlas", x: 360, deployX: 362 },
];

// The deployed frame, and the phone that talks to what is inside it.
const CLOUD = { x: 16, y: 30, w: 488, h: 440 };
const SUP_DEPLOYED = { x: 36, y: 58, w: 448, h: 48 };
// Act IV gives the phone the whole stage, so it is drawn at a size a reader
// can actually read the conversation in.
const PHONE = { x: 146, y: 46, w: 228, h: 420 };

const DIFF = [
  { sign: "+", w: 80 },
  { sign: "+", w: 108 },
  { sign: "-", w: 62 },
  { sign: "+", w: 94 },
];

// The boxes the scene lerps between, so nothing ever cuts.
const TERM_BIG = { x: 34, y: 96, w: 452, h: 214 };
const TERM_SMALL = { x: 20, y: 40, w: 220, h: 56 };
const AGENT_BORN = { x: 158, y: 350, w: 204, h: 86 };
const AGENT_BUILDER = { x: 158, y: 40, w: 204, h: 56 };

type Rect = { x: number; y: number; w: number; h: number };
const between = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
});

export default function StageCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progress = useRef(0);
  const scene = useRef("hero");
  const scrolled = useRef(0);
  const anchor = useRef<number | null>(null);

  useGSAP(
    () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { alpha: true })!;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let w = 0;
      let h = 0;
      let tone = "47,111,94";
      let deny = "150,52,62";
      let aDot = 0.13;
      let mono = "'JetBrains Mono', ui-monospace, monospace";

      /* The scene is the subject, not the wallpaper, so it does not inherit the
         ambient lattice alphas. At that weight the terminal was present but
         unreadable, which is exactly how it looked. */
      const A = { line: 0.66, text: 1, dim: 0.62, faint: 0.36 };

      const readTokens = () => {
        const cs = getComputedStyle(document.documentElement);
        tone = (cs.getPropertyValue("--viz").trim() || "47 111 94").replace(/\s+/g, ",");
        deny = (cs.getPropertyValue("--viz-deny").trim() || "150 52 62").replace(/\s+/g, ",");
        aDot = parseFloat(cs.getPropertyValue("--viz-a-dot")) || 0.13;
      };

      const c = (a: number) => `rgba(${tone},${Math.max(a, 0)})`;
      const cDeny = (a: number) => `rgba(${deny},${Math.max(a, 0)})`;

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

      /* ── primitives ─────────────────────────────────────────────────────── */

      const panel = (r: Rect, a = 1, radius = 8) => {
        ctx.strokeStyle = c(A.line * a);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, r.w, r.h, radius);
        ctx.stroke();
      };

      const chrome = (r: Rect, a = 1) => {
        ctx.fillStyle = c(A.line * 1.3 * a);
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(r.x + 13 + i * 11, r.y + 13, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = c(A.line * 0.85 * a);
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + 26);
        ctx.lineTo(r.x + r.w, r.y + 26);
        ctx.stroke();
      };

      const label = (text: string, x: number, y: number, size: number, a: number, col = c) => {
        ctx.font = `${size}px ${mono}`;
        ctx.textBaseline = "middle";
        ctx.fillStyle = col(a);
        ctx.fillText(text, x, y);
      };

      const typed = (text: string, x: number, y: number, size: number, t: number, a: number) => {
        if (t <= 0) return;
        const n = Math.round(text.length * clamp(t));
        label(text.slice(0, n), x, y, size, a);
        if (t < 1) {
          ctx.font = `${size}px ${mono}`;
          ctx.fillStyle = c(A.text);
          ctx.fillRect(
            x + ctx.measureText(text.slice(0, n)).width + 1,
            y - size * 0.5,
            size * 0.5,
            size,
          );
        }
      };

      const bar = (x: number, y: number, bw: number, a: number, col = c) => {
        ctx.fillStyle = col(a);
        ctx.fillRect(x, y, bw, 2);
      };

      const check = (x: number, y: number, a: number, col = c) => {
        ctx.strokeStyle = col(a);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x - 0.5, y + 2.8);
        ctx.lineTo(x + 3.6, y - 2.8);
        ctx.stroke();
      };

      const chip = (text: string, x: number, y: number, a: number, col = c) => {
        if (a <= 0) return;
        ctx.strokeStyle = col(A.line * 1.5 * a);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y - 9, 54, 18, 9);
        ctx.stroke();
        label(text, x + 9, y, 9.5, A.text * 0.9 * a, col);
      };

      /** A link from a parent box to a child, drawn as it forms. */
      const link = (fromX: number, fromY: number, toX: number, toY: number, t: number) => {
        if (t <= 0) return;
        ctx.strokeStyle = c(A.line * 0.9 * t);
        ctx.lineWidth = 1;
        const midY = lerp(fromY, toY, 0.5);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.bezierCurveTo(fromX, midY, toX, midY, toX, lerp(fromY, toY, easeOut(t)));
        ctx.stroke();
      };

      const agentCard = (r: Rect, name: string, a: number, rules = false) => {
        panel(r, a);
        label(name, r.x + 14, r.y + 20, 11, A.text * a);
        if (rules && r.h > 60) {
          chip("pt-3", r.x + 14, r.y + 52, a);
          chip("rct-24", r.x + 74, r.y + 52, a);
        }
      };

      /* ── Act I: install genesis, and it spawns an agent ─────────────────── */
      function actOne(p: number) {
        const open = easeOut(beat(p, 0, 0.12));
        if (open <= 0) return;

        const r: Rect = {
          x: TERM_BIG.x + (TERM_BIG.w * (1 - open)) / 2,
          y: TERM_BIG.y + (TERM_BIG.h * (1 - open)) / 2,
          w: TERM_BIG.w * open,
          h: TERM_BIG.h * open,
        };
        panel(r);
        if (open < 1) return;
        chrome(r);

        INSTALL.forEach((line, i) => {
          const t = beat(p, 0.14 + i * 0.1, 0.3 + i * 0.1);
          typed(line.text, r.x + 14, r.y + 50 + i * 26, 10.5, t, line.cmd ? A.text : A.dim);
        });

        // The install produces one agent, which drops out of the terminal.
        const born = beat(p, 0.62, 0.86);
        if (born > 0) {
          link(
            r.x + r.w / 2,
            r.y + r.h,
            AGENT_BORN.x + AGENT_BORN.w / 2,
            AGENT_BORN.y,
            born,
          );
          agentCard(AGENT_BORN, "agent · sensei", easeOut(born), true);
        }

        // Its rules arm the hook. The thesis, in one badge.
        const armed = beat(p, 0.86, 1);
        if (armed > 0) {
          const pulse = 0.55 + Math.sin(armed * Math.PI) * 0.45;
          ctx.strokeStyle = c(A.line * 2 * armed * pulse);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(AGENT_BORN.x - 4, AGENT_BORN.y - 4, AGENT_BORN.w + 8, AGENT_BORN.h + 8, 11);
          ctx.stroke();
          label("hook armed", AGENT_BORN.x + AGENT_BORN.w + 14, AGENT_BORN.y + 20, 10, A.text * armed);
        }
      }

      /* ── Act II: that agent uses genesis to build more agents ───────────── */
      function actTwo(p: number) {
        // The terminal shrinks into the corner and stays. It is never replaced.
        const shrink = easeOut(beat(p, 0, 0.26));
        // It has done its job by the end of this act, so it leaves rather than
        // parking in the corner behind everything that follows.
        const termOut = 1 - beat(p, 0.62, 0.86);
        const term = between(TERM_BIG, TERM_SMALL, shrink);
        panel(term, termOut);
        chrome(term, termOut);
        if (shrink < 0.6) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(term.x, term.y, term.w, term.h, 8);
          ctx.clip();
          const fade = (1 - shrink / 0.6) * termOut;
          INSTALL.forEach((line, i) =>
            label(
              line.text,
              term.x + 14,
              term.y + 50 + i * 26,
              10.5,
              (line.cmd ? A.text : A.dim) * fade,
            ),
          );
          ctx.restore();
        } else {
          label("terminal", term.x + 14, term.y + 42, 10, A.dim * termOut);
        }

        // The agent it produced rises and becomes the builder.
        const rise = easeOut(beat(p, 0.06, 0.34));
        const builder = between(AGENT_BORN, AGENT_BUILDER, rise);
        agentCard(builder, "sensei · runs genesis", 1, rise < 0.45);

        // It runs genesis once per agent, and each appears beneath it.
        SLOTS.forEach((slot, i) => {
          const t = beat(p, 0.32 + i * 0.15, 0.62 + i * 0.15);
          if (t <= 0) return;
          const childY = 236;
          const grown = easeOut(t);
          const child: Rect = { x: slot.x, y: childY, w: 152, h: 104 };

          link(
            builder.x + builder.w / 2,
            builder.y + builder.h,
            child.x + child.w / 2,
            childY,
            clamp(t * 1.7),
          );
          agentCard({ ...child, h: child.h * grown }, slot.name, grown);

          const chipT = beat(t, 0.55, 0.92);
          chip("pt-3", child.x + 12, childY + 66, chipT);
          chip("ecf-5", child.x + 72, childY + 66, chipT);
          if (t >= 1) check(child.x + child.w - 18, childY + 20, A.text);
        });

        // Said out loud, so the recursion is legible rather than implied.
        const note = beat(p, 0.72, 0.94);
        if (note > 0) {
          label("genesis builds the agents that build with genesis", 12, SH - 34, 10.5, A.dim * note);
        }
      }

      /* ── The deployed system, shared by acts III onward ─────────────────
         Drawn once and reused, so the boxes a reader learned in act II are
         literally the same boxes for the rest of the story. */
      function system(deployT: number, opts: { cloud?: number } = {}) {
        const cloudT = opts.cloud ?? 0;
        if (cloudT > 0) {
          ctx.setLineDash([5, 4]);
          panel(
            { x: CLOUD.x, y: CLOUD.y, w: CLOUD.w * easeOut(cloudT), h: CLOUD.h },
            cloudT * 0.85,
            14,
          );
          ctx.setLineDash([]);
          label("aws  ·  eks", CLOUD.x + 14, CLOUD.y - 11, 10.5, A.text * 0.85 * cloudT);
        }

        const sup = between(AGENT_BUILDER, SUP_DEPLOYED, deployT);
        panel(sup);
        label("sensei · supervisor", sup.x + 16, sup.y + 24, 11, A.text);
        const dotP = 0.55 + Math.sin(deployT * Math.PI * 6) * 0.45;
        ctx.fillStyle = c(A.text * dotP);
        ctx.beginPath();
        ctx.arc(sup.x + sup.w - 20, sup.y + 24, 3.2, 0, Math.PI * 2);
        ctx.fill();

        const panes = SLOTS.map((slot) => ({
          name: slot.name,
          r: {
            x: lerp(slot.x, slot.deployX, deployT),
            y: lerp(236, 150, deployT),
            w: lerp(152, 140, deployT),
            h: lerp(104, 150, deployT),
          } as Rect,
        }));

        panes.forEach((pane) => {
          link(sup.x + sup.w / 2, sup.y + sup.h, pane.r.x + pane.r.w / 2, pane.r.y, deployT);
          panel(pane.r);
          label(pane.name, pane.r.x + 14, pane.r.y + 20, 11, A.text);
        });
        return { sup, panes };
      }

      /** The badge on the deployed frame, so AWS stays named after act III. */
      const cloudLabel = (a: number) => {
        label("aws  ·  eks", CLOUD.x + 14, CLOUD.y - 11, 10.5, A.text * 0.85 * a);
        label("healthy · live", CLOUD.x + CLOUD.w - 92, CLOUD.y - 11, 10, A.text * 0.85 * a);
      };

      /* ── Act III: the system ships to AWS ───────────────────────────────── */
      function actThree(p: number) {
        const move = easeOut(beat(p, 0, 0.28));
        const cloud = beat(p, 0.16, 0.44);
        const { panes } = system(move, { cloud });

        // A rollout bar, then health checks, then it is live. The same shape
        // any other service gets, which is the point being made.
        const rollout = beat(p, 0.46, 0.72);
        if (rollout > 0) {
          const bx = CLOUD.x + 16;
          const by = CLOUD.y + CLOUD.h - 40;
          ctx.strokeStyle = c(A.line);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(bx, by, CLOUD.w - 32, 10, 5);
          ctx.stroke();
          ctx.fillStyle = c(A.line * 1.5);
          ctx.beginPath();
          ctx.roundRect(bx + 2, by + 2, (CLOUD.w - 36) * easeOut(rollout), 6, 3);
          ctx.fill();
          label("deploying to aws  ·  v1.4.0", bx, by - 14, 10, A.dim * rollout);
        }

        const health = beat(p, 0.7, 0.9);
        panes.forEach((pane, i) => {
          const t = beat(health, i / 3, (i + 1) / 3);
          if (t > 0) check(pane.r.x + pane.r.w - 18, pane.r.y + 20, A.text * t);
        });

        const live = beat(p, 0.88, 1);
        if (live > 0) {
          label("healthy · live", CLOUD.x + CLOUD.w - 92, CLOUD.y - 11, 10, A.text * 0.85 * live);
        }
      }

      /** The phone, drawn at whatever offset act IV or act V needs. */
      function phone(dx: number, a: number, p: number) {
        if (a <= 0) return;
        const ph: Rect = { x: PHONE.x + dx, y: PHONE.y, w: PHONE.w, h: PHONE.h };
        panel(ph, a, 22);
        ctx.strokeStyle = c(A.line * a);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ph.x + ph.w / 2 - 16, ph.y + 16);
        ctx.lineTo(ph.x + ph.w / 2 + 16, ph.y + 16);
        ctx.stroke();

        // Conversation header, so it reads as a chat app and not a form.
        ctx.strokeStyle = c(A.line * 0.7 * a);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ph.x, ph.y + 54);
        ctx.lineTo(ph.x + ph.w, ph.y + 54);
        ctx.stroke();
        ctx.fillStyle = c(A.line * 1.2 * a);
        ctx.beginPath();
        ctx.arc(ph.x + 26, ph.y + 36, 8, 0, Math.PI * 2);
        ctx.fill();
        label("sensei", ph.x + 42, ph.y + 36, 11, A.text * a);

        const L = ph.x + 16;
        const R = ph.x + ph.w - 16;

        // Their message, right aligned and filled, the way a sent message reads.
        const ask = beat(p, 0.18, 0.46);
        if (ask > 0) {
          const bw = 172;
          const bx = R - bw;
          ctx.fillStyle = c(A.line * 0.55 * a * ask);
          ctx.beginPath();
          ctx.roundRect(bx, ph.y + 76, bw, 56, 12);
          ctx.fill();
          typed("the weekly report", bx + 12, ph.y + 96, 10.5, beat(ask, 0, 0.55), A.text * a);
          typed("is stale", bx + 12, ph.y + 114, 10.5, beat(ask, 0.5, 1), A.text * a);
        }

        // The agent answering, left aligned and outlined.
        const reply = beat(p, 0.44, 0.74);
        if (reply > 0) {
          const bw = 186;
          ctx.strokeStyle = c(A.line * 1.3 * a * reply);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(L, ph.y + 148, bw, 74, 12);
          ctx.stroke();
          typed("source table stopped", L + 12, ph.y + 168, 10.5, beat(reply, 0, 0.5), A.text * 0.92 * a);
          typed("updating on friday.", L + 12, ph.y + 186, 10.5, beat(reply, 0.35, 0.8), A.text * 0.92 * a);
          typed("i'll take it.", L + 12, ph.y + 204, 10.5, beat(reply, 0.7, 1), A.text * 0.92 * a);
        }

        // It becomes a task, in the conversation, where they can see it.
        const made = beat(p, 0.74, 0.94);
        if (made > 0) {
          ctx.strokeStyle = c(A.line * 1.6 * a * made);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(L, ph.y + 238, 150, 38, 8);
          ctx.stroke();
          label("TASK-418", L + 12, ph.y + 252, 10.5, A.text * a * made);
          bar(L + 12, ph.y + 264, 96 * made, A.dim * a);
          check(L + 132, ph.y + 252, A.text * a * beat(made, 0.6, 1));
        }
      }

      /* ── Act IV: a person asks for something, from their phone ───────────
         The phone has the stage to itself. Putting the system beside it split
         the reader's attention across two things that happen at different
         times, and neither one landed. */
      function actFour(p: number) {
        const slide = easeOut(beat(p, 0, 0.18));
        const leaving = beat(p, 0.9, 1);
        phone(lerp(-SW, 0, slide) + lerp(0, -SW * 0.55, easeOut(leaving)), 1 - leaving * 0.5, p);

        // The system starts arriving as the phone starts to leave, so act V
        // does not begin on a cut.
        if (leaving > 0) {
          const arrive = easeOut(leaving);
          ctx.save();
          ctx.globalAlpha *= arrive;
          ctx.translate(SW * (1 - arrive) * 0.5, 0);
          system(1, { cloud: 1 });
          cloudLabel(1);
          ctx.restore();
        }
      }

      /* ── Act V: the task is picked up and shipped, under enforcement ────── */
      function actFive(p: number) {
        const { panes } = system(1, { cloud: 1 });
        cloudLabel(1);
        const settle = 1;

        // The phone finishes leaving across the first beat of this act.
        const exiting = 1 - beat(p, 0, 0.12);
        if (exiting > 0) phone(-SW * 0.55 - SW * 0.45 * (1 - exiting), exiting * 0.5, 1);

        const named = beat(p, 0.1, 0.24);
        if (named > 0) {
          label("autonomous agentic system", CLOUD.x, SH - 30, 10.5, A.dim * named);
        }

        panes.forEach((pane, i) => {
          for (let l = 0; l < 3; l++) {
            const lt = beat(p, 0.06 + i * 0.05 + l * 0.03, 0.22 + i * 0.05 + l * 0.03);
            if (lt > 0) {
              bar(pane.r.x + 14, pane.r.y + 40 + l * 11, (30 + ((i * 11 + l * 29) % 62)) * lt, A.faint);
            }
          }
        });
        void settle;

        const target = panes[1].r;

        const inbound = beat(p, 0.2, 0.36);
        const routed = beat(p, 0.36, 0.48);
        const working = beat(p, 0.48, 0.66);
        const denied = beat(p, 0.66, 0.76);
        const cited = beat(p, 0.76, 0.86);
        const tests = beat(p, 0.86, 0.95);
        const done = beat(p, 0.95, 1);

        if (inbound > 0) {
          const cw = 128;
          const ch = 32;
          const cx =
            routed <= 0
              ? lerp(CLOUD.x - cw, CLOUD.x + CLOUD.w / 2 - cw / 2, easeOut(inbound))
              : lerp(CLOUD.x + CLOUD.w / 2 - cw / 2, target.x + target.w / 2 - cw / 2, easeOut(routed));
          const cy = routed <= 0 ? CLOUD.y + CLOUD.h / 2 : lerp(CLOUD.y + CLOUD.h / 2, target.y - 22, easeOut(routed));
          ctx.strokeStyle = c(A.line * 1.4);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(cx, cy - ch / 2, cw, ch, 6);
          ctx.stroke();
          label("TASK-418", cx + 12, cy - 5, 10, A.text);
          bar(cx + 12, cy + 8, 78, A.dim);
        }

        if (working > 0) {
          ctx.strokeStyle = c(A.line * 2 * working);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(target.x, target.y, target.w, target.h, 8);
          ctx.stroke();
          DIFF.forEach((d, i) => {
            const t = beat(working, i * 0.18, 0.34 + i * 0.18);
            if (t <= 0) return;
            const y = target.y + 42 + i * 13;
            const col = d.sign === "-" ? cDeny : c;
            label(d.sign, target.x + 14, y, 10, A.text * 0.9 * t, col);
            bar(target.x + 26, y - 1, d.w * t, A.dim * t, col);
          });
        }

        // The write is denied. This is the argument, so it carries the weight.
        const denyLabel = denied * clamp(1 - cited * 2.2);
        if (denied > 0 && denyLabel > 0.02) {
          const a = denyLabel;
          ctx.fillStyle = cDeny(0.16 * a);
          ctx.beginPath();
          ctx.roundRect(target.x, target.y, target.w, target.h, 8);
          ctx.fill();
          ctx.strokeStyle = cDeny(0.9 * a);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.roundRect(target.x - 4, target.y - 4, target.w + 8, target.h + 8, 11);
          ctx.stroke();
          label("DENIED · pt-3", target.x + 12, target.y + target.h - 15, 9, 0.95 * a, cDeny);
        }

        const citeLabel = clamp((cited - 0.45) / 0.55);
        if (citeLabel > 0) {
          label(
            "cites pt-3 + evidence",
            target.x + 12,
            target.y + target.h - 15,
            9,
            A.text * citeLabel,
          );
        }

        if (tests > 0) {
          for (let i = 0; i < 8; i++) {
            const t = beat(tests, i / 8, (i + 1) / 8);
            if (t > 0) check(target.x + 20 + i * 17, target.y + target.h + 20, A.text * t);
          }
        }

        if (done > 0) {
          const bx = target.x + target.w / 2 - 64;
          ctx.strokeStyle = c(A.line * 1.6 * done);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(bx, target.y + target.h + 34, 128, 28, 6);
          ctx.stroke();
          label("merged  4f2a91c", bx + 12, target.y + target.h + 48, 10, A.text * done);
        }
      }


      /* ── Scene: embedded, for the flight software ────────────────────────
         A board rather than an abstraction. The bus labels and the peripherals
         are the vocabulary of the work, and an orbit arc says where it went. */
      function sceneEmbedded(p: number) {
        const board: Rect = { x: 40, y: 150, w: 440, h: 250 };
        const draw = easeOut(beat(p, 0, 0.2));
        if (draw <= 0) return;
        panel({ ...board, h: board.h * draw }, 1, 12);

        // The orbit, and something on it.
        const orb = beat(p, 0.1, 1);
        ctx.strokeStyle = c(A.line * 0.7);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.ellipse(SW / 2, 96, 210, 52, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        const oa = Math.PI + Math.PI * clamp(orb);
        ctx.fillStyle = c(A.text);
        ctx.beginPath();
        ctx.arc(SW / 2 + Math.cos(oa) * 210, 96 + Math.sin(oa) * 52, 4, 0, Math.PI * 2);
        ctx.fill();
        label("orbit", SW / 2 - 20, 40, 10, A.dim * beat(p, 0.05, 0.2));

        if (draw < 1) return;

        // The MCU.
        const mcu: Rect = { x: 190, y: 250, w: 140, h: 76 };
        panel(mcu);
        label("MSP430", mcu.x + 16, mcu.y + 26, 11, A.text);
        label("FreeRTOS", mcu.x + 16, mcu.y + 48, 10, A.dim);

        // Pins, because a chip without them reads as a box.
        ctx.strokeStyle = c(A.line * 1.2);
        for (let i = 0; i < 6; i++) {
          const y = mcu.y + 14 + i * 11;
          ctx.beginPath();
          ctx.moveTo(mcu.x - 7, y);
          ctx.lineTo(mcu.x, y);
          ctx.moveTo(mcu.x + mcu.w, y);
          ctx.lineTo(mcu.x + mcu.w + 7, y);
          ctx.stroke();
        }

        const parts = [
          { name: "FRAM", bus: "SPI", x: 62, y: 190 },
          { name: "RADIO", bus: "SPI", x: 348, y: 190 },
          { name: "SENSOR", bus: "I2C", x: 62, y: 336 },
          { name: "OBC BUS", bus: "I2C", x: 348, y: 336 },
        ];
        parts.forEach((part, i) => {
          const t = easeOut(beat(p, 0.24 + i * 0.1, 0.46 + i * 0.1));
          if (t <= 0) return;
          const r: Rect = { x: part.x, y: part.y, w: 100, h: 44 };
          ctx.strokeStyle = c(A.line * t);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mcu.x + mcu.w / 2, mcu.y + mcu.h / 2);
          ctx.lineTo(
            lerp(mcu.x + mcu.w / 2, r.x + r.w / 2, t),
            lerp(mcu.y + mcu.h / 2, r.y + r.h / 2, t),
          );
          ctx.stroke();
          panel(r, t);
          label(part.name, r.x + 12, r.y + 18, 10, A.text * t);
          label(part.bus, r.x + 12, r.y + 33, 9, A.dim * t);
        });

        // The scheduler ticking, which is the thing an RTOS actually is.
        const tick = beat(p, 0.6, 1);
        if (tick > 0) {
          label("scheduler", 40, 432, 10, A.dim * tick);
          for (let i = 0; i < 22; i++) {
            const on = (i + Math.floor(tick * 24)) % 3 === 0;
            ctx.fillStyle = c((on ? A.text : A.faint) * tick);
            ctx.fillRect(120 + i * 15, 426 - (on ? 8 : 4), 3, on ? 12 : 8);
          }
        }
      }

      /* ── Scene: the platform ─────────────────────────────────────────────
         A commit becoming a promotion becoming pods, which is what GitOps is
         when you strip the branding off it. */
      function scenePlatform(p: number) {
        const git: Rect = { x: 180, y: 60, w: 160, h: 48 };
        const t0 = easeOut(beat(p, 0, 0.16));
        if (t0 <= 0) return;
        panel(git, t0);
        label("git · main", git.x + 14, git.y + 26, 11, A.text * t0);

        const nodes = [0, 1, 2].map((i) => ({
          r: { x: 30 + i * 158, y: 250, w: 138, h: 150 } as Rect,
          name: ["node-1", "node-2", "node-3"][i],
        }));

        const promote = beat(p, 0.16, 0.36);
        if (promote > 0) {
          label("promote", SW / 2 - 26, 150, 10, A.dim * promote);
          ctx.strokeStyle = c(A.line * promote);
          ctx.lineWidth = 1;
          nodes.forEach((n) => {
            ctx.beginPath();
            ctx.moveTo(git.x + git.w / 2, git.y + git.h);
            ctx.bezierCurveTo(
              git.x + git.w / 2, 190,
              n.r.x + n.r.w / 2, 190,
              n.r.x + n.r.w / 2, lerp(git.y + git.h, n.r.y, easeOut(promote)),
            );
            ctx.stroke();
          });
        }

        nodes.forEach((n, i) => {
          const t = easeOut(beat(p, 0.3 + i * 0.08, 0.52 + i * 0.08));
          if (t <= 0) return;
          panel(n.r, t);
          label(n.name, n.r.x + 12, n.r.y + 20, 10.5, A.text * t);
          // Pods filling in.
          for (let k = 0; k < 6; k++) {
            const pt = beat(p, 0.46 + i * 0.06 + k * 0.025, 0.62 + i * 0.06 + k * 0.025);
            if (pt <= 0) continue;
            const px = n.r.x + 14 + (k % 3) * 38;
            const py = n.r.y + 44 + Math.floor(k / 3) * 42;
            ctx.strokeStyle = c(A.line * 1.3 * pt);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(px, py, 30, 30, 5);
            ctx.stroke();
            ctx.fillStyle = c(A.faint * pt);
            ctx.fillRect(px + 6, py + 12, 18, 2);
            ctx.fillRect(px + 6, py + 18, 12, 2);
          }
          const h = beat(p, 0.72 + i * 0.05, 0.86 + i * 0.05);
          if (h > 0) check(n.r.x + n.r.w - 16, n.r.y + 20, A.text * h);
        });

        const done = beat(p, 0.88, 1);
        if (done > 0) {
          label("healthy · rollback armed", 30, 432, 10, A.text * 0.85 * done);
        }
      }

      /* ── Ambient depth, present in every act ────────────────────────────── */
      function lattice(p: number) {
        const step = w < 700 ? 58 : 76;
        const drift = (p * h * 0.6) % step;
        ctx.fillStyle = c(aDot);
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
        readTokens();
        const p = progress.current;
        ctx.clearRect(0, 0, w, h);
        lattice(scrolled.current);

        /* Derive the scene box from the same geometry the copy uses, rather
           than from magic fractions of the viewport. Fractions put the scene
           6px from the copy panel and 14px from the window edge at 1440, which
           is what made it feel like it was pushing against both. */
        const narrow = w < 1024;
        const wrapW = Math.min(w - 40, 1184);
        const wrapLeft = (w - wrapW) / 2;
        const copyW = Math.min(544, wrapW * 0.5);
        const sceneLeft = wrapLeft + copyW + 76;
        const boxW = narrow ? w * 0.9 : Math.max(wrapLeft + wrapW - sceneLeft, 300);
        const scale = Math.min(boxW / SW, (h * 0.8) / SH);
        const ox = narrow ? (w - SW * scale) / 2 : sceneLeft + (boxW - SW * scale) / 2;
        // Centre the scene on whatever element declared it, and keep it on
        // screen. Falling back to the viewport centre is only right for the
        // acts, where the host is taller than the window.
        const drawn = SH * scale;
        const oy =
          anchor.current === null
            ? (h - drawn) / 2
            : Math.min(Math.max(anchor.current - drawn / 2, 8), h - drawn - 8);

        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);
        ctx.globalAlpha = narrow ? 0.46 : 1;

        switch (scene.current) {
          case "embedded":
            sceneEmbedded(p);
            break;
          case "platform":
            scenePlatform(p);
            break;
          case "acts": {
            const a2 = act(p, 1);
            const a3 = act(p, 2);
            const a4 = act(p, 3);
            const a5 = act(p, 4);
            if (a5 > 0) actFive(a5);
            else if (a4 > 0) actFour(a4);
            else if (a3 > 0) actThree(a3);
            else if (a2 > 0) actTwo(a2);
            else actOne(act(p, 0));
            break;
          }
          default:
            // The hero: the first act, so the page opens on something forming.
            actOne(clamp(p * 1.6));
        }

        ctx.restore();
      }

      readTokens();
      resize();
      window.addEventListener("resize", resize, { passive: true });

      // One ScrollTrigger scrubs the whole narrative. `scrub: 0.6` softens the
      // link so a flick does not snap the scene, without letting it drift out
      // of step with the scrollbar the way a tween per section would.
      const triggers: ScrollTrigger[] = [];

      document.querySelectorAll<HTMLElement>("[data-scene]").forEach((el) => {
        const name = el.dataset.scene!;
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: name === "acts" ? "top top" : "top 78%",
            end: name === "acts" ? "bottom bottom" : "bottom 22%",
            scrub: reduced ? true : 0.45,
            onUpdate: (self) => {
              scene.current = name;
              progress.current = self.progress;
              const r = el.getBoundingClientRect();
              anchor.current = name === "acts" ? null : r.top + r.height / 2;
              draw();
            },
            onEnterBack: () => {
              scene.current = name;
            },
          }),
        );
      });

      // The lattice drifts on document scroll, so the background keeps moving
      // between scenes rather than freezing in the gaps.
      triggers.push(
        ScrollTrigger.create({
          start: 0,
          end: () => ScrollTrigger.maxScroll(window),
          scrub: true,
          onUpdate: (self) => {
            scrolled.current = self.progress;
            draw();
          },
        }),
      );

      const mo = new MutationObserver(draw);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      return () => {
        window.removeEventListener("resize", resize);
        mo.disconnect();
        triggers.forEach((t) => t.kill());
      };
    },
    { scope: wrapRef },
  );

  return (
    <div ref={wrapRef} className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />
    </div>
  );
}
