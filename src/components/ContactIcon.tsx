// A retro pixel-art "person" icon (head and shoulders), drawn on a 16×16 grid.
// "#" = black outline, "f" = fill (currentColor, so CSS can cycle it through
// the brand colours), "w" = white highlight.
const GRID = [
  "......####......",
  "....##ffff##....",
  "...#wwffffff#...",
  "...#wfffffff#...",
  "...#wfffffff#...",
  "...#ffffffff#...",
  "....##ffff##....",
  "......####......",
  "................",
  ".....######.....",
  "...##wwfffff##..",
  "..#wwfffffffff#.",
  ".#wffffffffffff#",
  ".#wffffffffffff#",
  "#wfffffffffffff#",
  "#wfffffffffffff#",
];

const COLOURS: Record<string, string> = {
  "#": "#000000",
  f: "currentColor",
  w: "#ffffff",
};

// Merge horizontal runs of the same pixel into one rect each.
const RECTS = GRID.flatMap((row, y) => {
  const out: { x: number; y: number; w: number; c: string }[] = [];
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

export function ContactIcon({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {RECTS.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  );
}
