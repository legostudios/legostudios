import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import {
  STACK,
  cardSize,
  depthFor,
  expoInOut,
  expoOut,
  layoutSize,
  projectCorners,
  quadMatrix,
  restCamera,
  sampleTween,
  tweenDone,
  type Cam,
  type Pose,
  type Tween,
} from "../../lib/mobileStack";
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

// Phones (≤768px) use the measured unveil.fr camera (see mobileStack.ts).
// Desktop keeps the CSS 3D stack below and must not take this path.
const FLAT_QUERY = "(max-width: 768px)";
const phoneNow = () => typeof window !== "undefined" && window.matchMedia(FLAT_QUERY).matches;


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
  // Phones: the measured 3D cascade (see mobileStack.ts).
  const flat = useRef(phoneNow());
  const [isFlat, setIsFlat] = useState(phoneNow);
  // Real proportions (height / width) of each image, once loaded.
  const ratios = useRef(new Map<string, number>());
  // Phone scroll: target drag in pixels (Δx − Δy) and the smoothed value.
  const dragPx = useRef(0);
  const smoothPx = useRef(0);
  const introStart = useRef(performance.now());
  const scaleTw = useRef<Tween>({ from: 1, to: 1, start: 0, dur: 0 });
  const pops = useRef(new Map<number, Tween>());
  const poses = useRef(new Map<number, Pose & { layoutW: number; layoutH: number }>());
  const dragScaleTimer = useRef(0);
  // The card currently flying open, hidden in the stack so it isn't drawn twice.
  const hiddenKey = useRef<number | null>(null);
  // Phone slot window follows the intro offset as well as the scroll position.
  const viewIndex = useRef<number>(STACK.introFrom);
  const [base, setBase] = useState(() => (phoneNow() ? Math.floor(STACK.introFrom) : 0));
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

  // Lay out every panel for the current position.
  const layout = useCallback(() => {
    const el = stage.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const nextFlat = window.matchMedia(FLAT_QUERY).matches;
    if (nextFlat !== flat.current) setIsFlat(nextFlat);
    flat.current = nextFlat;
    el.classList.toggle("stack-stage--flat", nextFlat);
    if (nextFlat) {
      const now = performance.now();
      const cam = restCamera(W, H);
      const introT = reduced ? 1 : Math.min(1, (now - introStart.current) / STACK.introMs);
      const intro = STACK.introFrom * (1 - expoOut(introT));
      const J = pos.current + intro;
      const scale = reduced ? 1 : sampleTween(scaleTw.current, now);
      // Depths first, so the card nearest the camera can pop forward.
      const placed: { k: number; x: number; z: number }[] = [];
      cards.current.forEach((_card, k) => {
        const x = (k - J) * STACK.gap;
        placed.push({ k, x, z: depthFor(x, W, H) });
      });
      let frontK: number | null = null;
      let frontAbs = Infinity;
      for (const p of placed) {
        const az = Math.abs(p.z);
        if (az < STACK.visibleZ && az < frontAbs) {
          frontAbs = az;
          frontK = p.k;
        }
      }
      if (pops.current.size > 48) {
        for (const key of pops.current.keys()) {
          if (Math.abs(key - J) > 24) pops.current.delete(key);
        }
      }
      const byKey = new Map(placed.map((p) => [p.k, p]));
      cards.current.forEach((card, k) => {
        const spot = byKey.get(k);
        if (!spot) return;
        const ratio = ratios.current.get(items[itemAt(k)].image) ?? 1.5;
        const size = cardSize(ratio);
        const lay = layoutSize(size, cam, W, H);
        const sizeKey = `${Math.round(lay.w)}x${Math.round(lay.h)}`;
        if (card.dataset.size !== sizeKey) {
          card.dataset.size = sizeKey;
          card.style.width = `${lay.w}px`;
          card.style.height = `${lay.h}px`;
        }
        const goal = k === frontK ? 1 : 0;
        let pop = pops.current.get(k);
        if (!pop) pop = { from: goal, to: goal, start: now, dur: 0 };
        else if (pop.to !== goal) {
          pop = { from: sampleTween(pop, now), to: goal, start: now, dur: reduced ? 0 : STACK.popMs };
        }
        pops.current.set(k, pop);
        const popT = reduced ? goal : sampleTween(pop, now);
        const pose: Pose & { layoutW: number; layoutH: number } = {
          x: spot.x,
          z: spot.z,
          ry: STACK.yaw,
          wx: STACK.restX + (STACK.popX - STACK.restX) * popT,
          wy: STACK.popY * popT,
          ax: size.ax,
          bw: size.bw,
          bh: size.bh,
          scale,
          layoutW: lay.w,
          layoutH: lay.h,
        };
        poses.current.set(k, pose);
        const onStage = Math.abs(spot.z) < STACK.visibleZ && k !== hiddenKey.current;
        if (!onStage) {
          card.style.opacity = "0";
          card.style.pointerEvents = "none";
          return;
        }
        card.style.transform = quadMatrix(lay.w, lay.h, projectCorners(pose, cam, W, H));
        card.style.opacity = "1";
        // Larger world Z is closer to the camera (it sits at +Z).
        card.style.zIndex = String(5000 + Math.round(spot.z * 100));
        card.style.pointerEvents = "auto";
      });
      return;
    }
    const tall = H > W * 1.1;
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
      if (card.style.zIndex) card.style.zIndex = "";
      if (card.dataset.size) {
        delete card.dataset.size;
        card.style.width = "";
        card.style.height = "";
      }
      card.style.transform = `translate(-50%, -50%) translate3d(${jitter}px, 0, ${z}px)`;
      card.style.opacity = String(op);
      card.style.pointerEvents = op > 0.5 ? "auto" : "none";
    });
  }, [items, n, reduced]);

  // Animation loop: ease toward the target, coast after a fling, and settle
  // on the nearest panel once input stops.
  // All rates are per 60 fps frame and scaled by real elapsed time, so the
  // feel is the same on 60 Hz and 120 Hz screens. `velocity` is in panels
  // per 60 fps frame.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let settled = false;
    let lastPos = NaN;
    const tick = () => {
      const now = performance.now();
      const f = Math.min(4, (now - last) / (1000 / 60));
      last = now;
      if (flat.current) {
        // One smoothing stage, the same 10% per 60fps frame as the reference.
        // Position is cards, and one card is 50px of (Δx − Δy).
        const follow = reduced ? 1 : 1 - Math.pow(1 - STACK.follow, f);
        smoothPx.current += (dragPx.current - smoothPx.current) * follow;
        pos.current = -smoothPx.current / STACK.pxPerCard;
        target.current = pos.current;
        velocity.current = 0;
        const introT = reduced ? 1 : Math.min(1, (now - introStart.current) / STACK.introMs);
        viewIndex.current = pos.current + STACK.introFrom * (1 - expoOut(introT));
      } else if (!drag.current) {
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
      if (!flat.current) {
        pos.current = reduced ? target.current : pos.current + d * (1 - Math.pow(1 - easing, f));
      }
      // Skip layout work once everything has come to rest.
      const phoneBusy =
        Math.abs(dragPx.current - smoothPx.current) > 0.4 ||
        !!drag.current ||
        (!reduced && now - introStart.current < STACK.introMs) ||
        !tweenDone(scaleTw.current, now) ||
        [...pops.current.values()].some((tw) => !tweenDone(tw, now));
      const still = flat.current
        ? !phoneBusy && pos.current === lastPos
        : Math.abs(d) < 0.002 && Math.abs(Math.round(target.current) - target.current) < 0.002 && velocity.current === 0 && !drag.current;
      lastPos = pos.current;
      if (still && !flat.current) {
        // Snap exactly onto the panel so the resting frame is crisp.
        target.current = Math.round(target.current);
        pos.current = target.current;
      }
      if (!still || !settled) {
        const b = Math.floor(flat.current ? viewIndex.current : pos.current);
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
      if (flat.current) dragPx.current += delta;
      else target.current += clamp(delta, -120, 120) / 380;
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
      if (flat.current) {
        // Forward (down / right) brings the next card in from the bottom-left.
        if (e.key === "ArrowDown" || e.key === "ArrowRight") dragPx.current += STACK.pxPerCard;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") dragPx.current -= STACK.pxPerCard;
        else return;
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") target.current = Math.round(target.current) + 1;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") target.current = Math.round(target.current) - 1;
      else return;
      e.preventDefault();
      velocity.current = 0;
      lastInput.current = performance.now();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Phones: the tapped card yaws flat, the camera dollies in (as on the
  // reference, 1.25s), then the quad eases onto the study's main image.
  const flyOpen = (key: number, image: string) => {
    const pose0 = poses.current.get(key);
    const stageEl = stage.current;
    if (!pose0 || !stageEl) return;
    const origin = stageEl.getBoundingClientRect();
    const viewW = stageEl.clientWidth;
    const viewH = stageEl.clientHeight;
    const cam0 = restCamera(viewW, viewH);
    const cam1: Cam = { y: 0, z: viewW < 640 ? STACK.openCamZNarrow : STACK.openCamZWide };
    const fly = document.createElement("div");
    fly.className = "stack-fly-card";
    fly.style.width = `${pose0.layoutW}px`;
    fly.style.height = `${pose0.layoutH}px`;
    const img = document.createElement("img");
    img.src = image;
    img.alt = "";
    const glass = document.createElement("span");
    glass.className = "stack-glass";
    fly.append(img, glass);
    document.body.appendChild(fly);
    hiddenKey.current = key;
    const t0 = performance.now();
    let dest: DOMRect | null = null;
    let opened = false;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / STACK.openMs);
      const moveT = Math.min(1, (now - t0) / STACK.openMoveMs);
      const pose: Pose = {
        x: pose0.x * (1 - expoOut(moveT)),
        z: pose0.z * (1 - expoOut(moveT)),
        ry: STACK.yaw * (1 - expoInOut(t)),
        wx: 0,
        wy: 0,
        ax: pose0.ax * (1 - expoOut(moveT)),
        bw: pose0.bw,
        bh: pose0.bh,
        scale: 1,
      };
      const cam: Cam = {
        y: cam0.y + (cam1.y - cam0.y) * expoInOut(t),
        z: cam0.z + (cam1.z - cam0.z) * expoInOut(t),
      };
      let corners = projectCorners(pose, cam, viewW, viewH).map((p) => ({
        x: p.x + origin.left,
        y: p.y + origin.top,
      }));
      if (!dest) {
        const el = document.querySelector<HTMLElement>(".page--detail .cs-image");
        if (el) dest = el.getBoundingClientRect();
      }
      // Once the card is facing the camera, carry it onto the study photo.
      if (dest && t > 0.55) {
        const u = expoOut((t - 0.55) / 0.45);
        const onto = [
          { x: dest.left, y: dest.top },
          { x: dest.right, y: dest.top },
          { x: dest.right, y: dest.bottom },
          { x: dest.left, y: dest.bottom },
        ];
        corners = corners.map((p, i) => ({
          x: p.x + (onto[i].x - p.x) * u,
          y: p.y + (onto[i].y - p.y) * u,
        }));
      }
      fly.style.transform = quadMatrix(pose0.layoutW, pose0.layoutH, corners);
      fly.style.opacity = t > 0.92 ? String(Math.max(0, 1 - (t - 0.92) / 0.08)) : "1";
      // Let the card start yawing on the pink stack, then open the study
      // underneath so the quad can land on its photo.
      if (!opened && now - t0 > 420) {
        opened = true;
        onOpen?.(itemAt(key));
      }
      if (t < 1) requestAnimationFrame(step);
      else {
        fly.remove();
        hiddenKey.current = null;
        if (!opened) onOpen?.(itemAt(key));
      }
    };
    requestAnimationFrame(step);
  };

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
    if (!flat.current) {
      target.current = pos.current;
      drag.current.startTarget = pos.current;
      drag.current.last = pos.current;
    }
    window.clearTimeout(dragScaleTimer.current);
    if (flat.current && !reduced) {
      dragScaleTimer.current = window.setTimeout(() => {
        if (!drag.current) return;
        const now = performance.now();
        scaleTw.current = {
          from: sampleTween(scaleTw.current, now),
          to: STACK.dragScale,
          start: now,
          dur: STACK.dragScaleMs,
        };
      }, STACK.dragScaleDelay);
    }
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
    if (flat.current) {
      // Same mapping as the reference: Δx − Δy, one card per 50px.
      dragPx.current += e.clientX - d.x - (e.clientY - d.y);
      d.x = e.clientX;
      d.y = e.clientY;
      d.t = performance.now();
      lastInput.current = d.t;
      return;
    }
    // Mouse: drag along the diagonal. Touch: swipe up (or left) to go
    // forward, like scrolling a page.
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
    window.clearTimeout(dragScaleTimer.current);
    if (flat.current) {
      const now = performance.now();
      const cur = sampleTween(scaleTw.current, now);
      if (cur !== 1) scaleTw.current = { from: cur, to: 1, start: now, dur: reduced ? 0 : STACK.dragScaleMs };
    }
    if (d.moved) {
      dragEndedAt.current = performance.now();
      if (!flat.current) {
        // A pause before lifting the finger means no fling.
        if (performance.now() - d.t > 80) velocity.current = 0;
        const vMax = d.touch ? 0.5 : 0.6;
        velocity.current = clamp(velocity.current, -vMax, vMax);
        touchFling.current = d.touch;
      }
    } else {
      velocity.current = 0;
    }
  };

  // Phones need cards both in front of and behind the camera centre
  // (|z| < 12.5 is about ±6 steps). Desktop keeps its own window.
  const inFront = isFlat ? 8 : IN_FRONT;
  const behind = isFlat ? 8 : BEHIND;
  const slots: number[] = [];
  for (let k = base - inFront; k <= base + behind; k++) slots.push(k);

  return (
    <>
    <div
      ref={stage}
      className={`stack-stage${isFlat ? " stack-stage--flat" : ""}`}
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
                // Stop any glide so nothing moves while the card opens.
                velocity.current = 0;
                if (!flat.current) target.current = pos.current;
                if (flat.current && !reduced && onOpen) flyOpen(k, item.image);
                else onOpen?.(i);
              }}
            >
              <button
                type="button"
                className="stack-card-inner"
                aria-label={item.title}
                tabIndex={-1}
              >
                <img
                  src={item.image}
                  alt=""
                  draggable={false}
                  onLoad={(e) => {
                    // Phones size each card to its image's real proportions.
                    const im = e.currentTarget;
                    if (im.naturalWidth && !ratios.current.has(item.image)) {
                      ratios.current.set(item.image, im.naturalHeight / im.naturalWidth);
                      layout();
                    }
                  }}
                />
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
