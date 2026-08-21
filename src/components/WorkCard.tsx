import { STATUS_TONE, type Work } from "../data/portfolio";

/**
 * One piece of work. The lead line carries the whole card, because most readers
 * will read that and the status and nothing else, and both of those have to be
 * true on their own.
 */
export default function WorkCard({ work }: { work: Work }) {
  return (
    /* A card that drives a background scene takes the full row and keeps its
       content to the left half, so the canvas has a lane to draw in. Without
       that the scene renders behind an opaque card and only leaks out between
       the gaps, which looks like a bug rather than a background. */
    <article
      data-reveal
      data-scene={work.scene}
      className={`group flex flex-col rounded-3xl border border-line p-6 transition-[border-color,transform,background-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-line-strong sm:p-7 ${
        work.scene
          ? "bg-surface-lo/78 backdrop-blur-md hover:bg-surface-lo/90 lg:col-span-2 lg:max-w-[34rem] lg:min-h-[30rem] lg:justify-center"
          : `bg-surface-lo hover:bg-surface-mid ${work.feature ? "lg:col-span-2" : ""}`
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="text-[1.22rem]">{work.name}</h3>
        <span
          className={`rounded px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] ${STATUS_TONE[work.status]}`}
        >
          {work.status}
        </span>
        <span className="ml-auto font-mono text-[0.7rem] text-ink-dim">{work.where}</span>
      </div>

      <p className="mt-3.5 text-[1.02rem] text-ink">{work.lead}</p>
      <details className="group/d mt-3">
        <summary className="cursor-pointer list-none font-mono text-[0.72rem] text-ink-dim transition-colors hover:text-ink">
          <span className="group-open/d:hidden">More detail +</span>
          <span className="hidden group-open/d:inline">Less &minus;</span>
        </summary>
        <p className="mt-3 text-[0.94rem] text-ink-dim">{work.body}</p>
      </details>

      <p className="mt-4 font-mono text-[0.72rem] text-ink-dim">{work.role}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {work.chips.map((c) => (
          <span
            key={c}
            className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.68rem] text-ink-dim"
          >
            {c}
          </span>
        ))}
      </div>

      {work.links && (
        <div className="mt-5 flex gap-4 pt-1 font-semibold">
          {work.links.map((l) => (
            <a key={l.href} className="text-primary text-[0.9rem]" href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
