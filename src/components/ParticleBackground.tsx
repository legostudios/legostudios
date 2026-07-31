import { useEffect, useRef } from "react";
import { ParticleEngine, type ParticleConfig } from "../lib/ParticleEngine";

interface ParticleBackgroundProps {
  className?: string;
  config?: Partial<ParticleConfig>;
}

// Mounts the canvas and owns the engine lifecycle. The canvas ignores pointer
// events (the engine listens on window), so content above stays interactive.
export function ParticleBackground({
  className,
  config,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new ParticleEngine(canvas, config);
    engine.start();
    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none block h-full w-full ${className ?? ""}`}
    />
  );
}
