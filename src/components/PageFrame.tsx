import { useEffect, useRef, useState } from "react";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const DRAW = 1000; // frame draw duration
const OUT = 460; // retract duration

const LOGO_GAP = 18;
const CLOCK_GAP = 16;

type Target = "services" | "caseStudies" | "contact";

const ITEMS: { label: string; target: Target | null }[] = [
  { label: "Services", target: "services" },
  { label: "Case Studies", target: "caseStudies" },
  { label: "Magazine", target: null },
  { label: "Contact", target: "contact" },
];

interface PageFrameProps {
  open: boolean;
  onNavigate: (t: Target) => void;
  onClose: () => void;
}

// The clock opens this framed menu: a horizontal line under the logo meeting a
// vertical line right of the clock, with the content area split into four equal
// columns. Each column shows a bold name (clipped) at the bottom; hovering a
// column expands it to reveal the full name. The frame lines draw in on open.
export function PageFrame({ open, onNavigate, onClose }: PageFrameProps) {
  const hRef = useRef<SVGLineElement>(null);
  const vRef = useRef<SVGLineElement>(null);
  const [geo, setGeo] = useState({ vx: 86, hy: 120 });
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const h = hRef.current;
    const v = vRef.current;
    if (!h || !v) return;

    if (open) {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const logo = document.querySelector('img[alt="LEGO"]') as HTMLElement | null;
      const clock = document.querySelector('[aria-label="Menu"]') as HTMLElement | null;
      const lr = logo?.getBoundingClientRect();
      const cr = clock?.getBoundingClientRect();
      const vx = Math.round(cr ? cr.right + CLOCK_GAP : 84);
      const hy = Math.round(lr ? lr.bottom + LOGO_GAP : H * 0.14);
      setGeo({ vx, hy });

      h.setAttribute("x1", String(W));
      h.setAttribute("y1", String(hy));
      h.setAttribute("x2", String(vx));
      h.setAttribute("y2", String(hy));
      v.setAttribute("x1", String(vx));
      v.setAttribute("y1", String(H));
      v.setAttribute("x2", String(vx));
      v.setAttribute("y2", String(0));

      const hLen = W - vx;
      const vLen = H;
      h.style.strokeDasharray = String(hLen);
      v.style.strokeDasharray = String(vLen);
      h.style.transition = "none";
      v.style.transition = "none";
      h.style.strokeDashoffset = String(hLen);
      v.style.strokeDashoffset = String(vLen);
      void h.getBoundingClientRect();
      requestAnimationFrame(() => {
        h.style.transition = `stroke-dashoffset ${DRAW}ms ${EASE}`;
        v.style.transition = `stroke-dashoffset ${DRAW}ms ${EASE}`;
        h.style.strokeDashoffset = "0";
        v.style.strokeDashoffset = "0";
      });
    } else {
      const hLen = Number(h.style.strokeDasharray) || 0;
      const vLen = Number(v.style.strokeDasharray) || 0;
      h.style.transition = `stroke-dashoffset ${OUT}ms ${EASE}`;
      v.style.transition = `stroke-dashoffset ${OUT}ms ${EASE}`;
      h.style.strokeDashoffset = String(hLen);
      v.style.strokeDashoffset = String(vLen);
      setHovered(null);
    }
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
    <>
      {/* Content columns. */}
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
          transitionDelay: open ? "240ms" : "0ms",
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
              transition: `flex-grow 520ms ${EASE}`,
              cursor: item.target ? undefined : "default",
            }}
            className="relative flex-1 basis-0 overflow-hidden border-r-2 border-black text-left outline-none last:border-r-0"
          >
            <span className="absolute bottom-6 left-0 w-full pl-5 pr-2 text-[clamp(2.5rem,7vw,7rem)] font-bold leading-[0.9] tracking-[-0.02em] text-black">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Frame lines, drawn on top. */}
      <svg
        className="pointer-events-none fixed inset-0 z-[76] h-full w-full"
        aria-hidden="true"
      >
        <line ref={hRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" />
        <line ref={vRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" />
      </svg>
    </>
  );
}
