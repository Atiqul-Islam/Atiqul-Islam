import { useEffect, useState } from "react";

const LINKS = [
  ["Work", "#work"],
  ["Genesis", "#act-terminal"],
  ["Experience", "#experience"],
  ["Stack", "#stack"],
  ["Contact", "#contact"],
] as const;

export default function Header({ onToggleTheme }: { onToggleTheme: () => void }) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = document.getElementById("top-sentinel");
    if (!el) return;
    // Its own zero height sentinel rather than the hero: the hero parallaxes,
    // so its box travels with the reader and never stops intersecting.
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-surface/78 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300 ${
        stuck ? "border-line" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex min-h-16 w-[min(100%-2.5rem,74rem)] items-center gap-4">
        <a href="#top" className="wide mr-auto font-bold tracking-tight text-ink no-underline">
          Atiqul Islam
        </a>
        <nav aria-label="Sections" className="hidden gap-1 md:flex">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="group relative rounded-lg px-3 py-2 text-[0.9rem] font-medium text-ink-dim no-underline transition-colors hover:text-ink"
            >
              {label}
              <span className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-current transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Switch between light and dark"
          className="grid size-10 place-items-center rounded-full border border-line text-ink-dim transition-[background-color,color,rotate] duration-300 hover:bg-ink/8 hover:text-ink hover:rotate-[25deg]"
        >
          <svg viewBox="0 0 24 24" className="size-[1.15rem] fill-current" aria-hidden="true">
            <path d="M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-13.2a1 1 0 0 1-1-1V1.5a1 1 0 1 1 2 0v1.3a1 1 0 0 1-1 1Zm0 19.7a1 1 0 0 1-1-1v-1.3a1 1 0 1 1 2 0v1.3a1 1 0 0 1-1 1ZM3.8 12a1 1 0 0 1-1 1H1.5a1 1 0 1 1 0-2h1.3a1 1 0 0 1 1 1Zm19.7 0a1 1 0 0 1-1 1h-1.3a1 1 0 1 1 0-2h1.3a1 1 0 0 1 1 1ZM5.6 6.98a1 1 0 0 1-1.41 0l-.92-.92A1 1 0 0 1 4.68 4.6l.92.92a1 1 0 0 1 0 1.46Zm14.13 14.13a1 1 0 0 1-1.41 0l-.92-.92a1 1 0 0 1 1.41-1.41l.92.92a1 1 0 0 1 0 1.41ZM4.68 21.11a1 1 0 0 1 0-1.41l.92-.92A1 1 0 0 1 7.01 20.2l-.92.92a1 1 0 0 1-1.41 0ZM18.4 6.98a1 1 0 0 1 0-1.41l.92-.92a1 1 0 1 1 1.41 1.41l-.92.92a1 1 0 0 1-1.41 0Z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
