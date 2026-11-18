import type { CSSProperties } from "react";
import { usePresence } from "../hooks/usePresence";

export type PageId = "services" | "caseStudies" | "contact";

const ITEMS: { label: string; id: PageId }[] = [
  { label: "Services", id: "services" },
  { label: "Case Studies", id: "caseStudies" },
  { label: "Contact", id: "contact" },
];

interface MenuProps {
  open: boolean;
  onOpenPage: (id: PageId) => void;
  onBack: () => void;
}

// Full-screen brand-yellow menu with the destinations in huge condensed caps.
export function Menu({ open, onOpenPage, onBack }: MenuProps) {
  const { mounted, visible } = usePresence(open);
  if (!mounted) return null;

  return (
    <nav
      aria-label="Main menu"
      aria-hidden={!open}
      className={`big-menu ${visible ? "is-open" : ""}`}
    >
      <button type="button" onClick={onBack} className="big-menu-back">
        Back
      </button>
      <ul className="big-menu-list">
        {ITEMS.map((item, i) => (
          <li key={item.id} style={{ "--i": i } as CSSProperties}>
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => onOpenPage(item.id)}
              className="big-menu-item"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
