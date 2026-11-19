import { PageShell, PageTitle } from "./PageShell";
import { ContactForm } from "../ContactForm";
import { PixelIcon } from "../PixelIcon";
import { toRects } from "../../lib/pixels";

const EMAIL = "hello@legostudios.co";
// Form submissions go to EMAIL and are copied to these addresses.
const FORM_CC = ["jashwanth@legostudios.co"];
const LINKEDIN = "https://www.linkedin.com/company/lego-studios/";
const INSTAGRAM = "https://www.instagram.com/legostudios.in";

interface Props {
  open: boolean;
  onBack: () => void;
}

// Pixel-art icons (13×13, shown at 3×), drawn in the current text colour.
// "f" = drawn pixel, "." = transparent.
const MAIL = [
  ".............",
  ".............",
  "fffffffffffff",
  "ff.........ff",
  "f.f.......f.f",
  "f..f.....f..f",
  "f...f...f...f",
  "f....f.f....f",
  "f.....f.....f",
  "f...........f",
  "fffffffffffff",
  ".............",
  ".............",
];
const INSTA = [
  "..fffffffff..",
  ".f.........f.",
  "f........ff.f",
  "f....fff....f",
  "f...f...f...f",
  "f..f.....f..f",
  "f..f.....f..f",
  "f..f.....f..f",
  "f...f...f...f",
  "f....fff....f",
  "f...........f",
  ".f.........f.",
  "..fffffffff..",
];
const LINKED = [
  "..fffffffff..",
  ".fffffffffff.",
  "ff..fffffffff",
  "ff..fffffffff",
  "fffffffffffff",
  "ff..f......ff",
  "ff..f..ff..ff",
  "ff..f..ff..ff",
  "ff..f..ff..ff",
  "ff..f..ff..ff",
  "ff..f..ff..ff",
  ".fffffffffff.",
  "..fffffffff..",
];

const LINKS = [
  { label: `Email ${EMAIL}`, href: `mailto:${EMAIL}`, grid: MAIL, tone: "yellow", external: false },
  { label: "Instagram", href: INSTAGRAM, grid: INSTA, tone: "sky", external: true },
  { label: "LinkedIn", href: LINKEDIN, grid: LINKED, tone: "pink", external: true },
];

// Contact — black. Lower-case heading with the email / Instagram / LinkedIn
// icons at the right end of its line, then the contact form.
export function ContactPage({ open, onBack }: Props) {
  return (
    <PageShell open={open} theme="black" label="Contact" onBack={onBack} lowercase>
      <div className="contact-head">
        <PageTitle>Contact</PageTitle>
        <ul className="contact-icons">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                aria-label={l.label}
                title={l.label}
                className={`contact-icon contact-icon--${l.tone}`}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <PixelIcon rects={toRects(l.grid)} grid={13} size={39} />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <section className="contact-form-section" aria-labelledby="contact-form-heading">
        <h2 id="contact-form-heading" className="contact-form-heading">
          Send a message
        </h2>
        <ContactForm to={EMAIL} cc={FORM_CC} />
      </section>
    </PageShell>
  );
}
