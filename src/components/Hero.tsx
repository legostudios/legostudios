import { useState } from "react";
import { ComputerShowcase } from "./ComputerShowcase";
import { CenterReveal } from "./CenterReveal";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const LABEL = "text-[13px] font-normal text-[#111111] sm:text-[14px]";

export function Hero() {
  const [playing, setPlaying] = useState(true);

  return (
    <section
      id="top"
      className="relative min-h-dvh overflow-hidden bg-white"
      style={{ fontFamily: HELV }}
    >
      {/* LEGO logo — top-center on every size. */}
      <img
        src="/lego-logo.png"
        alt="LEGO"
        draggable={false}
        className="absolute left-1/2 top-[6.5%] z-10 -translate-x-1/2 select-none"
        style={{ width: "clamp(2rem, 3vw, 3.25rem)", height: "auto" }}
      />

      {/* MOBILE + TABLET (< lg): centered column — computer with labels below. */}
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 lg:hidden">
        <div className="flex w-full justify-center">
          <ComputerShowcase playing={playing} />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className={LABEL}>The Creative Archive</span>
          <span className={LABEL}>Of Today</span>
        </div>
      </div>

      {/* DESKTOP (lg+): the machine centered, labels flanking it. */}
      <div className="reference-hero-content hidden lg:block">
        <div className="hero-computer">
          <ComputerShowcase playing={playing} />
        </div>
        <span className={`absolute left-[16%] top-[77%] ${LABEL}`}>
          The Creative Archive
        </span>
        <span className={`absolute right-[19.5%] top-[77%] text-right ${LABEL}`}>
          Of Today
        </span>
      </div>

      {/* Invisible centered headline, revealed under the cursor (laptop only).
          Placed after the computer so it paints on top and — with no z-index of
          its own — blends (difference) against the white page and the machine. */}
      <CenterReveal />

      {/* Play / Pause — bottom-right on every size. */}
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause" : "Play"}
        className={`absolute bottom-6 right-6 z-10 transition-opacity hover:opacity-60 lg:bottom-[5.2%] lg:right-[2.8%] ${LABEL}`}
      >
        {playing ? "Pause" : "Play"}
      </button>
    </section>
  );
}
