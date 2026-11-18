import { useEffect, useState } from "react";

// Keeps an overlay mounted long enough to animate out. `visible` flips on the
// frame after mount (so CSS transitions run on enter) and off immediately on
// close; `mounted` drops once the exit transition has had time to finish.
export function usePresence(active: boolean, exitMs = 400) {
  const [mounted, setMounted] = useState(active);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setMounted(true);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(t);
  }, [active, exitMs]);

  return { mounted, visible };
}
