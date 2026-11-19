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
  // The label trails the pointer: it eases toward `labelTarget` each frame.
  const labelTarget = useRef<{ x: number; y: number } | null>(null);
  const labelPos = useRef({ x: 0, y: 0 });
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
    // Parallel glass sheets, one behind another, seen by a camera turned and
    // tilted (see .stack-world): the row climbs from the bottom-left to the
    // top-right and each sheet's long edges slope down to the right — solved
    // from measurements of the reference.
    const cardW = tall ? W * 0.6 : Math.min(W * 0.28, H * 0.58);
    const cardH = cardW / 1.5;
    // Depth between sheets, and which sheet sits at the centre of the screen.
    const gap = cardW * 0.72;
    const mid = 3;
    el.style.setProperty("--card-w", `${cardW}px`);
    el.style.setProperty("--card-h", `${cardH}px`);
    cards.current.forEach((card, k) => {
      const p = k - pos.current;
      const z = -(p - mid) * gap;
      // Sheets fly past the camera at the front and fade out at the far end.
      const op = p < 0 ? clamp(1 + (p + 1.4) * 1.4, 0, 1) : clamp((BEHIND - 0.5 - p) / 2, 0, 1);
      card.style.transform = `translate(-50%, -50%) translate3d(0, 0, ${z}px)`;
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
      const lab = cursorLabel.current;
      const lt = labelTarget.current;
      if (lab && lt) {
        const lp = labelPos.current;
        const k = reduced ? 1 : 0.14;
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
    aimLabel(e.clientX, e.clientY);
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
              // Clickable panels show the pointing-hand cursor.
              data-cursor={onOpen ? "hand" : undefined}
              onPointerEnter={(e) => {
                if (drag.current?.moved) return;
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
