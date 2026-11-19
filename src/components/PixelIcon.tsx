import type { Rect } from "../lib/pixels";

// Draws pixel art (see lib/pixels) as crisp SVG rects. Shown at an exact multiple of the grid (13×13 at 26px = 2×) so every pixel
// stays sharp.

export function PixelIcon({
  rects,
  grid,
  size = 26,
  className,
}: {
  rects: Rect[];
  grid: number;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${grid} ${grid}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  );
}
