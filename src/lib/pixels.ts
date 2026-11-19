// Turns pixel art written as a grid of characters into SVG rects.
// "#" = black outline, "f" = fill (currentColor, so CSS can cycle it through
// the brand colours), "w" = white highlight, anything else = transparent.

const COLOURS: Record<string, string> = {
  "#": "#000000",
  f: "currentColor",
  w: "#ffffff",
};

export type Rect = { x: number; y: number; w: number; c: string };

// Merge horizontal runs of the same pixel into one rect each.
export function toRects(grid: string[]): Rect[] {
  return grid.flatMap((row, y) => {
    const out: Rect[] = [];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x;
      while (end < row.length && row[end] === ch) end++;
      if (COLOURS[ch]) out.push({ x, y, w: end - x, c: COLOURS[ch] });
      x = end;
    }
    return out;
  });
}
