import { useState } from "react";
import { CASE_STUDIES } from "../../data/caseStudies";
import { SHOWCASE_IMAGES } from "../../data/showcaseImages";
import { PageShell, PageTitle } from "./PageShell";
import { StackView, type StackItem } from "./StackView";
import { ViewToggle, type PageView } from "./ViewToggle";

const pad = (n: number) => String(n).padStart(2, "0");

// Same photo as each study's detail page.
const ITEMS: StackItem[] = CASE_STUDIES.map((cs, i) => ({
  title: cs.name,
  meta: cs.stats
    .slice(0, 2)
    .map((st) => `${st.value} ${st.label}`)
    .join("  ·  "),
  image: SHOWCASE_IMAGES[i % SHOWCASE_IMAGES.length],
}));

interface Props {
  open: boolean;
  onBack: () => void;
  onSelect: (index: number) => void;
}

// Case Studies — pink. Overview: a 3D stack of the studies' photos (hover for
// the name and numbers, click to open). Index: rows with the name and headline
// numbers; click opens the full study.
export function CaseStudiesPage({ open, onBack, onSelect }: Props) {
  const [view, setView] = useState<PageView>("overview");
  return (
    <PageShell open={open} theme="pink" label="Case Studies" onBack={onBack}>
      {view === "overview" ? (
        <div className="stack-wrap">
          <div className="stack-head">
            <PageTitle>Case Studies</PageTitle>
          </div>
          <StackView items={ITEMS} onOpen={onSelect} />
        </div>
      ) : (
        <>
      <PageTitle>Case Studies</PageTitle>
      <ol className="page-rows">
        {CASE_STUDIES.map((cs, i) => (
          <li key={cs.name}>
            <button type="button" className="page-row page-row--link" onClick={() => onSelect(i)}>
              <span className="page-row-num">{pad(i + 1)}</span>
              <span className="page-row-main">
                <span className="page-row-name">{cs.name}</span>
                <span className="page-row-stats">
                  {cs.stats.slice(0, 3).map((s) => (
                    <span key={s.label}>
                      <strong>{s.value}</strong> {s.label}
                    </span>
                  ))}
                </span>
              </span>
              <span className="page-row-arrow" aria-hidden="true">→</span>
            </button>
          </li>
        ))}
      </ol>
        </>
      )}
      <ViewToggle view={view} onChange={setView} />
    </PageShell>
  );
}
