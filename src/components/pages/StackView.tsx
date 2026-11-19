import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

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
  const [base, setBase] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  // Name of the hovered panel, shown beside the mouse pointer.
  const cursorLabel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; t: number; startTarget: number; moved: boolean; id: number } | null>(null);
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
    const tall = H > W * 1.1;
    // Panels are about half the screen tall; the line runs from off the
    // bottom-left corner to off the top-right one (as in the reference).
    const cardH = tall ? H * 0.42 : H * 0.56;
    const cardW = cardH * 0.78;
    const sx = tall ? W * 0.15 : W * 0.085;
    const sy = tall ? H * 0.085 : H * 0.1;
    const sz = 40;
    const x0 = tall ? W * 0.3 : W * 0.2;
    const y0 = tall ? H * 0.82 : H * 0.8;
    el.style.setProperty("--card-w", `${cardW}px`);
    el.style.setProperty("--card-h", `${cardH}px`);
    cards.current.forEach((card, k) => {
      const p = k - pos.current;
      const x = x0 + p * sx;
      const y = y0 - p * sy;
      const z = -p * sz;
      // Fade panels flying past the camera, and the far end of the line.
      // Panels leave off the screen edges; fade only the very last ones.
      const op = p < 0 ? clamp(1 + (p + 2.2) * 1.2, 0, 1) : clamp((BEHIND - 0.5 - p) / 2, 0, 1);
      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) translate(-50%, -50%) rotateY(48deg)`;
      card.style.opacity = String(op);
      card.style.pointerEvents = op > 0.5 ? "auto" : "none";
    });
  }, []);

  // Animation loop: ease toward the target, coast after a fling, and settle
  // on the nearest panel once input stops.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      if (!drag.current) {
        if (Math.abs(velocity.current) > 0.0005) {
          target.current += velocity.current;
          velocity.current *= 0.92;
        } else if (now - lastInput.current > 220) {
          target.current += (Math.round(target.current) - target.current) * 0.12;
        }
      }
      const d = target.current - pos.current;
      pos.current = reduced ? target.current : pos.current + d * 0.1;
      const b = Math.floor(pos.current);
      setBase((prev) => (prev === b ? prev : b));
      layout();
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
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), startTarget: target.current, moved: false, id: e.pointerId };
    velocity.current = 0;
  };
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const lab = cursorLabel.current;
    const st = stage.current;
    if (lab && st) {
      const r = st.getBoundingClientRect();
      lab.style.transform = `translate3d(${e.clientX - r.left + 18}px, ${e.clientY - r.top + 14}px, 0)`;
    }
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
    const prev = target.current;
    target.current = d.startTarget + (-dx + dy) / 220;
    const now = performance.now();
    velocity.current = ((target.current - prev) / Math.max(1, now - d.t)) * 16;
    d.t = now;
    lastInput.current = now;
  };
  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved) {
      dragEndedAt.current = performance.now();
      velocity.current = clamp(velocity.current, -0.6, 0.6);
    }
  };

  const slots: number[] = [];
  for (let k = base - IN_FRONT; k <= base + BEHIND; k++) slots.push(k);

  return (
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
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
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
              onPointerEnter={() => !drag.current?.moved && setHovered(k)}
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
      <div
        ref={cursorLabel}
        className={`stack-cursor-label ${hovered !== null ? "is-visible" : ""}`}
        aria-hidden="true"
      >
        {hovered !== null && (
          <>
            <span className="stack-cursor-title">{items[itemAt(hovered)].title}</span>
            {items[itemAt(hovered)].meta && <span className="stack-cursor-meta">{items[itemAt(hovered)].meta}</span>}
          </>
        )}
      </div>
    </div>
  );
}
