import { useEffect, useRef } from "react";

// easeOutCubic
const EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const DRAW = 1000; // frame draw duration
const PART = 820; // partition draw duration
const PART_DELAY = 220;
const OUT = 460; // retract duration

const LOGO_GAP = 18;
const CLOCK_GAP = 16;

interface PageFrameProps {
  open: boolean;
}

// The clock opens this framed menu: a horizontal line under the logo meeting a
// vertical line right of the clock, the content area whited out, and split into
// four equal columns. Lines draw themselves in on open and retract on close.
export function PageFrame({ open }: PageFrameProps) {
  const rectRef = useRef<SVGRectElement>(null);
  const hRef = useRef<SVGLineElement>(null);
  const vRef = useRef<SVGLineElement>(null);
  const pRefs = useRef<(SVGLineElement | null)[]>([]);

  useEffect(() => {
    const rect = rectRef.current;
    const h = hRef.current;
    const v = vRef.current;
    const parts = pRefs.current;
    if (!rect || !h || !v) return;

    const measure = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const logo = document.querySelector('img[alt="LEGO"]') as HTMLElement | null;
      const clock = document.querySelector('[aria-label="Menu"]') as HTMLElement | null;
      const lr = logo?.getBoundingClientRect();
      const cr = clock?.getBoundingClientRect();
      const vx = Math.round(cr ? cr.right + CLOCK_GAP : 84);
      const hy = Math.round(lr ? lr.bottom + LOGO_GAP : H * 0.14);

      // Content area + 4 equal columns.
      rect.setAttribute("x", String(vx));
      rect.setAttribute("y", String(hy));
      rect.setAttribute("width", String(Math.max(0, W - vx)));
      rect.setAttribute("height", String(Math.max(0, H - hy)));

      h.setAttribute("x1", String(W));
      h.setAttribute("y1", String(hy));
      h.setAttribute("x2", String(vx));
      h.setAttribute("y2", String(hy));
      const hLen = W - vx;

      v.setAttribute("x1", String(vx));
      v.setAttribute("y1", String(H));
      v.setAttribute("x2", String(vx));
      v.setAttribute("y2", String(0));
      const vLen = H;

      const colW = (W - vx) / 4;
      const partLen = H - hy;
      parts.forEach((p, i) => {
        if (!p) return;
        const x = Math.round(vx + colW * (i + 1));
        p.setAttribute("x1", String(x));
        p.setAttribute("y1", String(hy));
        p.setAttribute("x2", String(x));
        p.setAttribute("y2", String(H));
        p.style.strokeDasharray = String(partLen);
      });

      h.style.strokeDasharray = String(hLen);
      v.style.strokeDasharray = String(vLen);
      return { hLen, vLen, partLen };
    };

    if (open) {
      const { hLen, vLen, partLen } = measure();
      // hidden start
      for (const el of [h, v, ...parts]) {
        if (!el) continue;
        el.style.transition = "none";
      }
      h.style.strokeDashoffset = String(hLen);
      v.style.strokeDashoffset = String(vLen);
      parts.forEach((p) => p && (p.style.strokeDashoffset = String(partLen)));
      rect.style.transition = "none";
      rect.style.opacity = "0";
      void h.getBoundingClientRect(); // flush
      requestAnimationFrame(() => {
        rect.style.transition = `opacity 340ms ${EASE}`;
        rect.style.opacity = "1";
        h.style.transition = `stroke-dashoffset ${DRAW}ms ${EASE}`;
        v.style.transition = `stroke-dashoffset ${DRAW}ms ${EASE}`;
        h.style.strokeDashoffset = "0";
        v.style.strokeDashoffset = "0";
        parts.forEach((p) => {
          if (!p) return;
          p.style.transition = `stroke-dashoffset ${PART}ms ${EASE} ${PART_DELAY}ms`;
          p.style.strokeDashoffset = "0";
        });
      });
    } else {
      // retract on close
      const hLen = Number(h.style.strokeDasharray) || 0;
      const vLen = Number(v.style.strokeDasharray) || 0;
      rect.style.transition = `opacity ${OUT}ms ${EASE}`;
      rect.style.opacity = "0";
      h.style.transition = `stroke-dashoffset ${OUT}ms ${EASE}`;
      v.style.transition = `stroke-dashoffset ${OUT}ms ${EASE}`;
      h.style.strokeDashoffset = String(hLen);
      v.style.strokeDashoffset = String(vLen);
      parts.forEach((p) => {
        if (!p) return;
        const len = Number(p.style.strokeDasharray) || 0;
        p.style.transition = `stroke-dashoffset ${OUT}ms ${EASE}`;
        p.style.strokeDashoffset = String(len);
      });
    }
  }, [open]);

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[76] h-full w-full"
      aria-hidden="true"
    >
      <rect
        ref={rectRef}
        fill="#ffffff"
        style={{ opacity: 0, pointerEvents: open ? "auto" : "none" }}
      />
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          ref={(el) => {
            pRefs.current[i] = el;
          }}
          stroke="#000000"
          strokeWidth={2}
          shapeRendering="crispEdges"
        />
      ))}
      <line ref={hRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" />
      <line ref={vRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" />
    </svg>
  );
}
