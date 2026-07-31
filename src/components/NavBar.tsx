const LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/legostudios.co?igsh=MXI2NjBwN2d4dnlncw==",
    external: true,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/lego-studios/",
    external: true,
  },
  { label: "Mail", href: "mailto:hello@legostudios.co", external: false },
];

const MONO = '"VCR OSD Mono", ui-monospace, monospace';

interface NavBarProps {
  onServices: () => void;
  onCaseStudies: () => void;
}

const linkClass =
  "text-[15px] tracking-wide text-white/55 transition-colors duration-150 hover:text-white";

// Top navigation modeled on internetcinematic.com: a centered row of monospace
// text links. The header itself ignores pointer events so the overlay pages'
// top-right close button stays clickable through the empty areas.
export function NavBar({ onServices, onCaseStudies }: NavBarProps) {
  return (
    <header
      style={{ fontFamily: MONO }}
      className="pointer-events-none fixed inset-x-0 top-7 z-[70] flex h-16 items-center justify-center px-5 md:top-10 md:h-20"
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 lg:gap-x-12"
      >
        <button type="button" onClick={onServices} className={linkClass}>
          Services
        </button>
        <button type="button" onClick={onCaseStudies} className={linkClass}>
          Case Studies
        </button>
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={linkClass}
            {...(link.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
