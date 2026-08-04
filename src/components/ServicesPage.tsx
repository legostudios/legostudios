import { useEffect } from "react";
import { HomeLogo } from "./HomeLogo";
import { FilingDrawer } from "./FilingDrawer";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface ServicesPageProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
}

// The services page: a filing-drawer of folder tabs (all labelled "sample").
export function ServicesPage({
  closing,
  onRequestClose,
  onCloseFinished,
}: ServicesPageProps) {
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
      className={`fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#e3e2de] py-24 text-black transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        closing ? "opacity-0" : "opacity-100 starting:opacity-0"
      }`}
      style={{ fontFamily: HELV }}
    >
      <HomeLogo onClick={onRequestClose} align="center" />
      <FilingDrawer />
    </div>
  );
}
