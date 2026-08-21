import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Lenis for smooth scrolling, driven from GSAP's ticker rather than its own
 * requestAnimationFrame loop.
 *
 * Two rAF loops running side by side is the classic way these two libraries
 * desync: Lenis updates scroll position in one frame callback while
 * ScrollTrigger reads it in another, so pinned sections judder by a frame.
 * Sharing GSAP's ticker means the scroll position is always written before
 * anything reads it.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}
