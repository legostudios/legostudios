import { PixelIcon } from "./PixelIcon";
import { toRects } from "../lib/pixels";

// A retro pixel-art "person" icon (head and shoulders) on a 13×13 grid, the
// same size and style as the menu square.
const GRID = [
  "....#####....",
  "...#wwfff#...",
  "...#wffff#...",
  "...#fffff#...",
  "...#fffff#...",
  "....#####....",
  ".............",
  "....#####....",
  "..##wffff##..",
  ".#wffffffff#.",
  ".#wffffffff#.",
  "#wffffffffff#",
  "#wffffffffff#",
];
const RECTS = toRects(GRID);

export function ContactIcon({ size = 26 }: { size?: number }) {
  return <PixelIcon rects={RECTS} grid={GRID.length} size={size} />;
}
