import { useLayoutEffect, useRef, useState } from "react";

/**
 * The enforcement panel from the first cut of this site, kept because it is the
 * one thing on the page that states the argument in a form a reader can operate
 * rather than read: the same agent, the same instruction, run twice.
 */

type Step = {
  what: string;
  tag?: string;
  tone?: "ok" | "deny" | "warn";
  drift?: boolean;
};

const RUNS: Record<string, { steps: Step[]; verdict: { tone: "ok" | "warn"; lead: string; rest: string } }> = {
  prompted: {
    steps: [
      { what: "read  portfolio-truth.md", tag: "ok", tone: "ok" },
      { what: "rule pt-3 in context", tag: "held", tone: "ok" },
      { what: "… 40 turns later …", drift: true },
      { what: "write resume.md", tag: "wrote", tone: "warn" },
    ],
    verdict: {
      tone: "warn",
      lead: "Shipped without the status label.",
      rest: "The rule sat in context the whole time. Nothing checked whether it was applied, so nothing said otherwise.",
    },
  },
  enforced: {
    steps: [
      { what: "inject pt-3 before work", tag: "hook", tone: "ok" },
      { what: "rule pt-3 in context", tag: "held", tone: "ok" },
      { what: "… 40 turns later …", drift: true },
      { what: "write resume.md", tag: "denied", tone: "deny" },
      { what: "cite pt-3 + evidence", tag: "pass", tone: "ok" },
    ],
    verdict: {
      tone: "ok",
      lead: "The write was denied, not discouraged.",
      rest: "A fail closed hook ran outside the model, and the agent could not finish until it cited the rule it applied with evidence.",
    },
  },
};

const TAG: Record<string, string> = {
  ok: "bg-primary-box text-on-primary-box",
  deny: "bg-deny-box text-on-deny-box",
  warn: "bg-accent-box text-on-accent-box",
};

export default function EnforcementPanel() {
  const [mode, setMode] = useState<"prompted" | "enforced">("enforced");
  const segRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 3, width: 0 });

  // Measure the active segment rather than guessing, so the sliding thumb stays
  // correct when the font loads late or the label text changes.
  useLayoutEffect(() => {
    const el = segRef.current?.querySelector<HTMLButtonElement>(`[data-mode="${mode}"]`);
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [mode]);

  const run = RUNS[mode];

  return (
    <div className="rounded-3xl border border-line bg-surface-lo/75 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center gap-3">
        <p className="eyebrow mr-auto">One agent, one rule</p>
        <div
          ref={segRef}
          role="group"
          aria-label="Enforcement mode"
          className="relative flex rounded-full border border-line bg-surface-mid p-[3px]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-[3px] rounded-full bg-primary-box transition-[left,width] duration-300 ease-[var(--ease-out-expo)]"
            style={{ left: thumb.left, width: thumb.width }}
          />
          {(["prompted", "enforced"] as const).map((m) => (
            <button
              key={m}
              type="button"
              data-mode={m}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`relative z-10 rounded-full px-3.5 py-1.5 text-[0.82rem] font-semibold capitalize transition-colors duration-200 ${
                mode === m ? "text-on-primary-box" : "text-ink-dim"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <ol className="flex list-none flex-col gap-2 p-0">
        {run.steps.map((s, i) => (
          <li
            key={`${mode}-${s.what}`}
            style={{ animationDelay: `${i * 90 + 120}ms` }}
            className={`grid animate-[step-in_420ms_var(--ease-out-expo)_both] grid-cols-[1.6rem_1fr_auto] items-center gap-3 rounded-xl border px-3.5 py-3 font-mono text-[0.8rem] ${
              s.tone === "deny"
                ? "border-deny/55 bg-deny/8"
                : s.drift
                  ? "border-dashed border-line bg-surface"
                  : "border-line bg-surface"
            }`}
          >
            <span className="tabular-nums text-[0.72rem] text-line-strong">
              {s.drift ? "" : String(i + 1).padStart(2, "0")}
            </span>
            <span className="break-words text-ink">{s.what}</span>
            {s.tag && (
              <span
                className={`rounded px-2 py-0.5 font-mono text-[0.66rem] font-bold uppercase tracking-[0.08em] ${TAG[s.tone!]}`}
              >
                {s.tag}
              </span>
            )}
          </li>
        ))}
      </ol>

      <div
        style={{ animationDelay: `${run.steps.length * 90 + 260}ms` }}
        className={`mt-4 animate-[step-in_460ms_var(--ease-out-expo)_both] rounded-xl px-4 py-3.5 text-[0.9rem] leading-relaxed ${
          run.verdict.tone === "ok"
            ? "bg-primary-box text-on-primary-box"
            : "bg-accent-box text-on-accent-box"
        }`}
      >
        <strong className="wide">{run.verdict.lead}</strong> {run.verdict.rest}
      </div>
    </div>
  );
}
