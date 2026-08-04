import { useEffect, useRef } from "react";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";

const FONT = 'Helvetica, "Helvetica Neue", Arial, sans-serif';

// ---- data ------------------------------------------------------------------

const LABELS = [
  "oil lamp", "oats", "pants", "plane", "plant 003", "pomelo", "phisher",
  "palo alto", "pencile", "photos", "quiet", "queen", "questions", "quizz",
  "quit", "raccoon", "river", "rizz", "rum", "generic guy", "rain", "rug",
  "ruby", "sider", "sony", "sun", "seller", "sims", "slides", "simpsons", "sir",
];

const DIVIDERS: Record<number, [string, string]> = {
  2: ["O", "010"],
  10: ["P", "012"],
  14: ["Q", "005"],
  22: ["R", "002"],
  30: ["S", "002"],
};

interface Card {
  num: number;
  label: string;
  side: "left" | "right";
  img: string;
  divider?: [string, string];
}

const CARDS: Card[] = LABELS.map((label, i) => ({
  num: 94 + i,
  label,
  side: i % 2 === 0 ? "left" : "right",
  img: SHOWCASE_IMAGES[i % SHOWCASE_IMAGES.length],
  divider: DIVIDERS[i],
}));

const N = CARDS.length;

// ---- geometry --------------------------------------------------------------

const TAB_H = 36; // revealed tab height of a closed folder
const OPEN_H = 452; // total height of the active (open) folder
const ACTIVE_Y = 96; // screen-y where the active folder's tab sits
const STEP = 300; // scroll distance per card (px)
const LIP_H = 46; // drawer front lip height
const CORNER = 15; // folder top corner radius

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

// A scroll-driven filing drawer rendered on canvas. Every folder is drawn as a
// trapezoid slice so the stack forms a real perspective drawer; the active
// folder opens (linearly with scroll) to reveal a photo + "label / details".
export function FilingDrawer() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scroller = scrollRef.current;
    const canvas = canvasRef.current;
    if (!scroller || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Preload photos.
    const imgs = CARDS.map((c) => {
      const im = new Image();
      im.src = c.img;
      im.onload = () => schedule();
      return im;
    });

    let W = 0;
    let H = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    // Perspective: half-width of the drawer at a given screen-y.
    const geomFor = () => {
      const DW = Math.min(760, W * 0.94);
      const cx = W / 2;
      const yBottom = H - LIP_H;
      const halfW = (y: number) => {
        const t = clamp01(y / yBottom);
        return lerp(DW * 0.205, DW * 0.5, t);
      };
      return { cx, yBottom, halfW };
    };

    // Trace a folder outline: a trapezoid from yTop down to yBottom whose left
    // and right edges follow the drawer perspective, with a rounded top.
    const folderPath = (
      yTop: number,
      yBot: number,
      cx: number,
      halfW: (y: number) => number,
    ) => {
      const lT = cx - halfW(yTop);
      const rT = cx + halfW(yTop);
      const lB = cx - halfW(yBot);
      const rB = cx + halfW(yBot);
      const r = CORNER;
      ctx.beginPath();
      ctx.moveTo(lT + r, yTop);
      ctx.lineTo(rT - r, yTop);
      ctx.quadraticCurveTo(rT, yTop, rT, yTop + r);
      ctx.lineTo(rB, yBot);
      ctx.lineTo(lB, yBot);
      ctx.lineTo(lT, yTop + r);
      ctx.quadraticCurveTo(lT, yTop, lT + r, yTop);
      ctx.closePath();
    };

    const draw = () => {
      if (!W || !H) return;
      const { cx, yBottom, halfW } = geomFor();
      const idx = scroller.scrollTop / STEP;

      // Cumulative vertical layout (closed = TAB_H, open = OPEN_H).
      const ys = new Array<number>(N);
      const es = new Array<number>(N);
      let y = 0;
      for (let i = 0; i < N; i++) {
        const e = clamp01(1 - Math.abs(i - idx));
        es[i] = e;
        ys[i] = y;
        y += TAB_H + e * (OPEN_H - TAB_H);
      }
      const fl = Math.min(Math.floor(idx), N - 1);
      const gapFl = TAB_H + es[fl] * (OPEN_H - TAB_H);
      const yRef = ys[fl] + (idx - Math.floor(idx)) * gapFl;
      const shift = ACTIVE_Y - yRef;

      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = "round";

      for (let i = 0; i < N; i++) {
        const card = CARDS[i];
        const yTop = ys[i] + shift;
        if (yTop > yBottom) continue; // below the drawer
        const nextTop = i < N - 1 ? ys[i + 1] + shift : yBottom;
        if (nextTop < -4) continue; // fully scrolled off the top

        // Fill + stroke the folder down to the drawer bottom.
        folderPath(yTop, yBottom + 2, cx, halfW);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 1;
        ctx.stroke();

        const wTop = halfW(yTop) * 2;
        const lT = cx - halfW(yTop);

        // Active content — clipped to the folder shape, faded by openness.
        if (es[i] > 0.02) {
          ctx.save();
          folderPath(yTop, yBottom + 2, cx, halfW);
          ctx.clip();
          ctx.globalAlpha = es[i];

          const padX = wTop * 0.07 + 18;
          const titleX = lT + padX;
          const titleY = yTop + TAB_H + 22;
          ctx.fillStyle = "#111111";
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.font = `13px ${FONT}`;
          ctx.fillText(card.label, titleX, titleY);
          ctx.fillStyle = "rgba(17,17,17,0.4)";
          ctx.fillText("details", titleX, titleY + 17);

          // Photo, object-contain in the open area below the title.
          const im = imgs[i];
          if (im.complete && im.naturalWidth > 0) {
            const boxTop = titleY + 30;
            const boxBot = yTop + OPEN_H - 16;
            const midY = (boxTop + boxBot) / 2;
            const availLeft = cx - halfW(midY) + padX;
            const availRight = cx + halfW(midY) - padX;
            const boxW = availRight - availLeft;
            const boxH = boxBot - boxTop;
            if (boxH > 20 && boxW > 20) {
              const scale = Math.min(boxW / im.naturalWidth, boxH / im.naturalHeight);
              const dw = im.naturalWidth * scale;
              const dh = im.naturalHeight * scale;
              ctx.drawImage(im, cx - dw / 2, boxTop, dw, dh);
            }
          }
          ctx.restore();
        }

        // Divider (black tab) on the left.
        if (card.divider) {
          const dx1 = lT + wTop * 0.1;
          const dw = wTop * 0.3;
          const dTop = yTop - 1;
          const dBot = yTop + TAB_H - 7;
          const r = 11;
          ctx.beginPath();
          ctx.moveTo(dx1 + r, dTop);
          ctx.lineTo(dx1 + dw - r, dTop);
          ctx.quadraticCurveTo(dx1 + dw, dTop, dx1 + dw + 3, dTop + r);
          ctx.lineTo(dx1 + dw + 6, dBot);
          ctx.lineTo(dx1 - 6, dBot);
          ctx.lineTo(dx1 - 3, dTop + r);
          ctx.quadraticCurveTo(dx1, dTop, dx1 + r, dTop);
          ctx.closePath();
          ctx.fillStyle = "#111111";
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.textBaseline = "middle";
          ctx.textAlign = "left";
          ctx.font = `11px ${FONT}`;
          ctx.fillText(card.divider[0], dx1 + 8, (dTop + dBot) / 2 + 1);
          ctx.textAlign = "right";
          ctx.fillText(card.divider[1], dx1 + dw - 4, (dTop + dBot) / 2 + 1);
        }

        // Number + label on the tab.
        ctx.fillStyle = "#111111";
        ctx.textBaseline = "middle";
        ctx.font = `13px ${FONT}`;
        const cy = yTop + TAB_H / 2 + 0.5;
        let nx: number;
        let tx: number;
        if (card.side === "left") {
          nx = lT + wTop * 0.28;
          tx = lT + wTop * 0.42;
        } else {
          nx = lT + wTop * 0.58;
          tx = lT + wTop * 0.72;
        }
        ctx.textAlign = "left";
        ctx.fillText(String(card.num), nx, cy);
        ctx.fillText(card.label, tx, cy);
      }

      // Drawer front lip.
      const lipTopHalf = halfW(yBottom);
      ctx.beginPath();
      ctx.moveTo(0, yBottom);
      ctx.lineTo(W, yBottom);
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - lipTopHalf, yBottom);
      ctx.lineTo(cx + lipTopHalf, yBottom);
      ctx.lineTo(cx + lipTopHalf + W * 0.06, H);
      ctx.lineTo(cx - lipTopHalf - W * 0.06, H);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.stroke();

      // Yellow title tab.
      const tabW = 168;
      const tabH = 30;
      const tabX = cx - tabW / 2;
      const tabY = H - tabH - 10;
      roundRect(ctx, tabX, tabY, tabW, tabH, 7);
      ctx.fillStyle = "#efe94b";
      ctx.fill();
      ctx.strokeStyle = "#111111";
      ctx.stroke();
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `13px ${FONT}`;
      ctx.fillText("sam's secret files", cx, tabY + tabH / 2 + 1);
    };

    let queued = false;
    let raf = 0;
    const schedule = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(() => {
        queued = false;
        draw();
      });
    };

    resize();
    scroller.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      scroller.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div style={{ height: `calc(100vh + ${(N - 1) * STEP}px)` }}>
        <div className="sticky top-0 h-screen">
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
