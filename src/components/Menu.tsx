import type { CSSProperties } from "react";
import { usePresence } from "../hooks/usePresence";
import { Folder, type FolderTheme } from "./Folder";

export type PageId = "services" | "caseStudies" | "contact";

const FOLDERS: { label: string; id: PageId; theme: FolderTheme }[] = [
  { label: "Services", id: "services", theme: "sky" },
  { label: "Case Studies", id: "caseStudies", theme: "yellow" },
];

interface MenuProps {
  open: boolean;
  onOpenPage: (id: PageId) => void;
  onBack: () => void;
}

// Full-screen brand-pink menu: two desktop-style folders (Services, Case
// Studies) in the other brand colours, with a Contact link beneath.
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
      <div className="menu-desk">
        <ul className="menu-folders">
          {FOLDERS.map((f, i) => (
            <li key={f.id} style={{ "--i": i } as CSSProperties}>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => onOpenPage(f.id)}
                className="menu-folder"
              >
                <Folder theme={f.theme} />
                <span className="menu-folder-label">{f.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          onClick={() => onOpenPage("contact")}
          className="menu-contact"
          style={{ "--i": FOLDERS.length } as CSSProperties}
        >
          Contact
        </button>
      </div>
    </nav>
  );
}
