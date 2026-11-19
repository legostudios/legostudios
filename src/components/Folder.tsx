import { useId } from "react";

export type FolderTheme = "sky" | "yellow";

const BRAND = {
  pink: "#f238a7",
  sky: "#79eede",
  yellow: "#e5fe02",
};

// Each folder: its body colour, a slightly deeper back panel, and the two
// other brand colours for the abstract art on the front.
const THEMES: Record<FolderTheme, { body: string; back: string; orb: [string, string]; star: string; glow: string }> = {
  sky: { body: BRAND.sky, back: "#5fd9c8", orb: [BRAND.yellow, BRAND.pink], star: BRAND.pink, glow: BRAND.yellow },
  yellow: { body: BRAND.yellow, back: "#cfe600", orb: [BRAND.sky, BRAND.pink], star: BRAND.pink, glow: BRAND.sky },
};

// A wavy six-point "star" blob, drawn around (cx, cy).
function starPath(cx: number, cy: number, r: number, inner: number, points = 6) {
  const pts: string[] = [];
  const steps = points * 2;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : inner;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  // Smooth the polygon into a soft blob with quadratic curves through midpoints.
  const p = pts.map((s) => s.split(",").map(Number));
  let d = `M${((p[0][0] + p[1][0]) / 2).toFixed(1)},${((p[0][1] + p[1][1]) / 2).toFixed(1)}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2;
    const my = (p[i][1] + p[i + 1][1]) / 2;
    d += ` Q${p[i][0]},${p[i][1]} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  return d + "Z";
}

// A thin hand-drawn squiggle.
function squiggle(x0: number, y0: number, len: number, amp: number, waves: number) {
  let d = `M${x0},${y0}`;
  const step = len / (waves * 2);
  for (let i = 0; i < waves * 2; i++) {
    const x = x0 + step * (i + 1);
    const cy = y0 + (i % 2 === 0 ? -amp : amp);
    d += ` Q${(x - step / 2).toFixed(1)},${cy} ${x.toFixed(1)},${y0}`;
  }
  return d;
}

const STAR = starPath(232, 150, 92, 46);
const STAR_HOLE = starPath(232, 150, 40, 20);
const SQUIGGLE = squiggle(70, 96, 120, 9, 6);

// A folder icon in the spirit of a desktop folder: tabbed back panel, a front
// flap with a light top edge, grainy paper texture and abstract art (a soft
// orb, a glowing wavy star, a squiggle) in the other brand colours.
export function Folder({ theme }: { theme: FolderTheme }) {
  const t = THEMES[theme];
  const id = useId().replace(/:/g, "");

  return (
    <svg className="folder-svg" viewBox="0 0 320 250" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`orb-${id}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={t.orb[1]} />
          <stop offset="70%" stopColor={t.orb[0]} />
          <stop offset="100%" stopColor={t.orb[0]} stopOpacity="0.85" />
        </radialGradient>
        <filter id={`blur-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id={`soft-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        {/* Paper grain: fine noise, shown faintly over the folder. */}
        <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.55" />
          </feComponentTransfer>
        </filter>
        <clipPath id={`front-${id}`}>
          <rect x="6" y="58" width="308" height="186" rx="14" />
        </clipPath>
        <clipPath id={`whole-${id}`}>
          <path d="M6 30 Q6 16 20 16 H112 Q120 16 126 22 L140 38 H300 Q314 38 314 52 V230 Q314 244 300 244 H20 Q6 244 6 230 Z" />
        </clipPath>
      </defs>

      {/* Back panel with the tab. */}
      <path
        className="folder-back"
        d="M6 30 Q6 16 20 16 H112 Q120 16 126 22 L140 38 H300 Q314 38 314 52 V230 Q314 244 300 244 H20 Q6 244 6 230 Z"
        fill={t.back}
      />

      {/* Front flap (tips open on hover). */}
      <g className="folder-front">
        <rect x="6" y="58" width="308" height="186" rx="14" fill={t.body} />
        <g clipPath={`url(#front-${id})`}>
          {/* Glowing wavy star: blurred glow under a crisp core. */}
          <path d={STAR} fill={t.glow} filter={`url(#blur-${id})`} opacity="0.95" />
          <path d={STAR} fill="none" stroke={t.star} strokeWidth="16" filter={`url(#soft-${id})`} />
          <path d={STAR} fill="none" stroke="#3b2fd0" strokeWidth="3" opacity="0.55" filter={`url(#soft-${id})`} />
          <path d={STAR_HOLE} fill={t.body} filter={`url(#soft-${id})`} />
          {/* Soft orb. */}
          <circle cx="96" cy="176" r="62" fill={`url(#orb-${id})`} opacity="0.95" />
          {/* Squiggle. */}
          <path d={SQUIGGLE} fill="none" stroke="#1d1d3a" strokeWidth="1.6" opacity="0.6" />
        </g>
        {/* Light top edge of the flap. */}
        <rect x="14" y="60" width="292" height="2.5" rx="1.25" fill="#ffffff" opacity="0.55" />
      </g>

      {/* Grain over everything. */}
      <rect x="0" y="0" width="320" height="250" filter={`url(#grain-${id})`} clipPath={`url(#whole-${id})`} style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}
