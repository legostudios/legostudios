import { useEffect, useState } from "react";
import { SERVICES } from "../data/services";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";
import { HomeLogo } from "./HomeLogo";

const THIN = '"Jost", "Century Gothic", sans-serif';

// One photo per service, offset from the case-study set so they differ.
const SERVICE_IMAGES = SERVICES.map(
  (_, i) => SHOWCASE_IMAGES[(i + 8) % SHOWCASE_IMAGES.length],
);

// Each service's photo gets its own size + placement on the left half, so the
// image jumps around as you move between names (like the reference).
const FRAMES = [
  "lg:left-[6vw] lg:top-[8vh] lg:h-[82vh] lg:w-[40vw]",
  "lg:left-[11vw] lg:top-[22vh] lg:h-[52vh] lg:w-[36vw]",
  "lg:left-[3vw] lg:top-[10vh] lg:h-[74vh] lg:w-[34vw]",
  "lg:left-[8vw] lg:top-[17vh] lg:h-[60vh] lg:w-[46vw]",
  "lg:left-[13vw] lg:top-[6vh] lg:h-[72vh] lg:w-[38vw]",
];

interface ServicesPageProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
}

// The services page, two-odd style: thin names on the right; hovering a name
// slides it right past a black bar and swaps in that service's photo, which
// sits in its own size/position on the left half.
export function ServicesPage({
  closing,
  onRequestClose,
  onCloseFinished,
}: ServicesPageProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? 0;

  useEffect(() => {
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
      className={`fixed inset-0 z-[60] overflow-y-auto bg-white text-black transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        closing ? "opacity-0" : "opacity-100 starting:opacity-0"
      }`}
      style={{ fontFamily: THIN }}
    >
      <HomeLogo onClick={onRequestClose} align="center" />

      <div className="flex min-h-full flex-col items-center justify-center gap-10 px-6 py-24 lg:block lg:p-0">
        {/* Left photo — one stacked image on mobile, per-service frames at lg. */}
        <div className="relative aspect-[4/5] w-[64vw] max-w-[340px] shrink-0 overflow-hidden lg:hidden">
          {SERVICE_IMAGES.map((src, i) => (
            <img
              key={`m${i}`}
              src={src}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out"
              style={{ opacity: i === active ? 1 : 0 }}
            />
          ))}
        </div>
        {SERVICE_IMAGES.map((src, i) => (
          <img
            key={`d${i}`}
            src={src}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`pointer-events-none absolute hidden object-cover transition-opacity duration-500 ease-out lg:block ${FRAMES[i % FRAMES.length]}`}
            style={{ opacity: i === active ? 1 : 0 }}
          />
        ))}

        {/* Names on the right. */}
        <ul
          onMouseLeave={() => setHovered(null)}
          className="relative flex flex-col items-center gap-[clamp(0.9rem,3vh,2.25rem)] text-center lg:absolute lg:left-[58vw] lg:top-1/2 lg:max-w-[40vw] lg:-translate-y-1/2 lg:items-start lg:text-left"
        >
          {SERVICES.map((name, i) => (
            <li key={name} className="w-full">
              <div
                onMouseEnter={() => setHovered(i)}
                className="group relative w-full text-center text-[clamp(1.5rem,2.5vw,2.9rem)] font-light uppercase leading-[1.1] tracking-[0.03em] text-black lg:pl-[clamp(1.25rem,2.2vw,2.75rem)] lg:text-left"
              >
                {/* black bar beside the name (desktop) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-1/2 hidden h-[0.72em] w-[3px] -translate-y-1/2 bg-black opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 lg:block"
                />
                <span className="inline-block transition-transform duration-300 ease-out lg:whitespace-nowrap lg:group-hover:translate-x-[1.1vw]">
                  {name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
