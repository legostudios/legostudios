import { useEffect } from "react";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface NavMenuProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
  onServices: () => void;
  onCaseStudies: () => void;
  onContact: () => void;
}

// The navigation: a full-height column of vertical labels down the left edge
// (reading bottom-to-top), evenly distributed top-to-bottom. It fades in over
// the home page — not a separate page.
export function NavMenu({
  closing,
  onRequestClose,
  onCloseFinished,
  onServices,
  onCaseStudies,
  onContact,
}: NavMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRequestClose]);

  const items: Array<{ label: string; onClick?: () => void }> = [
    { label: "Services", onClick: onServices },
    { label: "Case studies", onClick: onCaseStudies },
    { label: "Magazine" }, // non-functional for now
    { label: "Contact", onClick: onContact },
  ];

  return (
    <nav
      aria-label="Navigation"
      onTransitionEnd={(e) => {
        if (closing && e.target === e.currentTarget && e.propertyName === "opacity") {
          onCloseFinished();
        }
      }}
      className={`fixed bottom-[6vh] left-9 top-[5.25rem] z-[80] flex flex-col items-start justify-start gap-[clamp(1.25rem,3.2vh,2.5rem)] transition-opacity duration-500 ease-out ${
        closing ? "opacity-0" : "opacity-100 starting:opacity-0"
      }`}
      style={{ fontFamily: HELV }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick ?? undefined}
          className="normal-case leading-none tracking-normal text-black"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "sideways",
            transform: "rotate(180deg)", // read bottom-to-top
            fontSize: "clamp(1.05rem, 2vh, 1.5rem)",
            cursor: item.onClick ? undefined : "default",
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
