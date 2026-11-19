interface MenuButtonProps {
  onClick: () => void;
  /** White instead of black, for the black Contact page. */
  onDark?: boolean;
}

// The menu button: a solid black square, top-left on every page. Clicking it
// opens the menu (or closes it when the menu is showing).
export function MenuButton({ onClick, onDark = false }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Menu"
      className={`menu-square ${onDark ? "menu-square--on-dark" : ""}`}
    >
      <span className="menu-square-box" aria-hidden="true" />
    </button>
  );
}
