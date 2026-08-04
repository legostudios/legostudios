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

// The navigation: a column of vertical labels down the left edge (reading
// bottom-to-top), starting just under the clock. Each label eases in with a
// slight stagger for a smooth reveal, and fades out together on close.
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
  const [hovered, setHovered] = useState<number | null>(null);

  const items: Array<{ label: string; onClick?: () => void }> = [
    { label: "Services", onClick: onServices },
    { label: "Case studies", onClick: onCaseStudies },
    { label: "Magazine" }, // non-functional for now
    { label: "Contact", onClick: onContact },
  ];

  return (
    <nav
      aria-label="Navigation"
      className="fixed bottom-[6vh] left-9 top-[5.25rem] z-[80] flex flex-col items-start justify-start gap-[clamp(1.25rem,3.2vh,2.5rem)]"
      style={{ fontFamily: HELV }}
    >
      {items.map((item, i) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick ?? undefined}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          onTransitionEnd={
            i === items.length - 1
              ? (e) => {
                  if (closing && e.propertyName === "opacity") onCloseFinished();
                }
              : undefined
          }
          className="relative normal-case leading-none tracking-normal text-black"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "sideways",
            fontSize: "clamp(1.05rem, 2vh, 1.5rem)",
            cursor: item.onClick ? undefined : "default",
            opacity: open ? 1 : 0,
            transform: "rotate(180deg)", // read bottom-to-top
            // fade in place (no movement), gently eased with a slight stagger
            transition: "opacity 520ms cubic-bezier(0.22, 1, 0.36, 1)",
            transitionDelay: open ? `${i * 75}ms` : "0ms",
          }}
        >
          {item.label}
          {/* underline beside the label that grows from the centre outward on
              hover. Reset to horizontal-tb so top/bottom size it properly. */}
          <span
            aria-hidden="true"
            style={{
              writingMode: "horizontal-tb",
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "-0.42em",
              width: "2px",
              background: "black",
              transformOrigin: "center",
              transform: hovered === i ? "scaleY(1)" : "scaleY(0)",
              transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
              pointerEvents: "none",
            }}
          />
        </button>
      ))}
    </nav>
  );
}
