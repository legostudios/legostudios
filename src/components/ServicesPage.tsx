import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HomeLogo } from "./HomeLogo";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SMOOTH = "cubic-bezier(0.22, 1, 0.36, 1)";
const SLIDE = 780; // heading slide-to-top duration
const LOGO_GAP = 18;
const CLOCK_GAP = 16;

interface ServicesPageProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
}

// The services page: a black panel filling the framed content area (below the
// horizontal line, right of the vertical line). The "Services" heading slides
// up from the bottom to the top of that space when the page opens.
export function ServicesPage({
  closing,
  onRequestClose,
  onCloseFinished,
}: ServicesPageProps) {
  const [geo, setGeo] = useState({ vx: 86, hy: 120 });
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const measureGeo = () => {
      const logo = document.querySelector('img[alt="LEGO"]') as HTMLElement | null;
      const clock = document.querySelector('[aria-label="Menu"]') as HTMLElement | null;
      const lr = logo?.getBoundingClientRect();
      const cr = clock?.getBoundingClientRect();
      const vx = Math.round(cr ? cr.right + CLOCK_GAP : 84);
      const hy = Math.round(lr ? lr.bottom + LOGO_GAP : window.innerHeight * 0.14);
      setGeo({ vx, hy });
      return hy;
    };
    const hy = measureGeo();
    // Park the heading at the bottom of the panel to start.
    const h = headingRef.current;
    if (h) {
      const panelH = window.innerHeight - hy;
      const bottomY = Math.max(0, panelH - h.offsetHeight - 44);
      h.style.transition = "none";
      h.style.transform = `translateY(${bottomY}px)`;
    }
    const onResize = () => measureGeo();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKey);
    // Slide the heading up to the top once mounted.
    const raf = requestAnimationFrame(() => {
      const h = headingRef.current;
      if (h) {
        h.style.transition = `transform ${SLIDE}ms ${SMOOTH}`;
        h.style.transform = "translateY(0)";
      }
    });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [onRequestClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Services"
      onTransitionEnd={(e) => {
        if (closing && e.target === e.currentTarget && e.propertyName === "opacity") {
          onCloseFinished();
        }
      }}
      className={`fixed inset-0 z-[62] transition-opacity duration-500 ease-out ${
        closing ? "opacity-0" : "opacity-100 starting:opacity-0"
      }`}
      style={{ fontFamily: HELV }}
    >
      <HomeLogo onClick={onRequestClose} align="center" />

      <div
        className="absolute overflow-hidden bg-black"
        style={{ left: geo.vx, top: geo.hy, right: 0, bottom: 0 }}
      >
        <h1
          ref={headingRef}
          className="absolute left-6 top-5 whitespace-nowrap text-[clamp(2.5rem,8vw,8rem)] font-bold leading-[0.9] tracking-[-0.02em] text-white will-change-transform"
        >
          Services
        </h1>
      </div>
    </div>
  );
}
