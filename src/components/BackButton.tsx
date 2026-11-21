import { useRef, useState } from "react";
import { BackIcon } from "./BackIcon";

// How many times the button runs away before it lets itself be caught.
const DODGES = 2;

// Where it hops to (from its home spot, in px), with a little randomness
// added each time. The button lives top-right, so it hops left and down.
const HOPS = [
  { x: -150, y: 80 },
  { x: -40, y: 190 },
];

const canDodge = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// The pixel Back arrow. On desktop it playfully runs away from the mouse
// twice; the third time it stays put and can be clicked. Touch screens and
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
    const jitter = () => (Math.random() - 0.5) * 60;
    let x = hop.x + jitter();
    let y = hop.y + jitter();
    // Stay fully on screen.
    const m = 12;
    x = Math.min(Math.max(x, m - homeX), window.innerWidth - m - r.width - homeX);
    y = Math.min(Math.max(y, m - homeY), window.innerHeight - m - r.height - homeY);
    setOffset({ x, y });
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
