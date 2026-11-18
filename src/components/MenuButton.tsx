interface MenuButtonProps {
  onClick: () => void;
  /** White with a difference blend, so it inverts against the home-page
   *  video and stays visible on both light and dark frames. */
  light?: boolean;
}

// The menu button: a plain square outline that fills in on hover. It sits on
// every page; clicking it opens the menu or steps back a level.
export function MenuButton({ onClick, light = false }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Menu"
      className="menu-square fixed left-6 top-6 z-[85] block"
      style={{
        color: light ? "#ffffff" : "#000000",
        mixBlendMode: light ? "difference" : undefined,
      }}
    >
      <span className="menu-square-box" aria-hidden="true" />
    </button>
  );
}
