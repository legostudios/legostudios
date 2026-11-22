// Phone case-study stack, measured from unveil.fr (Nov 2026) at 390×844.
//
// The reference draws the cards in Three.js, not CSS:
//   camera  PerspectiveCamera fov 5°, position (0, 100/7.5, 55) on portrait
//           (z = 35 when the viewport is wider than it is tall), lookAt origin
//   cards   yaw −30° (rotation.y = −π/6), no pitch
//   path    x spaced by 0.375; portrait depth z = −6x (landscape z = −x·aspect·1.5)
//   window  a card is drawn only while −12.5 < z < 12.5 (about 11 cards)
//   size    box width/height from the image aspect (see cardSize)
//   anchor  every card's right edge lines up; the mesh is shifted by ax
//   pop     the card closest to the camera rests at local (0.325, −0.1);
//           the others rest at (−0.325, 0), eased with expo.out over 0.5s
//   scroll  finger drag D = Δx − Δy in CSS pixels, smoothed 10% per 60fps frame,
//           and one card per 50px (J = −D / 50). No fling, no snap.
//   drag    150ms after touch-down the whole group scales to 0.825 (0.75s expo.out)
//   enter   an offset slides from −20 cards to 0 over 2s expo.out
//   open    yaw → 0 and the camera dollies to (0, 0, 35) over 1.25s

export interface Vec2 {
  x: number;
  y: number;
}

export interface Cam {
  y: number;
  z: number;
}

export interface CardSize {
  /** Box width (Three.js X). */
  bw: number;
  /** Box height (Three.js Y). */
  bh: number;
  /** Mesh offset so every card shares a right edge at local x = 0.75. */
  ax: number;
}

export interface Pose {
  /** World anchor, before the group scale. */
  x: number;
  z: number;
  /** Yaw in radians. */
  ry: number;
  wx: number;
  wy: number;
  ax: number;
  bw: number;
  bh: number;
  /** Parent group scale (1 at rest, 0.825 while a drag is held). */
  scale: number;
}

export const STACK = {
  fov: 5,
  camY: 100 / 7.5,
  camZPortrait: 55,
  camZLandscape: 35,
  openCamZNarrow: 35,
  openCamZWide: 30,
  yaw: -Math.PI / 6,
  gap: 0.375,
  depthPortrait: 6,
  depthLandscape: 1.5,
  visibleZ: 12.5,
  pxPerCard: 50,
  /** Share of the remaining error closed each 60fps frame. */
  follow: 0.1,
  popX: 0.325,
  popY: -0.1,
  restX: -0.325,
  dragScale: 0.825,
  dragScaleDelay: 150,
  dragScaleMs: 750,
  popMs: 500,
  introFrom: -20,
  introMs: 2000,
  openMs: 1250,
  openMoveMs: (1250 * 2) / 3,
} as const;

const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i]);
const mul = (a: number[], s: number) => a.map((v) => v * s);
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a: number[], b: number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: number[]) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return mul(a, 1 / l);
};

/** GSAP Expo.easeOut. */
export const expoOut = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** GSAP Expo.easeInOut. */
export const expoInOut = (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;
};

/** Box size from image height / width, matching the reference mesh. */
export function cardSize(heightOverWidth: number): CardSize {
  const be = heightOverWidth > 0 ? heightOverWidth : 1.5;
  const fe = 1 - (be - 1) * 0.5;
  const bw = 1.5 * fe;
  const bh = 1.5 * be * fe;
  return { bw, bh, ax: -(bw - 1.5) / 2 };
}

export function restCamera(viewportW: number, viewportH: number): Cam {
  return {
    y: STACK.camY,
    z: viewportH >= viewportW ? STACK.camZPortrait : STACK.camZLandscape,
  };
}

/** World Z of a card `fe` steps from the camera centre. */
export function depthFor(x: number, viewportW: number, viewportH: number): number {
  if (viewportH >= viewportW) return -x * STACK.depthPortrait;
  const aspect = viewportW / Math.max(1, viewportH);
  return -x * aspect * STACK.depthLandscape;
}

/**
 * Project the card's image corners into stage pixels (origin top-left).
 * Order: top-left, top-right, bottom-right, bottom-left of the image.
 */
export function projectCorners(pose: Pose, cam: Cam, viewportW: number, viewportH: number): Vec2[] {
  const eye = [0, cam.y, cam.z];
  const back = norm(sub(eye, [0, 0, 0]));
  const right = norm(cross([0, 1, 0], back));
  const up = cross(back, right);
  const f = 1 / Math.tan((STACK.fov * Math.PI) / 360);
  const aspect = viewportW / Math.max(1, viewportH);
  const c = Math.cos(pose.ry);
  const s = Math.sin(pose.ry);
  const hw = pose.bw / 2;
  const hh = pose.bh / 2;
  // Image top is +Y in Three.js.
  const local: Array<[number, number]> = [
    [-hw, hh],
    [hw, hh],
    [hw, -hh],
    [-hw, -hh],
  ];
  return local.map(([lx, ly]) => {
    const px = lx + pose.ax + pose.wx;
    const py = ly + pose.wy;
    const rx = c * px;
    const ry = py;
    const rz = -s * px;
    const wx = (rx + pose.x) * pose.scale;
    const wy = ry * pose.scale;
    const wz = (rz + pose.z) * pose.scale;
    const d = [wx - eye[0], wy - eye[1], wz - eye[2]];
    const vx = dot(d, right);
    const vy = dot(d, up);
    const vz = dot(d, back);
    const ndcX = ((f / aspect) * vx) / -vz;
    const ndcY = (f * vy) / -vz;
    return {
      x: (ndcX * 0.5 + 0.5) * viewportW,
      y: (1 - (ndcY * 0.5 + 0.5)) * viewportH,
    };
  });
}

function solve8(A: number[][], b: number[]): number[] {
  const n = 8;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    }
    [M[col], M[piv]] = [M[piv], M[col]];
    const div = M[col][col] || 1e-12;
    for (let c = col; c <= n; c++) M[col][c] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}

/** CSS matrix3d that maps the element's border box onto the projected quad. */
export function quadMatrix(layoutW: number, layoutH: number, to: Vec2[]): string {
  const from: Vec2[] = [
    { x: 0, y: 0 },
    { x: layoutW, y: 0 },
    { x: layoutW, y: layoutH },
    { x: 0, y: layoutH },
  ];
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i];
    const u = to[i].x;
    const v = to[i].y;
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = solve8(A, b);
  const H = [...h, 1];
  const m = [H[0], H[3], 0, H[6], H[1], H[4], 0, H[7], 0, 0, 1, 0, H[2], H[5], 0, H[8]];
  return `matrix3d(${m.map((n) => (Math.abs(n) < 1e-8 ? "0" : n.toFixed(5))).join(",")})`;
}

/** Layout size (CSS px) so a front card's border radius stays about 14px. */
export function layoutSize(size: CardSize, cam: Cam, viewportW: number, viewportH: number): { w: number; h: number } {
  const corners = projectCorners(
    {
      x: 0,
      z: 0,
      ry: STACK.yaw,
      wx: STACK.popX,
      wy: STACK.popY,
      ax: size.ax,
      bw: size.bw,
      bh: size.bh,
      scale: 1,
    },
    cam,
    viewportW,
    viewportH,
  );
  const w = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const h = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
  return { w: Math.max(40, w), h: Math.max(40, h) };
}

export interface Tween {
  from: number;
  to: number;
  start: number;
  dur: number;
}

export function sampleTween(tw: Tween, now: number, ease: (t: number) => number = expoOut): number {
  const t = tw.dur <= 0 ? 1 : Math.min(1, Math.max(0, (now - tw.start) / tw.dur));
  return tw.from + (tw.to - tw.from) * ease(t);
}

export function tweenDone(tw: Tween, now: number): boolean {
  return now - tw.start >= tw.dur;
}
