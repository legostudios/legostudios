import { useEffect, useRef, useState } from "react";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const TEXT = "A Creative Marketing House";

// A big, centered headline that is invisible on the white page and only reveals
// (in black) inside a spotlight that follows the mouse. Laptop-only: it needs a
// real pointer, so it never renders on phones/tablets.
export function CenterReveal() {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  // Only on large, fine-pointer screens.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Move the gradient centre to the cursor (in coords relative to the text box).
  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      const el = spanRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
    >
      <span
        ref={spanRef}
        className="px-6 text-center font-normal leading-[1.05] tracking-[-0.01em]"
        style={{
          fontFamily: HELV,
          fontSize: "clamp(2.5rem, 6vw, 6rem)",
          // The text is filled by a spotlight gradient — white near the cursor,
          // transparent (invisible) everywhere else. Starts off-screen. The
          // white fill is blended with `difference`, so it reads black on the
          // page and auto-inverts to light where it crosses the computer.
          backgroundImage:
            "radial-gradient(circle 150px at var(--mx, -9999px) var(--my, -9999px), #fff 0%, #fff 55%, transparent 72%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          mixBlendMode: "difference",
        }}
      >
        {TEXT}
      </span>
    </div>
  );
}
