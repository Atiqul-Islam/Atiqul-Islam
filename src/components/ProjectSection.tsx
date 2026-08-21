import { useRef } from "react";
import type { Project } from "../data/projects";

const TONE: Record<Project["status"], string> = {
  beta: "bg-primary-box text-on-primary-box",
  "in use": "bg-primary-box text-on-primary-box",
  production: "bg-primary-box text-on-primary-box",
  "active development": "bg-accent-box text-on-accent-box",
};

/** One section per project, alternating side so the eye has somewhere to go. */
export default function ProjectSection({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const flip = index % 2 === 1;

  return (
    <section
      ref={ref}
      id={project.id}
      className="relative border-t border-line py-[clamp(4rem,9vw,7rem)]"
    >
      <div className="mx-auto grid w-[min(100%-2.5rem,74rem)] gap-10 lg:grid-cols-12">
        <div
          data-reveal
          className={`lg:col-span-5 ${flip ? "lg:order-2 lg:col-start-8" : ""}`}
        >
          <p className="eyebrow">{project.kicker}</p>
          <h2 className="mt-3 font-mono text-[clamp(1.8rem,1.3rem+2vw,2.6rem)] font-bold tracking-tight">
            {project.name}
          </h2>
          <span
            className={`mt-4 inline-block rounded px-2 py-1 font-mono text-[0.66rem] font-bold uppercase tracking-[0.08em] ${TONE[project.status]}`}
          >
            {project.status}
          </span>
          <p className="mt-5 text-[1.05rem] text-ink">{project.thesis}</p>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {project.chips.map((c) => (
              <span
                key={c}
                className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.7rem] text-ink-dim"
              >
                {c}
              </span>
            ))}
          </div>

          {project.links.length > 0 && (
            <div className="mt-6 flex gap-5 font-semibold">
              {project.links.map((l) => (
                <a key={l.href} className="text-primary" href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div data-reveal className={`lg:col-span-6 ${flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"}`}>
          <div className="rounded-3xl border border-line bg-surface-lo p-7 sm:p-9">
            {project.body.map((para, i) => (
              <p key={i} className={`text-ink-dim ${i > 0 ? "mt-4" : ""}`}>
                {para}
              </p>
            ))}
            {project.commands && (
              <pre className="mt-6 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-surface-hi px-4 py-3 font-mono text-[0.78rem] leading-relaxed text-ink">
                {project.commands.map((c) => (
                  <div key={c}>
                    <span className="select-none text-ink-dim">$ </span>
                    {c}
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
