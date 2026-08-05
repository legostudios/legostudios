import { useEffect, useRef } from "react";

const EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const DRAW = 1050;
const LOGO_GAP = 18;
const CLOCK_GAP = 16;

// The two permanent architectural lines — a horizontal line under the logo
// meeting a vertical line right of the clock. They draw themselves once on load
// and then stay put on every page (re-positioning silently on resize).
export function FrameLines() {
  const hRef = useRef<SVGLineElement>(null);
  const vRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const h = hRef.current;
    const v = vRef.current;
    if (!h || !v) return;
    let drawn = false;

    const place = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const logo = document.querySelector('img[alt="LEGO"]') as HTMLElement | null;
      const clock = document.querySelector('[aria-label="Menu"]') as HTMLElement | null;
      const lr = logo?.getBoundingClientRect();
      const cr = clock?.getBoundingClientRect();
      const vx = Math.round(cr ? cr.right + CLOCK_GAP : 84);
      const hy = Math.round(lr ? lr.bottom + LOGO_GAP : H * 0.14);

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

      if (!drawn) {
        drawn = true;
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

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[76] h-full w-full"
      aria-hidden="true"
    >
      <line ref={hRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" style={{ opacity: 0 }} />
      <line ref={vRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" style={{ opacity: 0 }} />
    </svg>
  );
}
