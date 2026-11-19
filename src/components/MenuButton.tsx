import { PixelIcon } from "./PixelIcon";
import { toRects } from "../lib/pixels";

export type SquareSkip = "pink" | "sky" | "yellow" | null;

// The square in the same pixel-art style as the contact icon: stepped
// corners, black pixel outline, white highlight along the top-left edge.
const GRID = [
  ".###########.",
  "#wwwwwwwwwff#",
  "#wffffffffff#",
  "#wffffffffff#",
  "#wffffffffff#",
  "#wffffffffff#",
  "#wffffffffff#",
  "#wffffffffff#",
  "#wffffffffff#",
  "#wffffffffff#",
  "#fffffffffff#",
  "#fffffffffff#",
  ".###########.",
];
const RECTS = toRects(GRID);

interface MenuButtonProps {
  onClick: () => void;
  /** Leave this colour out of the cycle (the page background is that colour). */
  skip?: SquareSkip;
}

// The menu button: a pixel-art square, top-left on every page, flashing through
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
      <PixelIcon className="menu-square-box" rects={RECTS} grid={GRID.length} />
    </button>
  );
}
