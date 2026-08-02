interface HomeLogoProps {
  onClick: () => void;
  align?: "center" | "right";
}

// The home-screen LEGO logo, pinned to the top of every overlay page. Clicking
// it closes the page and returns to the home screen.
export function HomeLogo({ onClick, align = "center" }: HomeLogoProps) {
  const pos =
    align === "right" ? "right-[3vw]" : "left-1/2 -translate-x-1/2";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Home"
      className={`absolute top-[6.5%] z-[70] transition-opacity hover:opacity-70 ${pos}`}
    >
      <img
        src="/lego-logo.png"
        alt="LEGO"
        draggable={false}
        className="select-none"
        style={{ width: "clamp(2.5rem, 4vw, 4.25rem)", height: "auto" }}
      />
    </button>
  );
}
