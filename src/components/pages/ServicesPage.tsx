import { SERVICES } from "../../data/services";
import { PageShell, PageTitle } from "./PageShell";

const pad = (n: number) => String(n).padStart(2, "0");

interface Props {
  open: boolean;
  onBack: () => void;
  onClose: () => void;
}

// Services — sky blue. Numbered rows in big condensed type that invert to
// black on hover.
export function ServicesPage({ open, onBack, onClose }: Props) {
  return (
    <PageShell open={open} theme="sky" label="Services" onBack={onBack} onClose={onClose}>
      <PageTitle>Services</PageTitle>
      <ol className="page-rows">
        {SERVICES.map((name, i) => (
          <li key={name} className="page-row">
            <span className="page-row-num">{pad(i + 1)}</span>
            <span className="page-row-name">{name}</span>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
