import { SERVICES } from "../../data/services";
import { PageShell, PageTitle } from "./PageShell";
import { GravityWords, type GravityWord } from "./GravityWords";

interface Props {
  open: boolean;
  onBack: () => void;
}

// Each service falls as one piece.
const WORDS: GravityWord[] = SERVICES.map((name) => ({ text: name, group: name }));

// Services — sky blue: the service names fall, pile up and can be grabbed,
// thrown and bumped around.
export function ServicesPage({ open, onBack }: Props) {
  return (
    <PageShell open={open} theme="sky" label="Services" onBack={onBack}>
      <div className="stack-wrap">
        <div className="stack-head">
          <PageTitle>Services</PageTitle>
        </div>
        {/* Mounted only while open, so the words drop in each time. */}
        {open && <GravityWords words={WORDS} />}
      </div>
    </PageShell>
  );
}
