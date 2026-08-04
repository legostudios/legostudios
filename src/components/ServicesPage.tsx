import { useEffect, useState } from "react";
import { SERVICES } from "../data/services";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";
import { HomeLogo } from "./HomeLogo";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const IMAGES = SHOWCASE_IMAGES;
const N = IMAGES.length;

interface ServicesPageProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
}

// The services page: bold service names on the left, a 4:5 photo cycling on the
// right. Stacked (photo above names) on mobile.
export function ServicesPage({
  closing,
  onRequestClose,
  onCloseFinished,
}: ServicesPageProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActive((a) => (a + 1) % N), 500);
    return () => window.clearInterval(id);
  }, []);

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
      style={{ fontFamily: HELV }}
    >
      <HomeLogo onClick={onRequestClose} align="center" />

      <div className="flex min-h-full flex-col items-center justify-center gap-10 px-6 py-24 lg:block lg:p-0">
        {/* 4:5 photo — stacked on top for mobile, on the right at lg+. */}
        <div className="relative aspect-[4/5] w-[64vw] max-w-[340px] shrink-0 overflow-hidden lg:absolute lg:right-[2.5vw] lg:top-1/2 lg:h-[72vh] lg:w-auto lg:max-w-none lg:-translate-y-1/2">
          {IMAGES.map((src, i) => {
            const isActive = i === active;
            const isPrev = i === (active - 1 + N) % N;
            return (
              <img
                key={src}
                src={src}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-linear"
                style={{
                  opacity: isActive || isPrev ? 1 : 0,
                  zIndex: isActive ? 2 : isPrev ? 1 : 0,
                }}
              />
            );
          })}
        </div>

        {/* Bold service names — centered on mobile, lower-left at lg+. */}
        <ul className="relative text-center lg:absolute lg:bottom-[11vh] lg:left-[7vw] lg:text-left">
          {SERVICES.map((name) => (
            <li
              key={name}
              className="text-[clamp(1.5rem,3.3vw,4rem)] font-bold leading-[1.12] tracking-[-0.02em] text-black lg:whitespace-nowrap lg:leading-[1.08]"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
