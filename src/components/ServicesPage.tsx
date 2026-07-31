import { useEffect, useRef } from "react";
import { SERVICES } from "../data/services";

// Tight Helvetica-style face for the big titles, matching the reference.
const DISPLAY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface ServicesPageProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
}

// An editorial list of services in the Artists Equity style: black page, giant
// bold titles, thin dividers, and rows that invert to a white block on hover.
export function ServicesPage({
  closing,
  onRequestClose,
  onCloseFinished,
}: ServicesPageProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onRequestClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Our services"
      onTransitionEnd={(e) => {
        if (closing && e.target === e.currentTarget && e.propertyName === "opacity") {
          onCloseFinished();
        }
      }}
      className={`fixed inset-0 z-[60] overflow-y-auto bg-black text-white transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        closing ? "opacity-0" : "opacity-100 starting:opacity-0"
      }`}
      style={{ fontFamily: DISPLAY }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onRequestClose}
        aria-label="Close services"
        className="fixed right-5 top-5 z-[65] text-[13px] uppercase tracking-widest text-white/60 transition-colors hover:text-white sm:right-8 sm:top-7"
      >
        Close ✕
      </button>

      <div className="mx-auto max-w-[1500px] px-5 pb-24 pt-24 sm:px-8 md:pt-28">
        {SERVICES.map((name) => (
          <div key={name} className="border-t border-white/15">
            <a
              href="#"
              className="group relative block px-4 py-6 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:px-6 sm:py-8"
            >
              {/* White block fades in on enter, out on leave. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-white opacity-0 transition-opacity duration-[600ms] ease-out group-hover:opacity-100"
              />
              {/* Text nudges right on hover — slow, smooth ease. */}
              <div className="relative transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 sm:group-hover:translate-x-6">
                <h2 className="text-[clamp(2.4rem,7.5vw,5.75rem)] font-bold capitalize leading-[0.92] tracking-tight text-white transition-colors duration-[600ms] ease-out group-hover:text-black">
                  {name}
                </h2>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
