import { PageShell } from "./PageShell";
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

// Pixel-art icons on a 15×15 grid: a borderless rounded square in the icon's
// brand colour ("f") with the real logo's structure drawn in black ("#"):
// an envelope, Instagram's rounded camera with its lens and flash dot, and
// LinkedIn's "in".
const ICON_GRID = 15;
const MAIL = [
  "...fffffffff...",
  ".fffffffffffff.",
  ".fffffffffffff.",
  "fffffffffffffff",
  "ff###########ff",
  "ff##fffffff##ff",
  "ff#f#fffff#f#ff",
  "ff#ff#fff#ff#ff",
  "ff#fff#f#fff#ff",
  "ff#ffff#ffff#ff",
  "ff#fffffffff#ff",
  "ff###########ff",
  ".fffffffffffff.",
  ".fffffffffffff.",
  "...fffffffff...",
];
const INSTA = [
  "...fffffffff...",
  ".fffffffffffff.",
  ".fff#######fff.",
  "fff#fffffff#fff",
  "ff#fffffff#f#ff",
  "ff#fff###fff#ff",
  "ff#ff#fff#ff#ff",
  "ff#ff#fff#ff#ff",
  "ff#ff#fff#ff#ff",
  "ff#fff###fff#ff",
  "ff#fffffffff#ff",
  "fff#fffffff#fff",
  ".fff#######fff.",
  ".fffffffffffff.",
  "...fffffffff...",
];
const LINKED = [
  "...fffffffff...",
  ".fffffffffffff.",
  ".fffffffffffff.",
  "fffffffffffffff",
  "fff##ffffffffff",
  "fffffffffffffff",
  "fff##f#####ffff",
  "fff##f######fff",
  "fff##f##ff##fff",
  "fff##f##ff##fff",
  "fff##f##ff##fff",
  "fff##f##ff##fff",
  ".fffffffffffff.",
  ".fffffffffffff.",
  "...fffffffff...",
];

const LINKS = [
  { label: `Email ${EMAIL}`, href: `mailto:${EMAIL}`, grid: MAIL, tone: "yellow", external: false },
  { label: "Instagram", href: INSTAGRAM, grid: INSTA, tone: "sky", external: true },
  { label: "LinkedIn", href: LINKEDIN, grid: LINKED, tone: "pink", external: true },
];

// Contact — white. The word "contact" in the brand pixel font across the top;
// bottom-left the enquiry form in small type; bottom-right the email /
// Instagram / LinkedIn pixel icons stacked.
export function ContactPage({ open, onBack }: Props) {
  return (
    <PageShell open={open} theme="white" label="Contact" onBack={onBack}>
      <div className="contact2">
        <h1 className="page-title contact-word">contact</h1>
        <div className="contact2-bottom">
          <section className="contact2-form" aria-label="Send a message">
            <h2 className="contact2-form-heading">Send a message</h2>
            <ContactForm to={EMAIL} cc={FORM_CC} />
          </section>
          <ul className="contact2-socials">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-label={l.label}
                  title={l.label}
                  className={`contact-icon contact-icon--${l.tone}`}
                  {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <PixelIcon rects={toRects(l.grid)} grid={ICON_GRID} size={45} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
