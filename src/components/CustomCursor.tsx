import { useEffect, useRef } from "react";
import { toRects } from "../lib/pixels";

// Pixel-art arrow (7×10, shown at 2× = 14×20px) in the same style as the menu
// square and contact icon. The top-left pixel is the hotspot.
const ARROW = [
  "#......",
  "##.....",
  "#w#....",
  "#wf#...",
  "#fff#..",
  "#ffff#.",
  "#ff####",
  "#f#f#..",
  "##.#f#.",
  "....##.",
];
const ARROW_COLS = ARROW[0].length;
const ARROW_RECTS = toRects(ARROW);

// Pixel-art pointing hand (12×13 at 2×), shown over things marked
// data-cursor="hand" (e.g. case study panels) to say "this opens". The tip of
// the index finger (column 3–4, top row) is the hotspot.
const HAND = [
  "...##.......",
  "..#wf#......",
  "..#wf#......",
  "..#ff#......",
  "..#ff###....",
  "..#ff#ff###.",
  "###ff#ff#ff#",
  "#f#ffffffff#",
  "#ffffffffff#",
  ".#fffffffff#",
  ".#ffffffff#.",
  "..#fffffff#.",
  "..#########.",
];
const HAND_COLS = HAND[0].length;
const HAND_RECTS = toRects(HAND);
const HAND_SELECTOR = '[data-cursor="hand"]';

// A small pixel-art arrow pointer (a pointing hand over clickable panels) that flashes through the brand colours (with
// a black pixel outline so it shows on any background). It tracks the mouse exactly — no
// easing — so it feels like the system cursor, and stays the same size
// everywhere, including over links and buttons.
//
// Only runs on large, fine-pointer (mouse) screens; phones and tablets keep
// their native behaviour. Text fields keep the native I-beam.

const TEXT = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const root = document.documentElement;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const t = e.target as Element | null;
      const overText = !!t?.closest?.(TEXT);
      el.style.opacity = overText ? "0" : "1";
      el.classList.toggle("is-hand", !overText && !!t?.closest?.(HAND_SELECTOR));
    };
    const onLeave = () => (el.style.opacity = "0");

    const apply = () => {
      if (mq.matches) {
        root.classList.add("cursor-none");
        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerleave", onLeave);
      } else {
        root.classList.remove("cursor-none");
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onLeave);
        el.style.opacity = "0";
      }
    };

    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      root.classList.remove("cursor-none");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="invert-cursor" aria-hidden="true">
      <svg
        className="invert-cursor-arrow"
        width={ARROW_COLS * 2}
        height={ARROW.length * 2}
        viewBox={`0 0 ${ARROW_COLS} ${ARROW.length}`}
        shapeRendering="crispEdges"
      >
        {ARROW_RECTS.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
        ))}
      </svg>
      <svg
        className="invert-cursor-hand"
        width={HAND_COLS * 2}
        height={HAND.length * 2}
        viewBox={`0 0 ${HAND_COLS} ${HAND.length}`}
        shapeRendering="crispEdges"
      >
        {HAND_RECTS.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
        ))}
      </svg>
    </div>
  );
}
