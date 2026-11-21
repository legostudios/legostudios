import { SERVICES } from "../../data/services";
import { PageShell, PageTitle } from "./PageShell";
import { GravityWords, type GravityWord } from "./GravityWords";

interface Props {
  open: boolean;
  onBack: () => void;
}

// A different colour per service, in the order of the services list:
// pink, burgundy, green, orange, violet, red, dark blue, brown, yellow.
const COLORS = [
  "var(--color-brand-pink)", // Clipping
  "#800020", // Marketing — burgundy
  "#0f8a55", // Brand Strategy — green
  "#ff6a13", // Campaigns — orange
  "#7b2bff", // Content Distribution — violet
  "#e8221c", // Personal Branding — red
  "#1b2a8a", // IP's — dark blue
  "#7a4a1e", // Creative Production — brown
  "var(--color-brand-yellow)", // Non boring stuff — yellow
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
