import { useEffect } from "react";
import { CASE_STUDIES } from "../data/caseStudies";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const RED = "#d01012";
const LABEL = "text-[12px] uppercase tracking-[0.18em] text-black/55";

const imageFor = (i: number) => SHOWCASE_IMAGES[i % SHOWCASE_IMAGES.length];
const pad = (n: number) => String(n).padStart(2, "0");

interface CaseStudyPageProps {
  index: number;
  left: number;
  top: number;
  onBack: () => void;
}

// The case-study detail, opened inside the frame boundary (below the horizontal
// line, right of the vertical line): a counter, the big title, the photo, the
// highlight stats just below it, the challenge / approach copy, and the impact
// list (each with a red progress accent).
export function CaseStudyPage({ index, left, top, onBack }: CaseStudyPageProps) {
  const cs = CASE_STUDIES[index];

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cs.name}
      className="fixed z-[75] overflow-y-auto bg-white text-black opacity-100 transition-opacity duration-500 ease-out starting:opacity-0 motion-reduce:transition-none"
      style={{ left, top, right: 0, bottom: 0, fontFamily: HELV }}
    >
      {/* Top bar — just the counter (no divider line). */}
      <div className="sticky top-0 z-10 flex items-center justify-end bg-white px-5 py-4 sm:px-8">
        <span className="text-[13px] tracking-widest text-black/55">
          {pad(index + 1)} / {pad(CASE_STUDIES.length)}
        </span>
      </div>

      <div className="mx-auto max-w-[1500px]">
        {/* Title. */}
        <header className="px-5 pt-10 sm:px-8 sm:pt-16">
          <h1 className="max-w-[16ch] text-[clamp(2.3rem,7vw,6rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
            {cs.name}
          </h1>
        </header>

        {/* Photo. */}
        <div className="mt-10 px-5 sm:px-8">
          <div className="mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden border-2 border-black">
            <img
              src={imageFor(index)}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-full w-full object-cover grayscale"
            />
          </div>
        </div>

        {/* Highlights — just below the image. */}
        <section className="mt-10 flex flex-wrap gap-x-14 gap-y-9 px-5 sm:px-8">
          {cs.stats.map((s) => (
            <div key={s.label}>
              <div className="text-[clamp(2rem,5vw,3.6rem)] font-bold leading-none tracking-[-0.02em]">
                {s.value}
              </div>
              <div className={`mt-2 ${LABEL}`}>{s.label}</div>
            </div>
          ))}
        </section>

        {/* Challenge + approach. */}
        <section className="mt-14 border-t-2 border-black px-5 pt-9 sm:px-8">
          <h2 className={LABEL}>The Challenge</h2>
          <p className="mt-4 max-w-[80ch] text-[clamp(1.05rem,1.7vw,1.45rem)] leading-relaxed text-black/80">
            {cs.challenge}
          </p>
        </section>
        <section className="mt-10 px-5 sm:px-8">
          <h2 className={LABEL}>Our Approach</h2>
          <p className="mt-4 max-w-[80ch] text-[clamp(1.05rem,1.7vw,1.45rem)] leading-relaxed text-black/80">
            {cs.approach}
          </p>
        </section>

        {/* Impact list. */}
        <section className="mt-16 px-5 pb-28 sm:px-8">
          <h2 className={`mb-1 ${LABEL}`}>Business Impact</h2>
          {cs.impact.map((line, i) => (
            <div key={line} className="border-t-2 border-black py-7">
              <div className="flex items-baseline justify-between gap-6">
                <div className="text-[clamp(1.15rem,2.3vw,1.95rem)] font-medium leading-snug tracking-[-0.01em]">
                  {line}
                </div>
                <div className="shrink-0 text-[12px] tracking-widest text-black/40">
                  {pad(i + 1)}
                </div>
              </div>
              <div className="mt-5 h-[3px] w-full bg-black/10">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(38, 100 - i * 15)}%`,
                    background: RED,
                  }}
                />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
