import { PageShell, PageTitle } from "./PageShell";
import { ContactForm } from "../ContactForm";

const EMAIL = "hello@legostudios.co";
const LINKEDIN = "https://www.linkedin.com/company/lego-studios/";
const INSTAGRAM = "https://www.instagram.com/legostudios.in";

interface Props {
  open: boolean;
  onBack: () => void;
}

// Contact — black. The email is the hero of the page; socials sit below in
// the brand colours, then the contact form.
export function ContactPage({ open, onBack }: Props) {
  return (
    <PageShell open={open} theme="black" label="Contact" onBack={onBack}>
      <PageTitle>Contact</PageTitle>
      <div className="contact">
        <span className="contact-label">Email</span>
        <a href={`mailto:${EMAIL}`} className="contact-email">
          {EMAIL}
        </a>
        <span className="contact-label">Follow</span>
        <div className="contact-socials">
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="contact-social contact-social--sky">
            Instagram <span aria-hidden="true">↗</span>
          </a>
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="contact-social contact-social--pink">
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <section className="contact-form-section" aria-labelledby="contact-form-heading">
        <h2 id="contact-form-heading" className="contact-form-heading">
          Send a message
        </h2>
        <ContactForm to={EMAIL} />
      </section>
    </PageShell>
  );
}
