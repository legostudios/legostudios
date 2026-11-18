import { CASE_STUDIES } from "../../data/caseStudies";
import { PageShell, PageTitle } from "./PageShell";

const pad = (n: number) => String(n).padStart(2, "0");

interface Props {
  open: boolean;
  onBack: () => void;
  onSelect: (index: number) => void;
}

// Case Studies — pink. Each row shows the name and its headline numbers; hover
// inverts it, click opens the full study.
export function CaseStudiesPage({ open, onBack, onSelect }: Props) {
  return (
    <PageShell open={open} theme="pink" label="Case Studies" onBack={onBack}>
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
    </PageShell>
  );
}
