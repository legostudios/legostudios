import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CASE_STUDIES } from "../data/caseStudies";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const imageFor = (i: number) => SHOWCASE_IMAGES[i % SHOWCASE_IMAGES.length];
const pad = (n: number) => String(n).padStart(2, "0");

// Small editorial label.
function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/50">
      {children}
    </span>
  );
}

// A calm reveal — content fades and lifts slightly; the grid lines stay put.
const reveal = (on: boolean) => ({
  opacity: on ? 1 : 0,
  transform: on ? "none" : "translateY(10px)",
  transition: "opacity 700ms ease, transform 700ms ease",
});

interface CaseStudyPageProps {
  index: number;
  left: number;
  top: number;
  onBack: () => void;
}

// The case-study archive: opened inside the frame boundary, it presents every
// case study as a full-viewport editorial spread built from thin 1px rules.
// Titles, metadata, copy, image and results each occupy a fixed grid region.
// Scrolling is calm and free; content reveals progressively while the grid
// stays stable — like turning pages in an exhibition catalogue.
export function CaseStudyPage({ index, left, top, onBack }: CaseStudyPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const spreadRefs = useRef<(HTMLElement | null)[]>([]);
  const [shown, setShown] = useState<boolean[]>(() =>
    CASE_STUDIES.map((_, i) => i === index),
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onBack]);

  // Open at the chosen case study.
  useLayoutEffect(() => {
    spreadRefs.current[index]?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [index]);

  // Reveal each spread's content as it scrolls into view.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = Number((e.target as HTMLElement).dataset.i);
          setShown((prev) =>
            prev[i] ? prev : prev.map((v, k) => (k === i ? true : v)),
          );
        });
      },
      { root: rootRef.current, threshold: 0.2 },
    );
    spreadRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const minHeight = `calc(100dvh - ${Math.round(top)}px)`;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Case studies archive"
      className="fixed z-[75] overflow-y-auto bg-white text-black opacity-100 transition-opacity duration-500 ease-out starting:opacity-0 motion-reduce:transition-none"
      style={{ left, top, right: 0, bottom: 0, fontFamily: HELV }}
    >
      {CASE_STUDIES.map((cs, i) => {
        const on = shown[i];
        return (
          <article
            key={cs.name}
            data-i={i}
            ref={(el) => {
              spreadRefs.current[i] = el;
            }}
            className="flex flex-col border-b border-black"
            style={{ minHeight }}
          >
            {/* Meta row. */}
            <div className="flex items-stretch border-b border-black">
              <div className="border-r border-black px-6 py-3 sm:px-10">
                <Label>
                  N° {pad(i + 1)} / {pad(CASE_STUDIES.length)}
                </Label>
              </div>
              <div className="hidden border-r border-black px-6 py-3 sm:block sm:px-10">
                <Label>Case Study</Label>
              </div>
              <div className="ml-auto flex items-center px-6 py-3 sm:px-10">
                <Label>{cs.category}</Label>
              </div>
            </div>

            {/* Title. */}
            <div className="border-b border-black px-6 py-7 sm:px-10 sm:py-9">
              <h2
                className="max-w-[16ch] text-[clamp(2rem,5vw,4.75rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em]"
                style={reveal(on)}
              >
                {cs.name}
              </h2>
            </div>

            {/* Body — copy (left) + image (right). */}
            <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
              <div className="flex flex-col divide-y divide-black border-black md:border-r">
                <div className="flex-1 px-6 py-7 sm:px-10">
                  <Label>Challenge</Label>
                  <p
                    className="mt-3 max-w-[46ch] text-[clamp(1rem,1.35vw,1.25rem)] leading-relaxed text-black/80"
                    style={reveal(on)}
                  >
                    {cs.challenge}
                  </p>
                </div>
                <div className="flex-1 px-6 py-7 sm:px-10">
                  <Label>Approach</Label>
                  <p
                    className="mt-3 max-w-[46ch] text-[clamp(1rem,1.35vw,1.25rem)] leading-relaxed text-black/80"
                    style={reveal(on)}
                  >
                    {cs.approach}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center border-t border-black px-6 py-8 sm:px-10 md:border-t-0">
                <div
                  className="aspect-[4/3] w-full max-w-[540px] overflow-hidden border border-black"
                  style={reveal(on)}
                >
                  <img
                    src={imageFor(i)}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="h-full w-full object-cover grayscale"
                  />
                </div>
              </div>
            </div>

            {/* Results + impact. */}
            <div className="grid grid-cols-1 border-t border-black md:grid-cols-2">
              <div className="border-black px-6 py-6 sm:px-10 md:border-r">
                <Label>Results</Label>
                <div
                  className="mt-4 flex flex-wrap gap-x-12 gap-y-5"
                  style={reveal(on)}
                >
                  {cs.stats.map((s) => (
                    <div key={s.label}>
                      <div className="text-[clamp(1.7rem,3.2vw,2.9rem)] font-medium leading-none tracking-[-0.02em]">
                        {s.value}
                      </div>
                      <div className="mt-2">
                        <Label>{s.label}</Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-black px-6 py-6 sm:px-10 md:border-t-0">
                <Label>Impact</Label>
                <ul
                  className="mt-3 space-y-1.5 text-[clamp(0.95rem,1.2vw,1.1rem)] leading-snug text-black/75"
                  style={reveal(on)}
                >
                  {cs.impact.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span aria-hidden="true" className="text-black/40">
                        —
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
