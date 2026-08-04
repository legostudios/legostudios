import { useEffect, useRef } from "react";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

// ---- data ------------------------------------------------------------------

const LABELS = [
  "oil lamp", "oats", "pants", "plane", "plant 003", "pomelo", "phisher",
  "palo alto", "pencile", "photos", "quiet", "queen", "questions", "quizz",
  "quit", "raccoon", "river", "rizz", "rum", "generic guy", "rain", "rug",
  "ruby", "sider", "sony", "sun", "seller", "sims", "slides", "simpsons", "sir",
];

interface Card {
  num: number;
  label: string;
  side: "left" | "right";
  img: string;
  divider?: [string, string];
}

const DIVIDERS: Record<number, [string, string]> = {
  2: ["O", "010"],
  10: ["P", "012"],
  14: ["Q", "005"],
  22: ["R", "002"],
  30: ["S", "002"],
};

const CARDS: Card[] = LABELS.map((label, i) => ({
  num: 94 + i,
  label,
  side: i % 2 === 0 ? "left" : "right",
  img: SHOWCASE_IMAGES[i % SHOWCASE_IMAGES.length],
  divider: DIVIDERS[i],
}));

const N = CARDS.length;

// ---- geometry (px) ---------------------------------------------------------

const TAB_H = 34; // revealed height of a collapsed folder (its tab strip)
const OPEN_H = 430; // total height of the active (open) folder
const ACTIVE_Y = 92; // where the active folder's tab sits in the viewport
const STEP = 280; // scroll distance (px) per card

// ---------------------------------------------------------------------------

// A scroll-driven filing drawer. Rendering (the folders) is static markup;
// animation is a scroll -> transform mapping applied imperatively each frame so
// nothing re-renders and everything stays locked to the scroll position.
export function FilingDrawer() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    let raf = 0;
    let queued = false;

    const apply = () => {
      queued = false;
      const idx = scroller.scrollTop / STEP; // fractional active index

      // Cumulative layout: each folder occupies TAB_H when closed, OPEN_H when
      // fully open, interpolated by how close it is to the active index.
      const ys: number[] = new Array(N);
      const es: number[] = new Array(N);
      let y = 0;
      for (let i = 0; i < N; i++) {
        const e = Math.max(0, 1 - Math.abs(i - idx));
        es[i] = e;
        ys[i] = y;
        y += TAB_H + e * (OPEN_H - TAB_H);
      }

      // Translate the whole stack so the active card's tab stays at ACTIVE_Y.
      const fl = Math.min(Math.floor(idx), N - 1);
      const fr = idx - Math.floor(idx);
      const gapFl = TAB_H + es[fl] * (OPEN_H - TAB_H);
      const yRef = ys[fl] + fr * gapFl;
      const shift = ACTIVE_Y - yRef;

      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (el) el.style.transform = `translate3d(0, ${(ys[i] + shift).toFixed(2)}px, 0)`;
        const c = contentRefs.current[i];
        if (c) c.style.opacity = es[i].toFixed(3);
      }
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(apply);
    };

    apply();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", apply);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", apply);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ fontFamily: HELV }}
    >
      {/* Spacer that provides the scroll distance. */}
      <div style={{ height: `calc(100vh + ${(N - 1) * STEP}px)` }}>
        {/* Sticky viewport that the folders are drawn into. */}
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="relative mx-auto h-full w-[min(660px,92vw)]">
            {CARDS.map((card, i) => (
              <div
                key={card.num}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute left-0 top-0 w-full will-change-transform"
                style={{ height: OPEN_H, zIndex: i }}
              >
                <div className="relative h-full rounded-t-[26px] border border-black bg-white">
                  {/* Tab: number + label, left or right. */}
                  <div
                    className={`absolute top-[9px] flex items-center gap-4 text-[13px] leading-none text-black ${
                      card.side === "left" ? "left-[15%]" : "right-[15%]"
                    }`}
                  >
                    <span className="tabular-nums">{card.num}</span>
                    <span>{card.label}</span>
                  </div>

                  {/* Section divider tab. */}
                  {card.divider && (
                    <div className="absolute left-[7%] top-[-2px] z-10 flex items-center gap-6 rounded-t-[14px] border border-black bg-black px-4 py-[4px] text-[11px] leading-none text-white">
                      <span>{card.divider[0]}</span>
                      <span className="tabular-nums">{card.divider[1]}</span>
                    </div>
                  )}

                  {/* Content — revealed only while the folder is open. */}
                  <div
                    ref={(el) => {
                      contentRefs.current[i] = el;
                    }}
                    className="absolute inset-x-0 top-[44px] bottom-0 px-8 opacity-0"
                  >
                    <div className="text-[13px] leading-tight text-black">
                      {card.label}
                      <br />
                      <span className="text-black/40">details</span>
                    </div>
                    <div className="absolute inset-x-8 top-[42px] bottom-2 overflow-hidden">
                      <img
                        src={card.img}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        className="mx-auto h-full w-auto max-w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Drawer front lip — folders slide behind it. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[55]">
              <div className="h-px w-full bg-black" />
              <svg
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                className="block h-10 w-full"
                aria-hidden="true"
              >
                <polygon
                  points="4,0 96,0 100,10 0,10"
                  fill="#ffffff"
                  stroke="black"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* Yellow title tab. */}
            <div className="absolute bottom-[10px] left-1/2 z-[65] -translate-x-1/2 rounded-[7px] border border-black bg-[#efe94b] px-6 py-[7px] text-[13px] leading-none text-black">
              sam&apos;s secret files
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
