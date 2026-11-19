import { SERVICES } from "../../data/services";
import { PageShell, PageTitle } from "./PageShell";

interface Props {
  open: boolean;
  onBack: () => void;
}

// Services — sky blue. Lower-case rows that invert to black on hover.
export function ServicesPage({ open, onBack }: Props) {
  return (
    <PageShell open={open} theme="sky" label="Services" onBack={onBack} lowercase>
      <PageTitle>Services</PageTitle>
      <ol className="page-rows page-rows--plain">
        {SERVICES.map((name) => (
          <li key={name} className="page-row">
            <span className="page-row-name">{name}</span>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
