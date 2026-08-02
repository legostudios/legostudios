import { useEffect, useRef, useState, type ReactNode } from "react";
import { CASE_STUDIES, type CaseStudy } from "../data/caseStudies";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";
import { HomeLogo } from "./HomeLogo";

// Tight Helvetica-style face for the big titles, matching the services page.
const DISPLAY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const N = SHOWCASE_IMAGES.length;

const subline = (cs: CaseStudy) =>
  cs.stats.map((s) => `${s.value} ${s.label}`).join("  ·  ");

// The 4:5 photo that sits on the left of the case-study list, cycling every
// 0.5s — mirror of the services page.
function CyclingPhotos() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setActive((a) => (a + 1) % N), 500);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="relative aspect-[4/5] w-[64vw] max-w-[340px] shrink-0 overflow-hidden lg:absolute lg:left-[12vw] lg:top-[46%] lg:h-[72vh] lg:w-auto lg:max-w-none lg:-translate-y-1/2">
      {SHOWCASE_IMAGES.map((src, i) => {
        const isActive = i === active;
        const isPrev = i === (active - 1 + N) % N;
        return (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-linear"
            style={{
              opacity: isActive || isPrev ? 1 : 0,
              zIndex: isActive ? 2 : isPrev ? 1 : 0,
            }}
          />
        );
      })}
    </div>
  );
}

interface CaseStudiesPageProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
}

// Case studies: white page, giant bold titles. The list inverts to a black
// block on hover; clicking a row swaps in the full detail for that study.
export function CaseStudiesPage({
  closing,
  onRequestClose,
  onCloseFinished,
}: CaseStudiesPageProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Esc backs out of a detail first, then closes the page.
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

  // Jump back to the top when switching between list and detail.
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
      className={`fixed inset-0 z-[60] isolate overflow-y-auto bg-white text-black outline-none transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        closing ? "opacity-0" : "opacity-100 starting:opacity-0"
      }`}
      style={{ fontFamily: DISPLAY }}
    >
      <HomeLogo onClick={onRequestClose} align="right" />

      {selected === null ? (
        <div className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-24 lg:block lg:p-0">
          {/* Cycling photo — on top for mobile, on the left at lg+. */}
          <CyclingPhotos />

          {/* Case-study titles + stat sublines. Centered under the photo on
              mobile; on the right and inverted where they cross the photo at
              lg+. Clicking one opens its detail. */}
          <ul className="relative flex w-full flex-col items-center gap-7 text-center mix-blend-difference lg:absolute lg:left-[41vw] lg:top-[68%] lg:w-auto lg:-translate-y-1/2 lg:items-start lg:gap-[clamp(1.4rem,4vh,3rem)] lg:text-left">
            {CASE_STUDIES.map((cs, i) => (
              <li key={cs.name} className="w-full">
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  className="block w-full text-center text-white outline-none transition-opacity duration-300 hover:opacity-70 lg:text-left"
                >
                  <span className="block text-[clamp(1.4rem,3.4vw,3.6rem)] font-normal leading-[1.05] tracking-[-0.01em] lg:whitespace-nowrap lg:leading-[1.02]">
                    {cs.name}
                  </span>
                  <span className="mx-auto mt-2 block max-w-[82vw] text-[clamp(0.62rem,0.72vw,0.7rem)] uppercase leading-snug tracking-[0.1em] text-white/85 lg:mx-0 lg:max-w-none lg:whitespace-nowrap lg:leading-normal">
                    {subline(cs)}
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
