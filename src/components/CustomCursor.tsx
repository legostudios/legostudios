import { useEffect, useRef } from "react";

// A small arrow pointer that flashes through the brand colours (with a black
// outline so it shows on any background). It tracks the mouse exactly — no
// easing — so it feels like the system cursor, and grows slightly over
// anything clickable.
//
// Only runs on large, fine-pointer (mouse) screens; phones and tablets keep
// their native behaviour. Text fields keep the native I-beam.

const HOVER = 'a, button, [role="button"], label, select, summary, [data-cursor-hover]';
const TEXT = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const arrow = el.firstElementChild as HTMLElement;
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const root = document.documentElement;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const t = e.target as Element | null;
      const overText = !!t?.closest?.(TEXT);
      el.style.opacity = overText ? "0" : "1";
      arrow.style.transform = !overText && t?.closest?.(HOVER) ? "scale(1.3)" : "scale(1)";
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
      <svg className="invert-cursor-arrow" width="15" height="20" viewBox="0 0 22 30">
        {/* Classic arrow; the tip at (1,1) is the hotspot. Filled with the
            current brand colour, outlined in black so it shows on any
            background. */}
        <path
          d="M1 1 L1 23.5 L6.6 18.3 L10.4 27.4 L14.3 25.8 L10.5 16.9 L18 16.9 Z"
          fill="currentColor"
          stroke="#000000"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
