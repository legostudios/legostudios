const LINKS = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" strokeWidth="2.3" />
        <circle cx="12" cy="12" r="3.7" fill="none" stroke="currentColor" strokeWidth="2.3" />
        <circle cx="17" cy="7" r="1.35" fill="currentColor" />
      </>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <>
        <path d="M6.3 10h3.2v9.9H6.3z" fill="currentColor" />
        <path d="M7.9 8.6a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" fill="currentColor" />
        <path d="M11.4 10h3.1v1.35c.45-.78 1.55-1.6 3.2-1.6 3.4 0 4 2.25 4 5.15v5h-3.25v-4.45c0-1.05-.02-2.42-1.48-2.42-1.48 0-1.7 1.15-1.7 2.35v4.52h-3.25V10Z" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Email",
    href: "mailto:hello@example.com",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2.2" fill="currentColor" />
        <path d="m4.5 7.8 7.5 5.6 7.5-5.6" fill="none" stroke="#020204" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

export function SocialLinks() {
  return (
    <nav aria-label="Social links" className="reference-social-nav flex items-center">
      {LINKS.map(({ label, href, icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          className="reference-social-link transition hover:scale-110"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            {icon}
          </svg>
        </a>
      ))}
    </nav>
  );
}
