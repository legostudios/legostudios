import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { PageTitle } from "./PageShell";
import type { StackItem } from "./StackView";

// ── Phone Case Studies: a pinned collage driven by native scroll ─────────────
// The outer section is taller than the screen; inside it a sticky, screen-tall
// composition stays pinned while the section scrolls past. Scroll progress
// through the section (0 → 1) moves every card along its own hand-set path.
// When the section ends the composition releases and the index below scrolls
// in normally.

// One card of the composition. Position is the card's centre (share of the
// pinned box), size is its width (vw, capped by svh so short phones keep it
// in proportion) and height/width ratio. Movement is in vw (x) and svh (y).
interface CardConfig {
  item: number;
  cx: number;
  cy: number;
  w: number;
  wMaxSvh: number;
  ratio: number;
  z: number;
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  rotationStart: number;
  rotationEnd: number;
  scaleStart: number;
  scaleEnd: number;
}

// Progress 0: a layered collage climbing from the bottom-left to the
// top-right, small cards at the back, large ones in front.
// Progress 1: the cards have drifted along different paths — up, down,
// sideways and diagonally, at different speeds (parallax depth) — into a
// looser collage that stays clear of the title, with the front cards risen
// into view from below.
const CARDS: CardConfig[] = [
  // Far, top-right: drifts down and right (against the flow), straightening.
  { item: 0, cx: 74, cy: 31, w: 32, wMaxSvh: 18, ratio: 1.28, z: 1, xStart: 0, xEnd: 6, yStart: 0, yEnd: 9, rotationStart: 6, rotationEnd: 2, scaleStart: 0.94, scaleEnd: 0.9 },
  // Upper-left: up and to the left, rolling a little further.
  { item: 1, cx: 33, cy: 37, w: 38, wMaxSvh: 21, ratio: 1.0, z: 2, xStart: 0, xEnd: -11, yStart: 0, yEnd: -7, rotationStart: -5, rotationEnd: -9, scaleStart: 1, scaleEnd: 0.94 },
  // Centre-right: up, slightly growing.
  { item: 2, cx: 69, cy: 50, w: 44, wMaxSvh: 24, ratio: 1.3, z: 4, xStart: 0, xEnd: 3, yStart: 0, yEnd: -16, rotationStart: 4, rotationEnd: -2, scaleStart: 1, scaleEnd: 1.05 },
  // Centre-left: up, rotating the other way.
  { item: 3, cx: 30, cy: 62, w: 44, wMaxSvh: 25, ratio: 1.16, z: 5, xStart: 0, xEnd: -4, yStart: 0, yEnd: -15, rotationStart: -3, rotationEnd: 4, scaleStart: 1, scaleEnd: 1.07 },
  // Lower-right, in front: sweeps left (mostly horizontal) as it rises.
  { item: 0, cx: 66, cy: 78, w: 50, wMaxSvh: 28, ratio: 0.92, z: 7, xStart: 0, xEnd: -18, yStart: 0, yEnd: -20, rotationStart: -2, rotationEnd: -6, scaleStart: 1, scaleEnd: 1.03 },
  // Bottom-left, half in view: diagonal up-right, growing.
  { item: 1, cx: 22, cy: 91, w: 38, wMaxSvh: 22, ratio: 1.3, z: 6, xStart: 0, xEnd: 14, yStart: 0, yEnd: -21, rotationStart: 7, rotationEnd: 1, scaleStart: 0.96, scaleEnd: 1.06 },
  // Just below the screen, nearest: enters from the bottom-right, heading
  // up-left.
  { item: 2, cx: 80, cy: 106, w: 42, wMaxSvh: 24, ratio: 1.1, z: 8, xStart: 0, xEnd: -14, yStart: 0, yEnd: -26, rotationStart: -6, rotationEnd: -1, scaleStart: 1, scaleEnd: 1.02 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Gentle ease at both ends so the movement starts and settles softly while
// staying locked to the scroll position.
const ease = (t: number) => t * t * (3 - 2 * t);

interface Props {
  items: StackItem[];
  onOpen: (index: number) => void;
}

export function CaseStudiesMobile({ items, onOpen }: Props) {
  const reduced = usePrefersReducedMotion();
  const section = useRef<HTMLElement>(null);
  const cardEls = useRef<(HTMLButtonElement | null)[]>([]);

  // One scroll-progress controller for the whole section: a single passive
  // scroll listener on the page's scroller, applied in requestAnimationFrame.
  useEffect(() => {
    const sec = section.current;
    const scroller = sec?.closest<HTMLElement>(".page");
    if (!sec || !scroller) return;

    let W = 0;
    let H = 0;
    let start = 0;
    let distance = 1;
    let raf = 0;

    // Layout reads happen only on resize (never while scrolling).
    const measure = () => {
      W = window.innerWidth;
      H = scroller.clientHeight;
      start = sec.offsetTop;
      distance = Math.max(1, sec.offsetHeight - H);
    };

    const apply = () => {
      raf = 0;
      const p = reduced ? 0 : ease(clamp01((scroller.scrollTop - start) / distance));
      CARDS.forEach((c, i) => {
        const el = cardEls.current[i];
        if (!el) return;
        const x = (lerp(c.xStart, c.xEnd, p) * W) / 100;
        const y = (lerp(c.yStart, c.yEnd, p) * H) / 100;
        const r = lerp(c.rotationStart, c.rotationEnd, p);
        const s = lerp(c.scaleStart, c.scaleEnd, p);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onResize = () => {
      measure();
      schedule();
    };

    measure();
    apply();
    scroller.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      scroller.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <>
      <section ref={section} className={`csm ${reduced ? "csm--still" : ""}`} aria-label="Case studies">
        <div className="csm-sticky">
          <div className="csm-head">
            <PageTitle>Case Studies</PageTitle>
          </div>
          {CARDS.map((c, i) => {
            const item = items[c.item % items.length];
            return (
              <button
                key={i}
                ref={(el) => {
                  cardEls.current[i] = el;
                }}
                type="button"
                className="csm-card"
                aria-label={item.title}
                // Repeated photos are decorative duplicates for screen readers.
                tabIndex={i < items.length ? 0 : -1}
                aria-hidden={i < items.length ? undefined : true}
                onClick={() => onOpen(c.item % items.length)}
                style={
                  {
                    left: `${c.cx}%`,
                    top: `${c.cy}%`,
                    zIndex: c.z,
                    "--w": `min(${c.w}vw, ${c.wMaxSvh}svh)`,
                    "--r": c.ratio,
                    transform: `rotate(${c.rotationStart}deg) scale(${c.scaleStart})`,
                  } as React.CSSProperties
                }
              >
                <img src={item.image} alt="" draggable={false} />
              </button>
            );
          })}
        </div>
      </section>

      {/* The next section, in normal flow: every study by name. */}
      <section className="csm-index" aria-label="All case studies">
        <ol>
          {items.map((it, i) => (
            <li key={it.title}>
              <button type="button" onClick={() => onOpen(i)}>
                <span className="csm-index-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="csm-index-name">{it.title}</span>
                {it.meta && <span className="csm-index-meta">{it.meta}</span>}
              </button>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
