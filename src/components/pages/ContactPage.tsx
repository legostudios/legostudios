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

// Pixel-art icons on a 13×13 grid: a rounded square in the icon's brand
// colour ("f") with a bold black outline and black symbol ("#"), so the
// envelope, camera and "in" read clearly.
const MAIL = [
  "..#########..",
  ".#fffffffff#.",
  "#fffffffffff#",
  "#f#########f#",
  "#f##fffff##f#",
  "#f#f#fff#f#f#",
  "#f#ff#f#ff#f#",
  "#f#fff#fff#f#",
  "#f#fffffff#f#",
  "#f#########f#",
  "#fffffffffff#",
  ".#fffffffff#.",
  "..#########..",
];
const INSTA = [
  "..#########..",
  ".#fffffffff#.",
  "#fffffffffff#",
  "#fff#####fff#",
  "#ff#ffff##ff#",
  "#ff#f###f#ff#",
  "#ff#f#f#f#ff#",
  "#ff#f###f#ff#",
  "#ff#fffff#ff#",
  "#fff#####fff#",
  "#fffffffffff#",
  ".#fffffffff#.",
  "..#########..",
];
const LINKED = [
  "..#########..",
  ".#fffffffff#.",
  "#fffffffffff#",
  "#ff#ffffffff#",
  "#fffffffffff#",
  "#ff#f#f##fff#",
  "#ff#f##ff#ff#",
  "#ff#f#fff#ff#",
  "#ff#f#fff#ff#",
  "#ff#f#fff#ff#",
  "#fffffffffff#",
  ".#fffffffff#.",
  "..#########..",
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
                  <PixelIcon rects={toRects(l.grid)} grid={13} size={39} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
