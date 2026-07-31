import computerImg from "../images/macintosh.png";
import logoImg from "../images/legologo.webp";

// The retro Macintosh with our logo flickering on its screen.
export function ComputerShowcase() {
  return (
    <div className="reference-computer relative aspect-[2/1] overflow-hidden">
      <img
        src={computerImg}
        alt="Retro Macintosh computer"
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
      />

      <img
        src={logoImg}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="computer-logo pointer-events-none absolute"
      />
    </div>
  );
}
