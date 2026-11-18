// The Macintosh with a blank, dark CRT screen.
export function ComputerShowcase() {
  return (
    <div className="reference-computer relative aspect-[2/1] overflow-hidden">
      <img
        src="/computer.webp"
        alt="Retro Macintosh computer"
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}
