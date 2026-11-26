import { useEffect, useRef } from "react";
import { ComputerShowcase } from "./ComputerShowcase";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const STRIP_TEXT = "The creative archive of today";
// Each separator square takes the next brand colour: pink → sky blue → yellow.
const STRIP_COLORS = [
  "var(--color-brand-pink)",
  "var(--color-brand-sky)",
  "var(--color-brand-yellow)",
];
// Enough copies to overflow even an ultra-wide screen; the track is rendered
// twice and slides by exactly one copy for a seamless loop. Keep it a
// multiple of the colour count so the colour sequence loops seamlessly too.
const STRIP_REPEAT = 6;

function StripTrack({ hidden }: { hidden?: boolean }) {
  return (
    <div className="home-strip-track" aria-hidden={hidden || undefined}>
      {Array.from({ length: STRIP_REPEAT }, (_, i) => (
        <span key={i} className="home-strip-item">
          <span className="home-strip-text">{STRIP_TEXT}</span>
          <span
            className="home-strip-sep"
            aria-hidden="true"
            style={{ background: STRIP_COLORS[i % STRIP_COLORS.length] }}
          />
        </span>
      ))}
    </div>
  );
}

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Hold the video still for reduced-motion users; otherwise make sure it
  // plays (some mobile browsers ignore autoplay until poked).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (reducedMotion) v.pause();
    else v.play().catch(() => {});
  }, [reducedMotion]);

  return (
    <section id="top" className="home-hero">
      {/* Full-bleed background video (H.264 MP4 — plays on every browser).
          Phones get a lighter 720p encode; larger screens get 1080p. */}
      <video
        ref={videoRef}
        className="home-hero-video"
        autoPlay={!reducedMotion}
        muted
        loop
        playsInline
        preload="auto"
        poster="/home-video-v3-poster.webp"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/home-video-v3-720.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/home-video-v3.mp4" type="video/mp4" />
      </video>

      {/* The computer, centered in the space above the strip and sized to fit
          any width or aspect ratio. */}
      <div className="home-computer-stage">
        <div className="home-computer">
          <ComputerShowcase />
        </div>
      </div>

      {/* Scrolling strip pinned to the bottom of the screen. */}
      <div className="home-strip" role="marquee" aria-label={STRIP_TEXT}>
        <div className="home-strip-inner">
          <StripTrack />
          <StripTrack hidden />
        </div>
      </div>
    </section>
  );
}
