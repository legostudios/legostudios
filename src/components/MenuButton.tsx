export type SquareSkip = "pink" | "sky" | "yellow" | null;

interface MenuButtonProps {
  onClick: () => void;
  /** Leave this colour out of the cycle (the page background is that colour). */
  skip?: SquareSkip;
}

// The menu button: a solid square, top-left on every page, flashing through
// the brand colours (pink → sky blue → yellow). Clicking it opens the menu
// (or closes it when the menu is showing).
export function MenuButton({ onClick, skip = null }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Menu"
      className={`menu-square ${skip ? `menu-square--skip-${skip}` : ""}`}
    >
      <span className="menu-square-box" aria-hidden="true" />
    </button>
  );
}
