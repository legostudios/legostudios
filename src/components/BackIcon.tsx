import { PixelIcon } from "./PixelIcon";
import { toRects } from "../lib/pixels";

// Pixel-art left arrow (13×13 at 2× = 26px), in the same style as the menu
// square and contact icon. Its fill flashes through the brand colours (CSS).
const GRID = [
  ".............",
  ".....##......",
  "....#wf#.....",
  "...#wff#.....",
  "..#wff#######",
  ".#wfffffffff#",
  "#fffffffffff#",
  ".#ffffffffff#",
  "..#fff#######",
  "...#ff#......",
  "....#f#......",
  ".....##......",
  ".............",
];
const RECTS = toRects(GRID);

export function BackIcon() {
  return <PixelIcon className="back-icon" rects={RECTS} grid={GRID.length} />;
}
