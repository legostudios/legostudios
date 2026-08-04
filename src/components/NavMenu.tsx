import { useEffect, useState } from "react";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface NavMenuProps {
  closing: boolean;
  onRequestClose: () => void;
  onCloseFinished: () => void;
  onServices: () => void;
  onCaseStudies: () => void;
  onContact: () => void;
}

// The navigation: clicking the clock draws an outlined circle around it and
// unfurls a black banner (a bar ending in a downward point) that slides down to
// reveal the menu items as vertical labels. Anchored to the clock's centre.
export function NavMenu({
  closing,
  onRequestClose,
  onCloseFinished,
  onServices,
  onCaseStudies,
  onContact,
}: NavMenuProps) {
  // Flip to the open state one frame after mount so the enter transition runs.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRequestClose]);

  const open = entered && !closing;

  const items: Array<{ label: string; onClick?: () => void }> = [
    { label: "Services", onClick: onServices },
    { label: "Case studies", onClick: onCaseStudies },
    { label: "Magazine" }, // non-functional for now
    { label: "Contact", onClick: onContact },
  ];

  return (
    <nav
      aria-label="Navigation"
      className="fixed left-[53px] top-[53px] z-[80]"
      style={{ fontFamily: HELV }}
    >
      {/* Outlined circle that forms around the clock. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-11 w-11 rounded-full border-2 border-black transition-all duration-300 ease-out"
        style={{
          opacity: open ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${open ? 1 : 0.55})`,
        }}
      />

      {/* Banner that unfurls downward — max-height animates the reveal without
          distorting the pointed shape or the text. */}
      <div
        onTransitionEnd={(e) => {
          if (closing && e.propertyName === "max-height") {
            onCloseFinished();
          }
        }}
        className="absolute left-0 top-[19px] -translate-x-1/2 overflow-hidden transition-[max-height] duration-[440ms] ease-out"
        style={{ maxHeight: open ? "520px" : "0px" }}
      >
        <div>
          <div
            className="flex flex-col items-center gap-6 bg-black px-2.5 pb-9 pt-6 text-white"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% calc(100% - 22px), 50% 100%, 0 calc(100% - 22px))",
            }}
          >
            {items.map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick ?? undefined}
                className="leading-none transition-opacity duration-300 hover:opacity-60"
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "sideways",
                  fontSize: "clamp(0.95rem, 1.5vh, 1.15rem)",
                  cursor: item.onClick ? undefined : "default",
                  opacity: open ? 1 : 0,
                  transition: "opacity 300ms ease",
                  transitionDelay: open ? `${120 + i * 70}ms` : "0ms",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
