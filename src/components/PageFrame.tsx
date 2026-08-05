import { useEffect, useRef } from "react";

// easeOutCubic
const EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const DURATION = 1050;

const LOGO_GAP = 18; // space between the logo and the horizontal line
const CLOCK_GAP = 16; // space between the clock/menu and the vertical line

// Two permanent architectural lines: a horizontal line under the logo running to
// the right edge, and a vertical line just right of the clock/menu down the left
// rail. On first load they draw themselves (right->left, bottom->up) once, then
// stay static forever. Measured off the real logo/clock so everything aligns.
export function PageFrame() {
  const hRef = useRef<SVGLineElement>(null);
  const vRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const h = hRef.current;
    const v = vRef.current;
    if (!h || !v) return;

    const place = (animate: boolean) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const logo = document.querySelector('img[alt="LEGO"]') as HTMLElement | null;
      const clock = document.querySelector('[aria-label="Menu"]') as HTMLElement | null;
      const lr = logo?.getBoundingClientRect();
      const cr = clock?.getBoundingClientRect();

      // Horizontal: from the right edge, in to just under the logo.
      const hy = Math.round(lr ? lr.bottom + LOGO_GAP : H * 0.14) + 0.5;
      const hxLeft = Math.round(lr ? lr.left : W * 0.5);
      const hxRight = W;
      h.setAttribute("x1", String(hxRight));
      h.setAttribute("y1", String(hy));
      h.setAttribute("x2", String(hxLeft));
      h.setAttribute("y2", String(hy));

      // Vertical: full height, just right of the clock/menu column.
      const vx = Math.round(cr ? cr.right + CLOCK_GAP : 84) + 0.5;
      v.setAttribute("x1", String(vx));
      v.setAttribute("y1", String(H));
      v.setAttribute("x2", String(vx));
      v.setAttribute("y2", String(0));

      const hLen = hxRight - hxLeft;
      const vLen = H;
      h.style.strokeDasharray = String(hLen);
      v.style.strokeDasharray = String(vLen);
      h.style.opacity = "1";
      v.style.opacity = "1";

      if (animate) {
        h.style.transition = "none";
        v.style.transition = "none";
        h.style.strokeDashoffset = String(hLen);
        v.style.strokeDashoffset = String(vLen);
        void h.getBoundingClientRect(); // flush
        requestAnimationFrame(() => {
          h.style.transition = `stroke-dashoffset ${DURATION}ms ${EASE}`;
          v.style.transition = `stroke-dashoffset ${DURATION}ms ${EASE}`;
          h.style.strokeDashoffset = "0";
          v.style.strokeDashoffset = "0";
        });
      } else {
        // Reposition on resize without redrawing — the lines stay put.
        h.style.transition = "none";
        v.style.transition = "none";
        h.style.strokeDashoffset = "0";
        v.style.strokeDashoffset = "0";
      }
    };

    place(true);
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[76] h-full w-full"
      aria-hidden="true"
    >
      <line
        ref={hRef}
        stroke="#000000"
        strokeWidth={1}
        shapeRendering="crispEdges"
        style={{ opacity: 0 }}
      />
      <line
        ref={vRef}
        stroke="#000000"
        strokeWidth={1}
        shapeRendering="crispEdges"
        style={{ opacity: 0 }}
      />
    </svg>
  );
}
