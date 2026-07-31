import { useEffect, useRef, useState, type ReactNode } from "react";
import { CASE_STUDIES, type CaseStudy } from "../data/caseStudies";

// Tight Helvetica-style face for the big titles, matching the services page.
const DISPLAY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const subline = (cs: CaseStudy) =>
  cs.stats.map((s) => `${s.value} ${s.label}`).join("  |  ");

interface CaseStudiesPageProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
}

// Case studies in the Artists Equity style. The list inverts to a white block
// on hover; clicking a row swaps in the full detail for that study.
export function CaseStudiesPage({
  closing,
  onRequestClose,
  onCloseFinished,
}: CaseStudiesPageProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
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
      className={`fixed inset-0 z-[60] overflow-y-auto bg-black text-white outline-none transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        closing ? "opacity-0" : "opacity-100 starting:opacity-0"
      }`}
      style={{ fontFamily: DISPLAY }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onRequestClose}
        aria-label="Close case studies"
        className="fixed right-5 top-5 z-[65] text-[13px] uppercase tracking-widest text-white/60 transition-colors hover:text-white sm:right-8 sm:top-7"
      >
        Close ✕
      </button>

      <div className="mx-auto max-w-[1500px] px-5 pb-24 pt-24 sm:px-8 md:pt-28">
        {selected === null ? (
          CASE_STUDIES.map((cs, i) => (
            <div key={cs.name} className="border-t border-white/15">
              <button
                type="button"
                onClick={() => setSelected(i)}
                className="group relative block w-full px-4 py-6 text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:px-6 sm:py-8"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-white opacity-0 transition-opacity duration-[600ms] ease-out group-hover:opacity-100"
                />
                <div className="relative transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 sm:group-hover:translate-x-6">
                  <h2 className="text-[clamp(2.4rem,7.5vw,5.75rem)] font-bold leading-[0.92] tracking-tight text-white transition-colors duration-[600ms] ease-out group-hover:text-black">
                    {cs.name}
                  </h2>
                  <p className="mt-3 text-[13px] uppercase tracking-widest text-white/50 transition-colors duration-[600ms] ease-out group-hover:text-black/60">
                    {subline(cs)}
                  </p>
                </div>
              </button>
            </div>
          ))
        ) : (
          <CaseStudyDetail
            cs={CASE_STUDIES[selected]}
            onBack={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14 border-t border-white/20 pt-10">
      <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold">{title}</h3>
      <div className="mt-4 max-w-[72ch] text-[clamp(1rem,1.6vw,1.35rem)] leading-relaxed text-white/75">
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
        className="mb-12 text-[13px] uppercase tracking-widest text-white/60 transition-colors hover:text-white"
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
            <div className="mt-2 text-[13px] uppercase tracking-widest text-white/55">
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
              <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
