import { useId } from "react";

export type FolderTheme = "blue" | "orange" | "green";

// Folder body and its slightly deeper back panel. The art on the front (orb,
// heat-map star, wavy ring) uses the same warm palette on every folder.
const THEMES: Record<FolderTheme, { body: string; back: string; edge: string }> = {
  blue: { body: "#3f52f0", back: "#3446db", edge: "#8d99ff" },
  orange: { body: "#e8483f", back: "#dd3f39", edge: "#ff9a8e" },
  green: { body: "#15a86a", back: "#11955d", edge: "#7fe0b5" },
};

// A star as a polygon: alternating outer/inner radius, with a per-point
// wobble so it looks hand-made rather than geometric.
function star(cx: number, cy: number, r: number, inner: number, points: number, rot: number, wobble: number[]) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i / (points * 2)) * Math.PI * 2;
    const rr = (i % 2 === 0 ? r : inner) * (wobble[i % wobble.length] ?? 1);
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")}Z`;
}

// A soft, wavy (smoothed) star for the hole in the middle of the big star.
function softStar(cx: number, cy: number, r: number, inner: number, points: number) {
  const p: [number, number][] = [];
  for (let i = 0; i <= points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : inner;
    p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  let d = `M${((p[0][0] + p[1][0]) / 2).toFixed(1)},${((p[0][1] + p[1][1]) / 2).toFixed(1)}`;
  for (let i = 1; i < p.length - 1; i++) {
    d += ` Q${p[i][0].toFixed(1)},${p[i][1].toFixed(1)} ${((p[i][0] + p[i + 1][0]) / 2).toFixed(1)},${((p[i][1] + p[i + 1][1]) / 2).toFixed(1)}`;
  }
  return d + "Z";
}

// A wavy ring: a circle whose radius ripples.
function wavyRing(cx: number, cy: number, r: number, amp: number, waves: number) {
  let d = "";
  const steps = waves * 12;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = r + amp * Math.sin(a * waves);
    d += `${i === 0 ? "M" : " L"}${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  return d + "Z";
}

// The big star runs off the right and bottom edges of the folder.
const STAR = star(264, 176, 168, 74, 5, (170 * Math.PI) / 180, [1.02, 1, 0.92, 1, 1.05, 1, 1, 1, 0.95, 1]);
const HOLE = softStar(244, 132, 50, 33, 6);
const RING = wavyRing(140, 100, 46, 3.4, 16);

// The folder (a desktop-style icon): tabbed back panel, front panel with a
// light top edge, heavy grain, a large orange orb, a heat-map star with a
// blue glowing edge and a dark wavy ring — after the design reference.
export function Folder({ theme }: { theme: FolderTheme }) {
  const t = THEMES[theme];
  const id = useId().replace(/:/g, "");
  const u = (n: string) => `url(#${n}-${id})`;

  return (
    <svg className="folder-svg" viewBox="0 0 320 250" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`orb-${id}`} cx="45%" cy="25%" r="80%">
          <stop offset="0%" stopColor="#f2581f" />
          <stop offset="55%" stopColor="#f99a1c" />
          <stop offset="100%" stopColor="#fdb515" />
        </radialGradient>
        <linearGradient id={`heat-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb21a" />
          <stop offset="45%" stopColor="#ff8a12" />
          <stop offset="100%" stopColor="#ffb21a" />
        </linearGradient>
        <filter id={`b2-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <filter id={`b5-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`b12-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        {/* Heavy paper grain over the whole folder. */}
        <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.75" />
          </feComponentTransfer>
        </filter>
        {/* The star body (outline minus the hole). */}
        <clipPath id={`starbody-${id}`}>
          <path d={`${STAR} ${HOLE}`} clipRule="evenodd" />
        </clipPath>
        <clipPath id={`front-${id}`}>
          <rect x="6" y="50" width="308" height="194" rx="14" />
        </clipPath>
        <clipPath id={`whole-${id}`}>
          <path d="M6 28 Q6 10 24 10 H118 Q127 10 133 17 L146 33 H296 Q314 33 314 51 V230 Q314 244 300 244 H20 Q6 244 6 230 Z" />
        </clipPath>
      </defs>

      {/* Back panel with the tab. */}
      <path
        className="folder-back"
        d="M6 28 Q6 10 24 10 H118 Q127 10 133 17 L146 33 H296 Q314 33 314 51 V230 Q314 244 300 244 H20 Q6 244 6 230 Z"
        fill={t.back}
      />

      <g className="folder-front">
        <rect x="6" y="50" width="308" height="194" rx="14" fill={t.body} />
        <g clipPath={u("front")}>
          {/* Orb, under the star. */}
          <circle cx="78" cy="196" r="74" fill={u("orb")} opacity="0.97" />

          {/* Blue glow just outside the star's edges (drawn first, so the
              body covers its inner half). */}
          <path d={`${STAR} ${HOLE}`} fillRule="evenodd" fill="none" stroke="#4b4fe0" strokeWidth="11" strokeLinejoin="round" filter={u("b2")} opacity="0.95" />
          {/* Heat-map body: warm base with red, dark and blue hot spots. */}
          <g clipPath={u("starbody")}>
            <rect x="80" y="20" width="300" height="300" fill={u("heat")} />
            <ellipse cx="312" cy="128" rx="30" ry="22" fill="#e8221c" filter={u("b12")} />
            <ellipse cx="190" cy="206" rx="70" ry="22" fill="#e8221c" filter={u("b12")} />
            <ellipse cx="244" cy="236" rx="18" ry="30" fill="#4a0d10" filter={u("b12")} />
            <ellipse cx="312" cy="196" rx="20" ry="30" fill="#4b4fe0" filter={u("b12")} />
            <ellipse cx="270" cy="70" rx="12" ry="14" fill="#e8221c" filter={u("b5")} />
            {/* Bright inner rim along both edges. */}
            <path d={`${STAR} ${HOLE}`} fillRule="evenodd" fill="none" stroke="#ffc21f" strokeWidth="10" strokeLinejoin="round" filter={u("b2")} />
          </g>
          {/* The hole shows the folder body. */}
          <path d={HOLE} fill={t.body} opacity="0" />

          {/* Wavy ring, on top. */}
          <path d={RING} fill="none" stroke="#2a2a52" strokeWidth="1.5" opacity="0.75" />
        </g>
        {/* Light top edge of the front panel. */}
        <rect x="16" y="51" width="288" height="2.5" rx="1.25" fill={t.edge} opacity="0.9" />
      </g>

      {/* Grain over everything. */}
      <rect x="0" y="0" width="320" height="250" filter={u("grain")} clipPath={u("whole")} style={{ mixBlendMode: "soft-light" }} />
    </svg>
  );
}
