import { useEffect, useRef, type ReactNode } from "react";
import { usePresence } from "../../hooks/usePresence";

export type PageTheme = "yellow" | "sky" | "pink" | "white" | "black";

interface PageShellProps {
  open: boolean;
  theme: PageTheme;
  /** Accessible name for the page. */
  label: string;
  onBack: () => void;
  onClose: () => void;
  /** Stacking layer: inner pages sit above the menu, details above pages. */
  layer?: "page" | "detail";
  /** Optional text shown in the middle of the top bar (e.g. "01 / 05"). */
  meta?: ReactNode;
  /** Changing this scrolls the page back to the top (e.g. next case study). */
  scrollKey?: unknown;
  children: ReactNode;
}

// A full-screen page in one brand colour: a sticky top bar (Back on the left,
// beside the menu square; Close on the right) and a scrolling body. Fades and
// rises in on open, fades out on close.
export function PageShell({
  open,
  theme,
  label,
  onBack,
  onClose,
  layer = "page",
  meta,
  scrollKey,
  children,
}: PageShellProps) {
  const { mounted, visible } = usePresence(open);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [scrollKey]);

  if (!mounted) return null;

  return (
    <div
      ref={scroller}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-hidden={!open}
      className={`page page--${theme} page--${layer} ${visible ? "is-visible" : ""}`}
    >
      <header className="page-bar">
        <button type="button" onClick={onBack} className="page-bar-link page-bar-back">
          <span aria-hidden="true">←</span> Back
        </button>
        {meta && <span className="page-bar-meta">{meta}</span>}
        <button type="button" onClick={onClose} className="page-bar-link page-bar-close">
          Close
        </button>
      </header>
      <div className="page-body">{children}</div>
    </div>
  );
}

// The big condensed page title.
export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="page-title">{children}</h1>;
}
