import { useEffect, useRef } from "react";
import { CursorEngine, type CursorConfig } from "../lib/CursorEngine";

interface CustomCursorProps {
  config?: Partial<CursorConfig>;
}

// Global custom cursor. Only runs on large, fine-pointer (mouse) screens —
// phones and tablets keep their native behaviour and no cursor is drawn. The
// media query is watched live, so it also turns off if the window shrinks.
export function CustomCursor({ config }: CustomCursorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    let engine: CursorEngine | null = null;
    const apply = () => {
      if (mq.matches && !engine) {
        engine = new CursorEngine(el, config);
        engine.start();
      } else if (!mq.matches && engine) {
        engine.destroy();
        engine = null;
      }
    };

    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      engine?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} aria-hidden="true" />;
}
