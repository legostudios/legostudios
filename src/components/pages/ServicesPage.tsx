import { useState } from "react";
import { SERVICES } from "../../data/services";
import { SHOWCASE_IMAGES } from "../../data/showcaseImages";
import { PageShell, PageTitle } from "./PageShell";
import { StackView, type StackItem } from "./StackView";
import { ViewToggle, type PageView } from "./ViewToggle";

interface Props {
  open: boolean;
  onBack: () => void;
}

const ITEMS: StackItem[] = SERVICES.map((name, i) => ({
  title: name,
  image: SHOWCASE_IMAGES[(i + 6) % SHOWCASE_IMAGES.length],
}));

// Services — sky blue. Overview: a 3D stack of panels to travel through.
// Index: the plain lower-case list.
export function ServicesPage({ open, onBack }: Props) {
  const [view, setView] = useState<PageView>("overview");
  return (
    <PageShell open={open} theme="sky" label="Services" onBack={onBack} lowercase>
      {view === "overview" ? (
        <div className="stack-wrap">
          <div className="stack-head">
            <PageTitle>Services</PageTitle>
          </div>
          <StackView items={ITEMS} />
        </div>
      ) : (
        <>
          <PageTitle>Services</PageTitle>
          <ol className="page-rows page-rows--plain">
            {SERVICES.map((name) => (
              <li key={name} className="page-row">
                <span className="page-row-name">{name}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      <ViewToggle view={view} onChange={setView} />
    </PageShell>
  );
}
