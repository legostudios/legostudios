// The Macintosh with the animated Lego Studios logo glowing on its CRT screen.
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
      {/* The animated logo loops silently on the screen (99 KB, no audio, filling the screen);
          the still frame shows instantly while it loads. */}
      <div className="computer-screen" aria-hidden="true">
        <video
          src="/logo-screen-v4.mp4"
          poster="/logo-screen-v4-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
