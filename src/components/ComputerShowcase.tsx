import { useEffect, useState } from "react";

const N = 8;
const IMAGES = Array.from({ length: N }, (_, i) => `/computer_images/${i + 1}.png`);

interface ComputerShowcaseProps {
  /** When false, cycling pauses and the current frame is held. */
  playing: boolean;
}

// The Macintosh cycling through 8 frames (identical body, different on-screen
// image) every 0.5s. The incoming frame fades in ON TOP of the previous one,
// which stays fully opaque underneath — so the body never dips in opacity and
// only the screen appears to dissolve.
export function ComputerShowcase({ playing }: ComputerShowcaseProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % N), 500);
    return () => window.clearInterval(id);
  }, [playing]);

  return (
    <div className="reference-computer relative aspect-[2/1] overflow-hidden">
      {IMAGES.map((src, i) => {
        const isActive = i === active;
        const isPrev = i === (active - 1 + N) % N;
        return (
          <img
            key={src}
            src={src}
            alt={i === 0 ? "Retro Macintosh computer" : ""}
            aria-hidden={i !== 0}
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-[350ms] ease-in-out"
            style={{
              opacity: isActive || isPrev ? 1 : 0,
              zIndex: isActive ? 2 : isPrev ? 1 : 0,
            }}
          />
        );
      })}
    </div>
  );
}
