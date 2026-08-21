import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StageCanvas from "./components/StageCanvas";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ProjectSection from "./components/ProjectSection";
import { ACTS, PROJECTS } from "./data/projects";
import { useSmoothScroll } from "./lib/useSmoothScroll";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useSmoothScroll();

  useGSAP(
    () => {
      /* gsap.matchMedia is the supported way to make an animation conditional:
         everything created inside the callback is reverted automatically when
         the query stops matching, so a reader turning on reduced motion mid
         session gets the tweens torn down rather than merely paused. */
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 34,
            autoAlpha: 0,
            duration: 0.85,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });

        // Each act panel drifts at its own rate against the canvas behind it.
        // The difference in rate is the parallax; matching rates would just be
        // two things moving together.
        //
        // Bounded in pixels rather than scaled off ScrollTrigger.maxScroll:
        // total page height has nothing to do with how far a panel should
        // travel, and on a long page that formula threw panels several hundred
        // pixels and cropped them against the viewport.
        gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el) => {
          gsap.fromTo(
            el,
            { y: Number(el.dataset.drift) * 34 },
            {
              y: -Number(el.dataset.drift) * 34,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const toggleTheme = () => {
    const isDark = theme
      ? theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  return (
    <div ref={root}>
      <a
        href="#main"
        className="fixed left-3 top-[-5rem] z-60 rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary transition-[top] duration-200 focus:top-3"
      >
        Skip to content
      </a>

      <Header onToggleTheme={toggleTheme} />

      <main id="main">
        <Hero />

        {/* The narrative: one tall section holding the three acts, with the
            canvas pinned behind all of them. */}
        <section className="relative" aria-label="How the work fits together">
          <StageCanvas />

          {ACTS.map((a, i) => (
            <div
              key={a.id}
              id={a.id}
              className="relative flex min-h-[100svh] items-center"
              data-drift={["1", "1.9", "1.35", "2.1", "1.6"][i]}
            >
              <div className="mx-auto w-[min(100%-2.5rem,74rem)]">
                <div className="max-w-[34rem] rounded-3xl border border-line bg-surface-lo/72 p-8 backdrop-blur-md sm:p-10">
                  <p className="eyebrow tabular-nums">{a.label} / 05</p>
                  <h2 className="wide mt-3 text-[clamp(1.7rem,1.2rem+2vw,2.9rem)]">{a.title}</h2>
                  <p className="mt-5 text-ink-dim">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {PROJECTS.map((p, i) => (
          <ProjectSection key={p.id} project={p} index={i} />
        ))}

        <section id="work" className="border-t border-line py-[clamp(4rem,9vw,7rem)]">
          <div className="mx-auto w-[min(100%-2.5rem,74rem)]">
            <div data-reveal className="mb-12 max-w-[62ch]">
              <p className="eyebrow">Instrumar · since 2022</p>
              <h2 className="wide mt-3 text-[clamp(1.85rem,1.35rem+2vw,2.9rem)]">
                What I own at work
              </h2>
              <p className="mt-4 text-ink-dim">
                The open source is the part you can read. This is the part that runs a plant,
                described without naming a customer or linking code that is not mine to link.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {[
                {
                  h: "Non programmers shipping models",
                  p: "I built a zero code workflow that lets analysts and systems engineers, people who do not write code, build, validate and ship production models themselves. Some of the models built through it run in production today. The rest are built and in testing. The outcome is the point: domain experts ship without a developer in the loop.",
                },
                {
                  h: "The platform underneath",
                  p: "A private Kubernetes cluster on Apache CloudStack, Cluster API, that I specified, built and operate. Hardware, network architecture, deployment and production operations, with GitOps delivery, automated promotion and rollback, and release auditability. A parallel AWS cluster benchmarked cost against performance.",
                },
                {
                  h: "Context engineering, in production",
                  p: "A production agentic analytics product for plant operations, full stack, with a supervisor routing four specialist agents on LangGraph. I engineered its context management: knowledge modules loaded on demand instead of carried, a token budget split so the stable prompt stays cached, and history compaction that keeps metadata and drops payload until a result is actually needed.",
                },
              ].map((c) => (
                <article
                  key={c.h}
                  data-reveal
                  className="rounded-2xl border border-line bg-surface-lo p-6 transition-colors duration-300 hover:bg-surface-mid"
                >
                  <h3 className="text-[1.12rem]">{c.h}</h3>
                  <p className="mt-3 text-[0.95rem] text-ink-dim">{c.p}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="stack" className="border-t border-line py-[clamp(4rem,9vw,7rem)]">
          <div className="mx-auto w-[min(100%-2.5rem,74rem)]">
            <div data-reveal className="mb-12">
              <p className="eyebrow">What I reach for</p>
              <h2 className="wide mt-3 text-[clamp(1.85rem,1.35rem+2vw,2.9rem)]">Stack</h2>
            </div>
            <dl data-reveal className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Languages", ["Rust", "Python", "Go", "TypeScript", "C#"]],
                [
                  "Agents and LLM",
                  ["LangGraph", "MCP", "Context engineering", "ReAct", "RAG", "Evaluation"],
                ],
                [
                  "Platform",
                  ["Kubernetes", "Cluster API", "Apache CloudStack", "AWS", "Helm", "Kustomize"],
                ],
                [
                  "Data and ops",
                  ["PostgreSQL", "TimescaleDB", "Apache Pulsar", "Trino", "Prometheus", "OpenTelemetry"],
                ],
              ].map(([label, items]) => (
                <div key={label as string}>
                  <dt className="eyebrow mb-3">{label as string}</dt>
                  <dd className="m-0 flex flex-wrap gap-1.5">
                    {(items as string[]).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.7rem] text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
                      >
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-line py-[clamp(4rem,8vw,6rem)]">
        <div
          data-reveal
          className="mx-auto flex w-[min(100%-2.5rem,74rem)] flex-wrap items-end gap-8"
        >
          <div>
            <p className="eyebrow">Open to work</p>
            <h2 className="wide mt-3 text-[clamp(1.6rem,1.2rem+1.8vw,2.5rem)]">
              Remote anywhere, or on site in Canada.
            </h2>
            <p className="mt-4 max-w-[42ch] text-ink-dim">
              Full time, contract or consulting. AI engineering, LLM engineering, MLOps and platform
              engineering. B.Eng Computer Engineering, Memorial University of Newfoundland.
            </p>
          </div>
          <div className="ml-auto flex gap-5 font-semibold">
            <a className="text-primary" href="https://github.com/Atiqul-Islam">
              GitHub
            </a>
            <a className="text-primary" href="https://www.linkedin.com/in/atiqul-islam-3218851b5/">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
