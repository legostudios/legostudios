import { useEffect, useRef } from "react";
import { ComputerShowcase } from "./ComputerShowcase";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const STRIP_TEXT = "The Creative Archive of Today";
// Enough copies to overflow even an ultra-wide screen; the track is rendered
// twice and slides by exactly one copy for a seamless loop.
const STRIP_REPEAT = 6;

function StripTrack({ hidden }: { hidden?: boolean }) {
  return (
    <div className="home-strip-track" aria-hidden={hidden || undefined}>
      {Array.from({ length: STRIP_REPEAT }, (_, i) => (
        <span key={i} className="home-strip-item">
          <span>{STRIP_TEXT}</span>
          <span className="home-strip-dot" aria-hidden="true" />
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
        poster="/home-video-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/home-video-720.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/home-video.mp4" type="video/mp4" />
      </video>

      {/* Invisible LEGO wordmark placeholder (alt="LEGO"): not shown, but the
          menu frame measures it to place its line and the Back button. */}
      <img
        src="/Logo-Horizontal.png"
        alt="LEGO"
        aria-hidden="true"
        draggable={false}
        className="invisible absolute left-1/2 top-[3.5%] -translate-x-1/2"
        style={{
          height: "clamp(1.25rem, 1.85vw, 2rem)",
          aspectRatio: "3918 / 1194",
        }}
      />

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
