import { SERVICES } from "../../data/services";
import { PageShell, PageTitle } from "./PageShell";
import { GravityWords, type GravityWord } from "./GravityWords";

interface Props {
  open: boolean;
  onBack: () => void;
}

// Every word of every service, each knowing which service it belongs to.
// The "&"s get the brand pink as a small accent.
const WORDS: GravityWord[] = SERVICES.flatMap((name) =>
  name.split(" ").map((text) => ({
    text,
    group: name,
    color: text === "&" ? "var(--color-brand-pink)" : undefined,
  })),
);

// Services — sky blue: the service names as words that fall, pile up and can
// be grabbed, thrown and bumped around.
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
