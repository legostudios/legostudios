import { SERVICES } from "../../data/services";
import { SHOWCASE_IMAGES } from "../../data/showcaseImages";
import { PageShell, PageTitle } from "./PageShell";
import { StackView, type StackItem } from "./StackView";

interface Props {
  open: boolean;
  onBack: () => void;
}

const ITEMS: StackItem[] = SERVICES.map((name, i) => ({
  title: name,
  image: SHOWCASE_IMAGES[(i + 6) % SHOWCASE_IMAGES.length],
}));

// Services — sky blue: a 3D stack of glass panels to travel through.
export function ServicesPage({ open, onBack }: Props) {
  return (
    <PageShell open={open} theme="sky" label="Services" onBack={onBack} lowercase>
      <div className="stack-wrap">
        <div className="stack-head">
          <PageTitle>Services</PageTitle>
        </div>
        <StackView items={ITEMS} />
      </div>
    </PageShell>
  );
}
