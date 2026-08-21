import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import EnforcementPanel from "./EnforcementPanel";

const HEADLINE = "I build the agent infrastructure other engineers ship on.";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.from("[data-word] > span", {
          yPercent: 108,
          duration: 0.85,
          stagger: 0.045,
        })
          .from("[data-hero-fade]", { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.09 }, "-=0.45");
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <>
      <div id="top-sentinel" aria-hidden="true" />
      <div
        id="top"
        ref={ref}
        className="mx-auto grid w-[min(100%-2.5rem,74rem)] items-start gap-10 py-[clamp(3.5rem,8vw,6rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]"
      >
        <div>
        <p data-hero-fade className="eyebrow flex items-center gap-2.5">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
          Agent infrastructure · St. John&apos;s, Canada
        </p>

        {/* Split per word so each rides up behind its own clip: the sentence
            assembles rather than the block fading in. */}
        <h1 className="wide mt-4 max-w-[17ch] text-[clamp(2.15rem,1.5rem+2.5vw,3.55rem)]">
          {HEADLINE.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} data-word className="inline-block overflow-hidden pb-[0.06em] align-bottom">
              <span className="inline-block">{word}</span>
              {i < HEADLINE.split(" ").length - 1 ? " " : ""}
            </span>
          ))}
        </h1>

        <p
          data-hero-fade
          className="mt-6 max-w-[36ch] text-[clamp(1.2rem,1.05rem+0.7vw,1.55rem)] leading-[1.4] text-ink-dim"
        >
          An agent can hold your instruction in its context and still not follow it.
        </p>

        <p data-hero-fade className="mt-5 max-w-[52ch] text-ink-dim">
          Holding a rule and applying one are different things, and the gap widens the longer a
          session runs. So I stopped asking, and built enforcement that runs outside the model.
          Scroll and you can watch the whole loop, from one terminal to a team that ships.
        </p>

        <div data-hero-fade className="mt-9 flex flex-wrap gap-3">
          <a
            href="#act-terminal"
            className="group relative overflow-hidden rounded-full bg-primary px-6 py-3 font-semibold text-on-primary no-underline transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5"
          >
            <span className="relative z-10">Watch the loop</span>
            <span className="absolute inset-0 -translate-x-[130%] bg-[linear-gradient(100deg,transparent_30%,rgba(255,255,255,0.28)_50%,transparent_70%)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-[130%]" />
          </a>
          <a
            href="https://github.com/Atiqul-Islam"
            className="rounded-full border border-line-strong px-6 py-3 font-semibold text-ink no-underline transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-ink/8"
          >
            GitHub
          </a>
        </div>
        </div>

        <div data-hero-fade>
          <EnforcementPanel />
        </div>
      </div>
    </>
  );
}
