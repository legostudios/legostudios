// The Macintosh with the Lego Studios logo glowing on its dark CRT screen.
// The screen sits at x 379–827, y 258–593 of the 1200×1200 computer image,
// which fills its square box; .computer-screen is placed there (index.css).
export function ComputerShowcase() {
  return (
    <div className="reference-computer relative aspect-[2/1] overflow-hidden">
      <img
        src="/computer.webp"
        alt="Retro Macintosh computer"
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
      />
      <div className="computer-screen" aria-hidden="true">
        <img src="/logo-screen.webp" alt="" draggable={false} />
      </div>
    </div>
  );
}
