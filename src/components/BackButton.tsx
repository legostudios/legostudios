import { useRef, useState } from "react";
import { BackIcon } from "./BackIcon";

// How many times the button runs away before it lets itself be caught.
const DODGES = 2;

// Where it steps to (from its home spot, in px): just beside itself. The
// button lives top-right, so first to its left, then just below.
const HOPS = [
  { x: -52, y: 0 },
  { x: 0, y: 46 },
];
// After the second dodge it slides back home and stays there to be clicked.
const RETURN_MS = 650;

const canDodge = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// The pixel Back arrow. On desktop it playfully steps aside from the mouse
// twice, then slides back to its normal place and stays put to be clicked. Touch screens and
// keyboard users get a normal button. It resets every time its page opens
// (the page unmounts it when closed).
export function BackButton({ onClick, className }: { onClick: () => void; className: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const dodges = useRef(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || dodges.current >= DODGES || !canDodge()) return;
    const el = ref.current;
    if (!el) return;
    const hop = HOPS[dodges.current];
    dodges.current += 1;

    // Home position = current box minus the current offset.
    const r = el.getBoundingClientRect();
    const homeX = r.left - offset.x;
    const homeY = r.top - offset.y;
    // Stay fully on screen.
    const m = 8;
    const x = Math.min(Math.max(hop.x, m - homeX), window.innerWidth - m - r.width - homeX);
    const y = Math.min(Math.max(hop.y, m - homeY), window.innerHeight - m - r.height - homeY);
    setOffset({ x, y });
    if (dodges.current >= DODGES) window.setTimeout(() => setOffset({ x: 0, y: 0 }), RETURN_MS);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      className={`${className} back-runaway`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      aria-label="Back"
      title="Back"
    >
      <BackIcon />
    </button>
  );
}
