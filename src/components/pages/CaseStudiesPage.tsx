import { CASE_STUDIES } from "../../data/caseStudies";
import { SHOWCASE_IMAGES } from "../../data/showcaseImages";
import { PageShell, PageTitle } from "./PageShell";
import { StackView, type StackItem } from "./StackView";
import { CaseStudiesMobile } from "./CaseStudiesMobile";
import { useMediaQuery } from "../../hooks/useMediaQuery";

// Phones get their own pinned, scroll-driven collage; larger screens keep the
// 3D glass stack.
const MOBILE = "(max-width: 767px)";

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

// Case Studies — pink: a 3D stack of glass panels, one per study (hover for
// the name and numbers, click to open the full study).
export function CaseStudiesPage({ open, onBack, onSelect }: Props) {
  const mobile = useMediaQuery(MOBILE);
  return (
    <PageShell open={open} theme="pink" label="Case Studies" onBack={onBack}>
      {mobile ? (
        <CaseStudiesMobile items={ITEMS} onOpen={onSelect} />
      ) : (
        <div className="stack-wrap">
          <div className="stack-head">
            <PageTitle>Case Studies</PageTitle>
          </div>
          <StackView items={ITEMS} onOpen={onSelect} />
        </div>
      )}
    </PageShell>
  );
}
