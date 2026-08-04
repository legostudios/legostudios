import { useEffect, useRef, useState, type ReactNode } from "react";
import { CASE_STUDIES, type CaseStudy } from "../data/caseStudies";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";
import { HomeLogo } from "./HomeLogo";

// Helvetica for the detail view; thin geometric Jost for the two-odd-style list.
const DISPLAY = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const THIN = '"Jost", "Century Gothic", sans-serif';

// One photo per case study, shown on the left; hovering a name swaps it in.
const CASE_IMAGES = CASE_STUDIES.map(
  (_, i) => SHOWCASE_IMAGES[i % SHOWCASE_IMAGES.length],
);

// Each study's photo gets its own size + placement on the left half, so the
// image jumps around as you move between names (like the reference).
const FRAMES = [
  "lg:left-[5vw] lg:top-[9vh] lg:h-[80vh] lg:w-[40vw]",
  "lg:left-[10vw] lg:top-[20vh] lg:h-[55vh] lg:w-[38vw]",
  "lg:left-[3vw] lg:top-[7vh] lg:h-[85vh] lg:w-[33vw]",
  "lg:left-[9vw] lg:top-[15vh] lg:h-[66vh] lg:w-[44vw]",
];

// The left-hand photo. Mobile: one stacked image. Desktop: each study's image
// lives in its own frame and crossfades in when that name is active.
function LeftImage({ active }: { active: number }) {
  return (
    <>
      <div className="relative aspect-[4/5] w-[64vw] max-w-[340px] shrink-0 overflow-hidden lg:hidden">
        {CASE_IMAGES.map((src, i) => (
          <img
            key={`m${i}`}
            src={src}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out"
            style={{ opacity: i === active ? 1 : 0 }}
          />
        ))}
      </div>
      {CASE_IMAGES.map((src, i) => (
        <img
          key={`d${i}`}
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={`pointer-events-none absolute hidden object-cover transition-opacity duration-500 ease-out lg:block ${FRAMES[i % FRAMES.length]}`}
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}
    </>
  );
}

interface CaseStudiesPageProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
}

// Case studies: photo(s) on the left, thin names on the right. Hovering a name
// slides it right past a black bar and swaps in that study's photo. Clicking a
// name opens the full detail.
export function CaseStudiesPage({
  closing,
  onRequestClose,
  onCloseFinished,
}: CaseStudiesPageProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelected((cur) => {
        if (cur !== null) return null;
        onRequestClose();
        return cur;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onRequestClose]);

  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0 });
  }, [selected]);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Case studies"
      tabIndex={-1}
      onTransitionEnd={(e) => {
        if (closing && e.target === e.currentTarget && e.propertyName === "opacity") {
          onCloseFinished();
        }
      }}
      className={`fixed inset-0 z-[60] overflow-y-auto bg-white text-black outline-none transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        closing ? "opacity-0" : "opacity-100 starting:opacity-0"
      }`}
      style={{ fontFamily: DISPLAY }}
    >
      <HomeLogo onClick={onRequestClose} align="center" />

      {selected === null ? (
        <div className="flex min-h-full flex-col items-center justify-center gap-10 px-6 py-24 lg:block lg:p-0">
          <LeftImage active={hovered ?? 0} />

          {/* Names on the right (same placement as the reference). */}
          <ul
            onMouseLeave={() => setHovered(null)}
            className="relative flex flex-col items-center gap-[clamp(0.9rem,3vh,2.25rem)] text-center lg:absolute lg:left-[58vw] lg:top-1/2 lg:max-w-[40vw] lg:-translate-y-1/2 lg:items-start lg:text-left"
            style={{ fontFamily: THIN }}
          >
            {CASE_STUDIES.map((cs, i) => (
              <li key={cs.name} className="w-full">
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  onMouseEnter={() => setHovered(i)}
                  className="group relative block w-full text-center text-[clamp(1.5rem,2.5vw,2.9rem)] font-light uppercase leading-[1.1] tracking-[0.03em] text-black outline-none lg:pl-[clamp(1.25rem,2.2vw,2.75rem)] lg:text-left"
                >
                  {/* black bar beside the name (desktop) */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-1/2 hidden h-[0.72em] w-[3px] -translate-y-1/2 bg-black opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 lg:block"
                  />
                  <span className="inline-block transition-transform duration-300 ease-out lg:whitespace-nowrap lg:group-hover:translate-x-[1.1vw]">
                    {cs.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mx-auto max-w-[1500px] px-5 pb-24 pt-24 sm:px-8 md:pt-28">
          <CaseStudyDetail
            cs={CASE_STUDIES[selected]}
            onBack={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14 border-t border-black/20 pt-10">
      <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold">{title}</h3>
      <div className="mt-4 max-w-[72ch] text-[clamp(1rem,1.6vw,1.35rem)] leading-relaxed text-black/75">
        {children}
      </div>
    </section>
  );
}

function CaseStudyDetail({
  cs,
  onBack,
}: {
  cs: CaseStudy;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-12 text-[13px] uppercase tracking-widest text-black/60 transition-colors hover:text-black"
      >
        ← All Case Studies
      </button>

      <h1 className="text-[clamp(2.6rem,8vw,6rem)] font-bold leading-[0.95] tracking-tight">
        {cs.name}
      </h1>

      <div className="mt-12 flex flex-wrap gap-x-16 gap-y-9">
        {cs.stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-[clamp(2.2rem,5vw,3.75rem)] font-bold leading-none">
              {stat.value}
            </div>
            <div className="mt-2 text-[13px] uppercase tracking-widest text-black/55">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <Section title="The Challenge">{cs.challenge}</Section>
      <Section title="Our Approach">{cs.approach}</Section>
      <Section title="Business Impact">
        <ul className="space-y-2.5">
          {cs.impact.map((line) => (
            <li key={line} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-black/50" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
