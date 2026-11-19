import { useRef } from "react";
import { CASE_STUDIES } from "../data/caseStudies";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";
import { PageShell } from "./pages/PageShell";

const imageFor = (i: number) => SHOWCASE_IMAGES[i % SHOWCASE_IMAGES.length];
const pad = (n: number) => String(n).padStart(2, "0");
const TILE_THEMES = ["pink", "sky", "yellow", "black"] as const;

interface CaseStudyPageProps {
  /** The study to show, or null when closed. */
  index: number | null;
  onBack: () => void;
  onNavigate: (index: number) => void;
}

// A single case study — white, with brand-coloured stat tiles: title, photo
// beside the headline numbers, challenge / approach, the impact list, and a
// big link through to the next study.
export function CaseStudyPage({ index, onBack, onNavigate }: CaseStudyPageProps) {
  // Keep showing the last study while the page animates out.
  const last = useRef(0);
  if (index !== null) last.current = index;
  const i = last.current;
  const cs = CASE_STUDIES[i];
  const next = (i + 1) % CASE_STUDIES.length;

  return (
    <PageShell
      open={index !== null}
      theme="white"
      layer="detail"
      label={cs.name}
      onBack={onBack}
      meta={`${pad(i + 1)} / ${pad(CASE_STUDIES.length)}`}
      scrollKey={i}
    >
      <span className="cs-kicker">Case Study</span>
      <h1 className="cs-title">{cs.name}</h1>

      <div className="cs-hero">
        <div className="cs-image">
          <img src={imageFor(i)} alt="" aria-hidden="true" draggable={false} />
        </div>
        <ul className="cs-stats">
          {cs.stats.map((s, k) => (
            <li key={s.label} className={`cs-stat cs-stat--${TILE_THEMES[k % TILE_THEMES.length]}`}>
              <span className="cs-stat-value">{s.value}</span>
              <span className="cs-stat-label">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="cs-copy">
        <section>
          <h2 className="cs-heading">The Challenge</h2>
          <p>{cs.challenge}</p>
        </section>
        <section>
          <h2 className="cs-heading">Our Approach</h2>
          <p>{cs.approach}</p>
        </section>
      </div>

      <section className="cs-impact">
        <h2 className="cs-heading">Business Impact</h2>
        <ol className="page-rows page-rows--plain">
          {cs.impact.map((line, k) => (
            <li key={line} className="page-row page-row--static">
              <span className="page-row-num">{pad(k + 1)}</span>
              <span className="cs-impact-line">{line}</span>
            </li>
          ))}
        </ol>
      </section>

      <button type="button" className="cs-next" onClick={() => onNavigate(next)}>
        <span className="cs-next-label">Next case study</span>
        <span className="cs-next-name">
          {CASE_STUDIES[next].name} <span aria-hidden="true">→</span>
        </span>
      </button>
    </PageShell>
  );
}
