import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { sentenceCase } from "../../lib/text";

export interface StackItem {
  title: string;
  /** Short line shown beside the title on hover (e.g. headline numbers). */
  meta?: string;
  image: string;
}

interface StackViewProps {
  items: StackItem[];
  /** Called when a panel is clicked (not dragged). */
  onOpen?: (index: number) => void;
}

// How many panels exist at once, around the current position.
const BEHIND = 13;
const IN_FRONT = 3;
// Moving less than this (px) counts as a click, not a drag.
const DRAG_THRESHOLD = 6;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
// Stable pseudo-random number in [0, 1) for a panel index (so each panel
// keeps its own size, proportion and tilt as it travels).
const hash = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ── Phone composition (tall screens) ──────────────────────────────────────
// A one-point-perspective collage: panels recede toward a vanishing point
// near the top-right corner and grow as they come forward, leaving at the
// bottom-left. Alternate panels sit either side of the path (a loose
// zig-zag), and each has its own size, proportion and slight tilt, so the
// composition reads as an editorial collage rather than a row of tiles.
// Every value is a share of the screen, so it adapts to any phone.
const M = {
  // Focal panel centre and vanishing point (shares of width / height). The
  // vanishing point sits beyond the top-right corner so the row climbs at a
  // steady diagonal and far panels stay readable.
  ax: 0.36,
  ay: 0.62,
  vx: 1.1,
  vy: 0.0,
  // Scale falls by this factor per panel of depth (perspective).
  depth: 1.14,
  // Base panel width (share of screen width), capped by screen height.
  w: 0.58,
  maxH: 0.33,
  // Zig-zag: sideways offset either side of the path (share of panel width).
  zig: 0.3,
  // Panels fade out at the far end and once they have flown past.
  farFade: [9, 11.5],
  nearFade: [-1.6, -2.4],
};
// Proportions (height / width) the panels cycle through.
const RATIOS = [1.3, 1.02, 1.42, 1.16, 0.9, 1.24];


// A 3D stack of image panels on a diagonal — the nearest at the bottom-left,
// receding to the top-right. Scroll, drag, swipe or use the arrow keys to
// travel along it (it loops endlessly); panels in front fly past the camera.
// Panels look like glass sheets (see-through, softly distorted, bright edge).
// Hovering one slides it out to the right; its name follows the pointer.
export function StackView({ items, onOpen }: StackViewProps) {
  const reduced = usePrefersReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<number, HTMLDivElement>());
  // Position along the stack (in panels): `pos` eases toward `target`.
  const pos = useRef(0);
  const target = useRef(0);
  const velocity = useRef(0);
  const lastInput = useRef(0);
  // Touch flings coast briefly and settle fast (as on the reference).
  const touchFling = useRef(false);
  const [base, setBase] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  // Name of the hovered panel, shown beside the mouse pointer.
  const cursorLabel = useRef<HTMLDivElement>(null);
  // The label trails the pointer: it eases toward `labelTarget` each frame.
  const labelTarget = useRef<{ x: number; y: number } | null>(null);
  const labelPos = useRef({ x: 0, y: 0 });
  const drag = useRef<{
    x: number;
    y: number;
    t: number;
    startTarget: number;
    moved: boolean;
    id: number;
    touch: boolean;
    last: number;
  } | null>(null);
  // When the last drag ended; a click right after a drag is not a click.
  const dragEndedAt = useRef(0);
  const n = items.length;
  const itemAt = (k: number) => ((k % n) + n) % n;

  // Phones: place each panel directly on screen (transforms only, no layout
  // work per frame). See M above for the composition.
  const layoutPhone = useCallback((W: number, H: number) => {
    const baseW = Math.min(W * M.w, H * M.maxH);
    const ax = W * M.ax;
    const ay = H * M.ay;
    const vx = W * M.vx;
    const vy = H * M.vy;
    // Unit vector across the path (for the zig-zag), pointing down-right.
    const len = Math.hypot(vx - ax, vy - ay);
    const nx = -(vy - ay) / len;
    const ny = (vx - ax) / len;
    cards.current.forEach((card, k) => {
      const p = k - pos.current;
      const r1 = hash(k);
      const r2 = hash(k + 57);
      const r3 = hash(k + 131);
      // Own size and proportion, set once per panel (not every frame).
      const w = Math.round(baseW * lerp(0.84, 1.1, r1));
      const h = Math.round(w * RATIOS[((k % RATIOS.length) + RATIOS.length) % RATIOS.length]);
      const size = `${w}x${h}`;
      if (card.dataset.size !== size) {
        card.dataset.size = size;
        card.style.width = `${w}px`;
        card.style.height = `${h}px`;
      }
      // Perspective: scale shrinks with depth; position converges on the
      // vanishing point by the same factor.
      // In front of the focal panel they grow faster, so they sweep off the
      // bottom-left instead of lingering over the composition.
      const s = p >= 0 ? Math.pow(M.depth, -p) : 1 - p * 0.42;
      const side = k % 2 === 0 ? -1 : 1;
      const zig = side * baseW * M.zig * lerp(0.75, 1.15, r2) * s;
      const x = vx + (ax - vx) * s + nx * zig;
      const y = vy + (ay - vy) * s + ny * zig;
      // Tilt: turned a little away (left edge nearer) and gently rolled;
      // panels straighten up as they come to the front — a soft pop-out.
      const t = smooth(clamp((p + 1.5) / 6, 0, 1));
      const ry = lerp(-9, -30, t) + (r3 - 0.5) * 8;
      const rz = (r2 - 0.5) * 5 + side * lerp(0.5, 1.5, t);
      const op =
        p > M.farFade[0]
          ? clamp(1 - (p - M.farFade[0]) / (M.farFade[1] - M.farFade[0]), 0, 1)
          : p < M.nearFade[0]
            ? clamp(1 - (M.nearFade[0] - p) / (M.nearFade[0] - M.nearFade[1]), 0, 1)
            : 1;
      card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${s.toFixed(4)}) perspective(520px) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
      card.style.opacity = op.toFixed(3);
      card.style.zIndex = String(1000 - Math.round(p * 10));
      card.style.pointerEvents = op > 0.5 ? "auto" : "none";
    });
  }, []);

  // Lay out every panel for the current position.
  const layout = useCallback(() => {
    const el = stage.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const tall = H > W * 1.1;
    el.classList.toggle("stack-stage--path", tall);
    if (tall) {
      layoutPhone(W, H);
      return;
    }
    // Parallel glass sheets, one behind another, seen by a camera turned and
    // tilted (see .stack-world): the row climbs from the bottom-left to the
    // top-right and each sheet's long edges slope down to the right — solved
    // from measurements of the reference.
    // Phones (tall screens) use portrait sheets packed a little closer, as the
    // reference does on mobile.
    // Phones: smaller portrait sheets, each clearly separate, on a steeper
    // diagonal (measured from the reference's mobile layout); tunable via
    // --stack-m-* for testing.
    const cs = getComputedStyle(el);
    const v = (name: string, d: number) => Number(cs.getPropertyValue(name)) || d;
    const cardW = tall ? Math.min(W * v("--stack-m-w", 0.42), H * 0.24) : Math.min(W * 0.28, H * 0.58);
    const cardH = tall ? cardW * v("--stack-m-ratio", 1.45) : cardW / 1.5;
    // Depth between sheets, and which sheet sits at the centre of the screen.
    const gap = tall ? cardW * v("--stack-m-gap", 0.95) : cardW * 0.72;
    const mid = tall ? v("--stack-m-mid", 3) : 3;
    el.style.setProperty("--card-w", `${cardW}px`);
    el.style.setProperty("--card-h", `${cardH}px`);
    cards.current.forEach((card, k) => {
      const p = k - pos.current;
      const z = -(p - mid) * gap;
      // Sheets fly past the camera at the front and fade out at the far end.
      const op = p < 0 ? clamp(1 + (p + 1.4) * 1.4, 0, 1) : clamp((BEHIND - 0.5 - p) / 2, 0, 1);
      // Phones: a slight left/right zig-zag along the row (as in the
      // reference on mobile), fixed per panel.
      const jitter = tall ? Math.sin(k * 2.39) * cardW * v("--stack-m-jit", 0.25) : 0;
      // Coming back from the phone layout (window resized): drop its sizes.
      if (card.dataset.size) {
        delete card.dataset.size;
        card.style.width = "";
        card.style.height = "";
        card.style.zIndex = "";
      }
      card.style.transform = `translate(-50%, -50%) translate3d(${jitter}px, 0, ${z}px)`;
      card.style.opacity = String(op);
      card.style.pointerEvents = op > 0.5 ? "auto" : "none";
    });
  }, [layoutPhone]);

  // Animation loop: ease toward the target, coast after a fling, and settle
  // on the nearest panel once input stops.
  // All rates are per 60 fps frame and scaled by real elapsed time, so the
  // feel is the same on 60 Hz and 120 Hz screens. `velocity` is in panels
  // per 60 fps frame.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let settled = false;
    const tick = () => {
      const now = performance.now();
      const f = Math.min(4, (now - last) / (1000 / 60));
      last = now;
      if (!drag.current) {
        if (Math.abs(velocity.current) > 0.004) {
          target.current += velocity.current * f;
          velocity.current *= Math.pow(touchFling.current ? 0.74 : 0.94, f);
        } else if (now - lastInput.current > (touchFling.current ? 60 : 120)) {
          velocity.current = 0;
          target.current += (Math.round(target.current) - target.current) * (1 - Math.pow(1 - (touchFling.current ? 0.32 : 0.22), f));
        }
      }
      const d = target.current - pos.current;
      const easing = drag.current ? 0.35 : touchFling.current ? 0.34 : 0.17;
      pos.current = reduced ? target.current : pos.current + d * (1 - Math.pow(1 - easing, f));
      // Skip layout work once everything has come to rest.
      const still = Math.abs(d) < 0.002 && Math.abs(Math.round(target.current) - target.current) < 0.002 && velocity.current === 0 && !drag.current;
      if (still) {
        // Snap exactly onto the panel so the resting frame is crisp.
        target.current = Math.round(target.current);
        pos.current = target.current;
      }
      if (!still || !settled) {
        const b = Math.floor(pos.current);
        setBase((prev) => (prev === b ? prev : b));
        layout();
      }
      settled = still;
      const lab = cursorLabel.current;
      const lt = labelTarget.current;
      if (lab && lt) {
        const lp = labelPos.current;
        const k = reduced ? 1 : 1 - Math.pow(1 - 0.14, f);
        lp.x += (lt.x - lp.x) * k;
        lp.y += (lt.y - lp.y) * k;
        lab.style.transform = `translate3d(${lp.x}px, ${lp.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout, reduced]);

  // Phones: on open, the collage drifts forward out of the depth into place
  // (it starts a few panels further back and eases in).
  useEffect(() => {
    const el = stage.current;
    if (!el || reduced) return;
    if (el.clientHeight > el.clientWidth * 1.1) pos.current = target.current - 2.5;
  }, [reduced]);

  useEffect(() => {
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, [layout]);

  // Wheel / trackpad: needs a non-passive listener to keep the page still.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      target.current += clamp(delta, -120, 120) / 380;
      velocity.current = 0;
      lastInput.current = performance.now();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Arrow keys move one panel at a time.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") target.current = Math.round(target.current) + 1;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") target.current = Math.round(target.current) - 1;
      else return;
      e.preventDefault();
      velocity.current = 0;
      lastInput.current = performance.now();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Drag along the diagonal: toward the bottom-left pulls panels forward.
  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      startTarget: target.current,
      moved: false,
      id: e.pointerId,
      touch: e.pointerType !== "mouse",
      last: target.current,
    };
    // Touching stops a coasting stack in place, like a native scroller.
    velocity.current = 0;
    target.current = pos.current;
    drag.current.startTarget = pos.current;
    drag.current.last = pos.current;
  };
  // Aim the label just below-right of the pointer. The first time, jump
  // straight there rather than gliding in from the corner.
  const aimLabel = (clientX: number, clientY: number) => {
    const st = stage.current;
    if (!st) return;
    const r = st.getBoundingClientRect();
    const t = { x: clientX - r.left + 18, y: clientY - r.top + 14 };
    if (!labelTarget.current) {
      labelPos.current = { ...t };
      const lab = cursorLabel.current;
      if (lab) lab.style.transform = `translate3d(${t.x}px, ${t.y}px, 0)`;
    }
    labelTarget.current = t;
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") aimLabel(e.clientX, e.clientY);
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      stage.current?.setPointerCapture(e.pointerId);
      setHovered(null);
    }
    // Mouse: drag along the diagonal. Touch: swipe up (or left) to go
    // forward, like scrolling a page; about 100px of swipe per panel on a
    // phone (matched to the reference).
    const W = stage.current?.clientWidth ?? 390;
    const H = stage.current?.clientHeight ?? 844;
    target.current = d.touch
      ? d.startTarget + (-dy - dx * 0.6) / (Math.min(W, H) * 0.25)
      : d.startTarget + (-dx + dy) / 220;
    // Velocity: smoothed over recent moves (panels per 60 fps frame).
    const now = performance.now();
    const dt = Math.max(1, now - d.t);
    const inst = ((target.current - d.last) / dt) * (1000 / 60);
    velocity.current = velocity.current * 0.6 + inst * 0.4;
    d.t = now;
    d.last = target.current;
    lastInput.current = now;
  };
  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved) {
      dragEndedAt.current = performance.now();
      // A pause before lifting the finger means no fling.
      if (performance.now() - d.t > 80) velocity.current = 0;
      velocity.current = clamp(velocity.current, d.touch ? -0.5 : -0.6, d.touch ? 0.5 : 0.6);
      touchFling.current = d.touch;
    } else {
      velocity.current = 0;
    }
  };

  const slots: number[] = [];
  for (let k = base - IN_FRONT; k <= base + BEHIND; k++) slots.push(k);

  return (
    <>
    <div
      ref={stage}
      className="stack-stage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Glass distortion: a soft wavy displacement of each image. */}
      <svg className="stack-defs" aria-hidden="true" focusable="false">
        <filter id="stack-glass-distort" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="stack-world">
        {slots.map((k) => {
          const i = itemAt(k);
          const item = items[i];
          return (
            <div
              key={k}
              ref={(el) => {
                if (el) cards.current.set(k, el);
                else cards.current.delete(k);
              }}
              className={`stack-card ${hovered === k ? "is-hovered" : ""}`}
              data-key={k}
              // Clickable panels show the pointing-hand cursor.
              data-cursor={onOpen ? "hand" : undefined}
              onPointerEnter={(e) => {
                if (drag.current?.moved || e.pointerType !== "mouse") return;
                aimLabel(e.clientX, e.clientY);
                setHovered(k);
              }}
              onPointerLeave={() => setHovered((h) => (h === k ? null : h))}
              // The click target is the panel's whole (static) area, so a
              // panel that has slid out on hover is clickable everywhere.
              onClick={() => {
                if (performance.now() - dragEndedAt.current < 80) return;
                onOpen?.(i);
              }}
            >
              <button
                type="button"
                className="stack-card-inner"
                aria-label={item.title}
                tabIndex={-1}
              >
                <img src={item.image} alt="" draggable={false} />
                <span className="stack-glass" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
    {/* Outside the stage's layer so its difference blend inverts against the
        page colour as well as the panels. */}
    <div
      ref={cursorLabel}
      className={`stack-cursor-label ${hovered !== null && labelTarget.current ? "is-visible" : ""}`}
      aria-hidden="true"
    >
      {hovered !== null && (
        <>
          <span className="stack-cursor-title">{sentenceCase(items[itemAt(hovered)].title)}</span>
          {items[itemAt(hovered)].meta && (
            <span className="stack-cursor-meta">{sentenceCase(items[itemAt(hovered)].meta!)}</span>
          )}
        </>
      )}
    </div>
    </>
  );
}
