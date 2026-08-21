import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StageCanvas from "./components/StageCanvas";
import Header from "./components/Header";
import Hero from "./components/Hero";
import WorkCard from "./components/WorkCard";
import { ACTS, CAPABILITIES, EXPERIENCE, STACK, WORK } from "./data/portfolio";
import { useSmoothScroll } from "./lib/useSmoothScroll";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Order matters more here than anything else on the page.
 *
 * An earlier version opened with the Genesis thesis and spent five acts of
 * scroll explaining it, so a reader learned a great deal about one open source
 * project and almost nothing about the person. That is a product page.
 *
 * A portfolio answers who, at what level, and available for what inside the
 * first screen, shows the range of the work next, and only then goes deep on
 * one thing for whoever wants it. Breadth before depth.
 */
export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [, setTheme] = useState<"light" | "dark" | null>(null);

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
    const cur = document.documentElement.dataset.theme;
    const isDark = cur
      ? cur === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  const wrap = "mx-auto w-[min(100%-2.5rem,74rem)]";

  return (
    <div ref={root}>
      <a
        href="#main"
        className="fixed left-3 top-[-5rem] z-60 rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary transition-[top] duration-200 focus:top-3"
      >
        Skip to content
      </a>

      <Header onToggleTheme={toggleTheme} />

      <StageCanvas />

      <main id="main">
        <Hero />

        {/* ── What I do ──────────────────────────────────────────────────── */}
        <section id="capabilities" className="border-t border-line py-[clamp(3.5rem,7vw,5.5rem)]">
          <div className={wrap}>
            <p data-reveal className="eyebrow">What I do</p>
            <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
              {CAPABILITIES.map((cap) => (
                <div key={cap.title} data-reveal>
                  <h3 className="text-[1.08rem]">{cap.title}</h3>
                  <p className="mt-2.5 text-[0.94rem] text-ink-dim">{cap.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Selected work: the range, before any depth ──────────────────── */}
        <section id="work" className="border-t border-line py-[clamp(4rem,9vw,6.5rem)]">
          <div className={wrap}>
            <div data-reveal className="mb-11 max-w-[60ch]">
              <p className="eyebrow">Selected work</p>
              <h2 className="wide mt-3 text-[clamp(1.85rem,1.35rem+2vw,2.9rem)]">
                From flight software to agent infrastructure.
              </h2>
              <p className="mt-4 text-ink-dim">
                Employer work is described, not linked. Everything else you can clone.
              </p>
            </div>
            <div className="grid auto-rows-min gap-5 lg:grid-cols-2">
              {WORK.map((w) => (
                <WorkCard key={w.id} work={w} />
              ))}
            </div>
          </div>
        </section>

        {/* ── The deep dive, labelled as one ──────────────────────────────── */}
        <section
          className="relative border-t border-line"
          aria-label="How the work fits together"
          data-scene="acts"
        >
          <div className={`${wrap} pt-[clamp(3.5rem,7vw,5.5rem)]`}>
            <div data-reveal className="max-w-[60ch]">
              <p className="eyebrow">A closer look · Genesis</p>
              <h2 className="wide mt-3 text-[clamp(1.85rem,1.35rem+2vw,2.9rem)]">
                What an agent system looks like when it has to hold up.
              </h2>
              <p className="mt-4 text-ink-dim">
                One of the projects above, in five steps, drawn as you scroll.
              </p>
            </div>
          </div>

          {ACTS.map((a, i) => (
            <div
              key={a.id}
              id={a.id}
              className="relative flex min-h-[84svh] items-center"
              data-drift={["1", "1.9", "1.35", "2.1", "1.6"][i]}
            >
              <div className={wrap}>
                <div className="max-w-[33rem] rounded-3xl border border-line bg-surface-lo/72 p-8 backdrop-blur-md sm:p-9">
                  <p className="eyebrow tabular-nums">{a.label} / 05</p>
                  <h3 className="wide mt-3 text-[clamp(1.55rem,1.15rem+1.7vw,2.4rem)]">{a.title}</h3>
                  <p className="mt-4 text-ink-dim">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ── Experience ─────────────────────────────────────────────────── */}
        <section id="experience" className="border-t border-line py-[clamp(4rem,9vw,6.5rem)]">
          <div className={wrap}>
            <div data-reveal className="mb-9">
              <p className="eyebrow">Experience</p>
              <h2 className="wide mt-3 text-[clamp(1.85rem,1.35rem+2vw,2.9rem)]">
                Where the work happened.
              </h2>
            </div>
            <ol className="m-0 list-none border-t border-line p-0">
              {EXPERIENCE.map((r) => (
                <li
                  key={`${r.title}-${r.when}`}
                  data-reveal
                  className="grid gap-1 border-b border-line py-5 sm:grid-cols-[13rem_1fr] sm:gap-6"
                >
                  <span className="font-mono text-[0.78rem] tabular-nums text-ink-dim">{r.when}</span>
                  <div>
                    <h3 className="text-[1.02rem]">
                      {r.title}
                      <span className="font-normal text-ink-dim"> · {r.org}</span>
                    </h3>
                    {r.note && <p className="mt-1.5 text-[0.94rem] text-ink-dim">{r.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
            <p data-reveal className="mt-7 text-[0.95rem] text-ink-dim">
              B.Eng Computer Engineering, Memorial University of Newfoundland, 2014 to 2022.
            </p>
          </div>
        </section>

        {/* ── Stack ──────────────────────────────────────────────────────── */}
        <section id="stack" className="border-t border-line py-[clamp(4rem,9vw,6.5rem)]">
          <div className={wrap}>
            <p data-reveal className="eyebrow mb-8">What I reach for</p>
            <dl data-reveal className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {STACK.map(([label, items]) => (
                <div key={label}>
                  <dt className="eyebrow mb-3">{label}</dt>
                  <dd className="m-0 flex flex-wrap gap-1.5">
                    {items.map((t) => (
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
          className={`${wrap} flex-wrap items-end gap-8`}
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
