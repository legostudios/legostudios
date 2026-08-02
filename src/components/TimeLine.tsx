import { useEffect, useRef } from "react";

// A minimal two-hand clock (no face, no numbers) that quietly shows IST time.
// The hour hand SNAPS to the exact current hour — at 9:55 it points dead-on 9,
// never drifting toward 10. The minute hand moves continuously.

const VB = 40;
const C = VB / 2; // centre
const HAND_LEN = 18; // hour and minute hands are the same length
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // Asia/Kolkata = UTC+5:30, no DST

// Endpoint of a hand of `len`, at `deg` measured clockwise from 12 o'clock.
function tip(len: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  return { x: C + len * Math.sin(r), y: C - len * Math.cos(r) };
}

interface TimeLineProps {
  onClick: () => void;
}

export function TimeLine({ onClick }: TimeLineProps) {
  const hourRef = useRef<SVGLineElement>(null);
  const minRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      // Current IST wall-clock time.
      const ist = new Date(Date.now() + IST_OFFSET_MS);
      const h = ist.getUTCHours() % 12;
      const m = ist.getUTCMinutes();
      const s = ist.getUTCSeconds() + ist.getUTCMilliseconds() / 1000;

      // Hour hand: exact hour only (ignores minutes) → snaps to the number.
      const hourTip = tip(HAND_LEN, (h / 12) * 360);
      // Minute hand: continuous, so it glides with the passing time.
      const minTip = tip(HAND_LEN, ((m + s / 60) / 60) * 360);

      const hl = hourRef.current;
      const ml = minRef.current;
      if (hl) {
        hl.setAttribute("x2", hourTip.x.toFixed(2));
        hl.setAttribute("y2", hourTip.y.toFixed(2));
      }
      if (ml) {
        ml.setAttribute("x2", minTip.x.toFixed(2));
        ml.setAttribute("y2", minTip.y.toFixed(2));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Menu"
      className="fixed left-9 top-9 z-[85] block"
    >
      <svg
        width="34"
        height="34"
        viewBox={`0 0 ${VB} ${VB}`}
        fill="none"
        aria-hidden="true"
      >
        <line
          ref={minRef}
          x1={C}
          y1={C}
          x2={C}
          y2={C - HAND_LEN}
          stroke="#000000"
          strokeWidth={4}
          strokeLinecap="butt"
        />
        <line
          ref={hourRef}
          x1={C}
          y1={C}
          x2={C}
          y2={C - HAND_LEN}
          stroke="#000000"
          strokeWidth={4}
          strokeLinecap="butt"
        />
      </svg>
    </button>
  );
}
