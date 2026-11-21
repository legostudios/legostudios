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

// Pixel-art icons on a 15×15 grid with no background tile: just each logo's
// own shape — the envelope, Instagram's rounded camera (lens + flash dot) and
// LinkedIn's bare "in" letters — outlined and detailed in black ("#") and
// filled with its brand colour ("f"). All span the same 13px width so they
// read as one size. "." is transparent.
const ICON_GRID = 15;
const MAIL = [
  "...............",
  "...............",
  ".#############.",
  ".##fffffffff##.",
  ".#f#fffffff#f#.",
  ".#ff#fffff#ff#.",
  ".#fff#fff#fff#.",
  ".#ffff#f#ffff#.",
  ".#fffff#fffff#.",
  ".#fffffffffff#.",
  ".#fffffffffff#.",
  ".#fffffffffff#.",
  ".#############.",
  "...............",
  "...............",
];
const INSTA = [
  "...............",
  "...#########...",
  "..#fffffffff#..",
  ".#fffffffffff#.",
  ".#fffffffff#f#.",
  ".#ffff###ffff#.",
  ".#fff#fff#fff#.",
  ".#fff#fff#fff#.",
  ".#fff#fff#fff#.",
  ".#ffff###ffff#.",
  ".#fffffffffff#.",
  ".#fffffffffff#.",
  "..#fffffffff#..",
  "...#########...",
  "...............",
];
const LINKED = [
  "...............",
  ".####..........",
  ".#ff#..........",
  ".####..........",
  "...............",
  ".####.#######..",
  ".#ff#.#ffffff#.",
  ".#ff#.#ff##ff#.",
  ".#ff#.#ff##ff#.",
  ".#ff#.#ff##ff#.",
  ".#ff#.#ff##ff#.",
  ".#ff#.#ff##ff#.",
  ".####.########.",
  "...............",
  "...............",
];

const LINKS = [
  { label: `Email ${EMAIL}`, href: `mailto:${EMAIL}`, grid: MAIL, tone: "yellow", external: false },
  { label: "Instagram", href: INSTAGRAM, grid: INSTA, tone: "pink", external: true },
  { label: "LinkedIn", href: LINKEDIN, grid: LINKED, tone: "blue", external: true },
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
