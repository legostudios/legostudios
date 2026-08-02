import { useEffect } from "react";
import { HomeLogo } from "./HomeLogo";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const EMAIL = "hello@legostudios.com";
const LINKEDIN = "https://www.linkedin.com/company/lego-studios/";
const INSTAGRAM =
  "https://www.instagram.com/legostudios.co?igsh=MXI2NjBwN2d4dnlncw==";

interface ContactPageProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
}

// The contact page: a centered email with Instagram + LinkedIn icons below.
export function ContactPage({
  closing,
  onRequestClose,
  onCloseFinished,
}: ContactPageProps) {
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
      aria-label="Contact"
      onTransitionEnd={(e) => {
        if (closing && e.target === e.currentTarget && e.propertyName === "opacity") {
          onCloseFinished();
        }
      }}
      className={`fixed inset-0 z-[60] bg-white text-black transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        closing ? "opacity-0" : "opacity-100 starting:opacity-0"
      }`}
      style={{ fontFamily: HELV }}
    >
      {/* Same LEGO logo / position as the home page — acts as a home button. */}
      <HomeLogo onClick={onRequestClose} />

      <a
        href={`mailto:${EMAIL}`}
        className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(1.5rem,4.3vw,4.2rem)] text-black transition-opacity hover:opacity-60"
      >
        {EMAIL}
      </a>

      <div className="absolute left-1/2 top-[80%] flex -translate-x-1/2 -translate-y-1/2 items-center gap-[clamp(0.8rem,1.3vw,1.25rem)] text-black">
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="transition-opacity hover:opacity-60"
        >
          <img
            src="/ig-logo.webp"
            alt="Instagram"
            draggable={false}
            className="h-[clamp(26px,2.2vw,34px)] w-[clamp(26px,2.2vw,34px)] object-contain"
          />
        </a>
        <a
          href={LINKEDIN}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="transition-opacity hover:opacity-60"
        >
          <img
            src="/li-logo.png"
            alt="LinkedIn"
            draggable={false}
            className="h-[clamp(26px,2.2vw,34px)] w-[clamp(26px,2.2vw,34px)] object-contain"
          />
        </a>
      </div>
    </div>
  );
}
