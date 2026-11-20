import { SERVICES } from "../../data/services";
import { PageShell, PageTitle } from "./PageShell";
import { GravityWords, type GravityWord } from "./GravityWords";

interface Props {
  open: boolean;
  onBack: () => void;
}

// A different colour per service, all strong against the sky-blue page.
const COLORS = [
  "var(--color-brand-pink)",
  "#000000",
  "#3a4cff",
  "#ff6a13",
  "#7b2bff",
  "#ffffff",
  "#e8221c",
  "#0f8a55",
  "#8a1c4a",
];

// Each service falls as one piece, in its own colour.
const WORDS: GravityWord[] = SERVICES.map((name, i) => ({
  text: name,
  group: name,
  color: COLORS[i % COLORS.length],
}));

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
