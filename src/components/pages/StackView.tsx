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
// Hovering a panel slides it out of the stack and shows its title.
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
    const cardW = tall ? W * 0.58 : Math.min(W * 0.25, H * 0.42);
    // Step between panels along the diagonal, and where panel 0 sits.
    const sx = tall ? W * 0.085 : W * 0.06;
    const sy = tall ? H * 0.06 : H * 0.075;
    const sz = 70;
    const x0 = tall ? W * 0.36 : W * 0.22;
    const y0 = tall ? H * 0.72 : H * 0.7;
    el.style.setProperty("--card-w", `${cardW}px`);
    cards.current.forEach((card, k) => {
      const p = k - pos.current;
      const x = x0 + p * sx;
      const y = y0 - p * sy;
      const z = -p * sz;
      // Fade panels flying past the camera, and the far end of the line.
      const op = p < 0 ? clamp(1 + (p + 0.35) * 1.6, 0, 1) : clamp((BEHIND - 1.5 - p) / 2.5, 0, 1);
      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) translate(-50%, -50%) rotateY(32deg)`;
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
              </button>
              <div className="stack-label" aria-hidden="true">
                <span className="stack-label-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="stack-label-title">{item.title}</span>
                {item.meta && <span className="stack-label-meta">{item.meta}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
