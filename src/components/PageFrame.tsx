import { useEffect, useLayoutEffect, useRef, useState } from "react";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const SMOOTH = "cubic-bezier(0.22, 1, 0.36, 1)";
const EXPAND = 700; // column expansion + name glide
const DRAW = 1000; // frame line draw
const OUT = 460; // frame line retract

const LOGO_GAP = 18;
const CLOCK_GAP = 16;

type Target = "services" | "caseStudies" | "contact";

const ITEMS: { label: string; target: Target | null }[] = [
  { label: "Services", target: "services" },
  { label: "Case Studies", target: "caseStudies" },
  { label: "Magazine", target: null },
  { label: "Contact", target: "contact" },
];

// A column heading. Collapsed, its words stack onto lines (clipped). Active, the
// words glide onto one line. Expanded (the column became a page), the whole name
// slides up to the top of the column.
function ColumnName({
  label,
  active,
  expanded,
}: {
  label: string;
  active: boolean;
  expanded: boolean;
}) {
  const words = label.split(" ");
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const outerRef = useRef<HTMLSpanElement>(null);
  const [stacked, setStacked] = useState<string[]>(() =>
    words.map(() => "translate(0, 0)"),
  );
  const [topSlide, setTopSlide] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const els = wordRefs.current;
      const first = els[0];
      if (first) {
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
      }
      const outer = outerRef.current;
      const parent = outer?.offsetParent as HTMLElement | null;
      if (outer && parent) {
        setTopSlide(-(parent.clientHeight - outer.offsetHeight - 44));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [label]);

  const oneLine = active || expanded;
  return (
    <span
      ref={outerRef}
      className="absolute bottom-6 left-0 w-full whitespace-nowrap pl-5 pr-2 text-[clamp(2.5rem,7vw,7rem)] font-bold leading-[0.9] tracking-[-0.02em] text-black"
      style={{
        transform: expanded ? `translateY(${topSlide}px)` : "translateY(0)",
        transition: `transform ${EXPAND}ms ${SMOOTH}`,
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          ref={(el) => {
            wordRefs.current[i] = el;
          }}
          className="inline-block"
          style={{
            transform: oneLine ? "translate(0, 0)" : stacked[i],
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

// The clock opens this menu: a horizontal line under the logo meets a vertical
// line right of the clock (both draw in on open), and the content area is split
// into four columns. Hovering expands a column; clicking Services expands its
// column to a blank page (the divider slides right) with the heading at the top.
export function PageFrame({ open, onNavigate, onClose }: PageFrameProps) {
  const hRef = useRef<SVGLineElement>(null);
  const vRef = useRef<SVGLineElement>(null);
  const [geo, setGeo] = useState({ vx: 86, hy: 120 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const h = hRef.current;
    const v = vRef.current;
    if (!h || !v) return;

    const position = (draw: boolean) => {
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
      h.style.opacity = "1";
      v.style.opacity = "1";

      if (draw) {
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
        h.style.transition = "none";
        v.style.transition = "none";
        h.style.strokeDashoffset = "0";
        v.style.strokeDashoffset = "0";
      }
    };

    if (open) {
      position(true);
      const onResize = () => position(false);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const hLen = Number(h.style.strokeDasharray) || 0;
    const vLen = Number(v.style.strokeDasharray) || 0;
    h.style.transition = `stroke-dashoffset ${OUT}ms ${EASE}`;
    v.style.transition = `stroke-dashoffset ${OUT}ms ${EASE}`;
    h.style.strokeDashoffset = String(hLen);
    v.style.strokeDashoffset = String(vLen);
    setHovered(null);
    setSelected(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelected((cur) => {
        if (cur !== null) return null; // back out of the page first
        onClose();
        return cur;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const anySel = selected !== null;

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
          transitionDelay: open ? "80ms" : "0ms",
          fontFamily: HELV,
        }}
      >
        {ITEMS.map((item, i) => {
          const isSel = selected === i;
          const hidden = anySel && !isSel;
          return (
            <button
              key={item.label}
              type="button"
              onMouseEnter={() => !anySel && setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                if (item.target === "services") setSelected(i);
                else if (item.target) onNavigate(item.target);
              }}
              style={{
                flexGrow: isSel ? 999 : hidden ? 0 : hovered === i ? 3 : 1,
                opacity: hidden ? 0 : 1,
                transition: `flex-grow ${EXPAND}ms ${SMOOTH}, opacity 300ms ${SMOOTH}`,
                cursor: item.target ? undefined : "default",
              }}
              className="relative flex-1 basis-0 overflow-hidden border-r-2 border-black text-left outline-none last:border-r-0"
            >
              <ColumnName
                label={item.label}
                active={hovered === i}
                expanded={isSel}
              />
            </button>
          );
        })}
      </div>

      {/* Frame lines, drawn on top. */}
      <svg
        className="pointer-events-none fixed inset-0 z-[76] h-full w-full"
        aria-hidden="true"
      >
        <line ref={hRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" style={{ opacity: 0 }} />
        <line ref={vRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" style={{ opacity: 0 }} />
      </svg>
    </>
  );
}
