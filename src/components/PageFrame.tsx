import { useEffect, useLayoutEffect, useRef, useState } from "react";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SMOOTH = "cubic-bezier(0.22, 1, 0.36, 1)"; // gentle, premium deceleration
const EXPAND = 700; // column expansion + name glide duration

const LOGO_GAP = 18;
const CLOCK_GAP = 16;

type Target = "services" | "caseStudies" | "contact";

const ITEMS: { label: string; target: Target | null }[] = [
  { label: "Services", target: "services" },
  { label: "Case Studies", target: "caseStudies" },
  { label: "Magazine", target: null },
  { label: "Contact", target: "contact" },
];

// A column heading. Collapsed, its words stack onto separate lines (clipped by
// the column). When the column is active the words glide onto a single line —
// the first word drops down while the rest slide right into place.
function ColumnName({ label, active }: { label: string; active: boolean }) {
  const words = label.split(" ");
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [stacked, setStacked] = useState<string[]>(() =>
    words.map(() => "translate(0, 0)"),
  );

  useLayoutEffect(() => {
    const measure = () => {
      const els = refs.current;
      const first = els[0];
      if (!first) return;
      const n = words.length;
      const lineHeight = first.offsetHeight;
      const left0 = first.offsetLeft;
      setStacked(
        words.map((_, i) => {
          const el = els[i];
          const dx = el ? -(el.offsetLeft - left0) : 0;
          const dy = -((n - 1 - i) * lineHeight);
          return `translate(${dx}px, ${dy}px)`;
        }),
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [label]);

  return (
    <span className="absolute bottom-6 left-0 w-full whitespace-nowrap pl-5 pr-2 text-[clamp(2.5rem,7vw,7rem)] font-bold leading-[0.9] tracking-[-0.02em] text-black">
      {words.map((word, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="inline-block"
          style={{
            transform: active ? "translate(0, 0)" : stacked[i],
            transition: `transform ${EXPAND}ms ${SMOOTH}`,
          }}
        >
          {i < words.length - 1 ? `${word} ` : word}
        </span>
      ))}
    </span>
  );
}

interface PageFrameProps {
  open: boolean;
  onNavigate: (t: Target) => void;
  onClose: () => void;
}

// The clock opens this menu: the content area (right of the vertical line, below
// the horizontal line) is split into four columns, each a bold name clipped at
// the bottom; hovering a column expands it to reveal the full name.
export function PageFrame({ open, onNavigate, onClose }: PageFrameProps) {
  const [geo, setGeo] = useState({ vx: 86, hy: 120 });
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setHovered(null);
      return;
    }
    const measure = () => {
      const logo = document.querySelector('img[alt="LEGO"]') as HTMLElement | null;
      const clock = document.querySelector('[aria-label="Menu"]') as HTMLElement | null;
      const lr = logo?.getBoundingClientRect();
      const cr = clock?.getBoundingClientRect();
      const vx = Math.round(cr ? cr.right + CLOCK_GAP : 84);
      const hy = Math.round(lr ? lr.bottom + LOGO_GAP : window.innerHeight * 0.14);
      setGeo({ vx, hy });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed z-[74] flex bg-white transition-opacity duration-300 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{
        left: geo.vx,
        top: geo.hy,
        right: 0,
        bottom: 0,
        transitionDelay: open ? "80ms" : "0ms",
        fontFamily: HELV,
      }}
    >
      {ITEMS.map((item, i) => (
        <button
          key={item.label}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => item.target && onNavigate(item.target)}
          style={{
            flexGrow: hovered === i ? 3 : 1,
            transition: `flex-grow ${EXPAND}ms ${SMOOTH}`,
            cursor: item.target ? undefined : "default",
          }}
          className="relative flex-1 basis-0 overflow-hidden border-r-2 border-black text-left outline-none last:border-r-0"
        >
          <ColumnName label={item.label} active={hovered === i} />
        </button>
      ))}
    </div>
  );
}
