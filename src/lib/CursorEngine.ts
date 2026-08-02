// A custom cursor that glides toward the mouse on a spring rather than snapping
// to it. One fixed DOM element, one requestAnimationFrame loop, GPU transforms
// only (translate3d). No CSS transitions, no timers.

export interface CursorConfig {
  /** Diameter in px at rest. */
  size: number;
  /** "r, g, b" fill. Paired with mix-blend-mode it auto-contrasts on any bg. */
  color: string;
  /** CSS mix-blend-mode ("difference" inverts against whatever is behind). */
  blend: string;
  /** Follow rate (1/s). Higher = tighter with less trail; never overshoots. */
  smoothing: number;
  /** Scale multiplier while over an interactive element. */
  hoverScale: number;
  /** What counts as "interactive". */
  hoverSelector: string;
}

export const DEFAULT_CURSOR: CursorConfig = {
  size: 16,
  color: "255, 255, 255",
  blend: "difference",
  smoothing: 20,
  hoverScale: 2.3,
  hoverSelector: 'a, button, [role="button"], input, textarea, select, [data-cursor-hover]',
};

export class CursorEngine {
  private el: HTMLElement;
  private cfg: CursorConfig;

  private target = { x: -100, y: -100 };
  private pos = { x: -100, y: -100 };
  private scale = 0; // starts hidden, eases up on first move
  private targetScale = 1;

  private raf = 0;
  private running = false;
  private last = 0;
  private seen = false;

  constructor(el: HTMLElement, config: Partial<CursorConfig> = {}) {
    this.el = el;
    this.cfg = { ...DEFAULT_CURSOR, ...config };

    const s = this.cfg.size;
    Object.assign(el.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: `${s}px`,
      height: `${s}px`,
      // Offset by half so translate3d positions the element's CENTRE.
      marginLeft: `${-s / 2}px`,
      marginTop: `${-s / 2}px`,
      borderRadius: "50%",
      backgroundColor: `rgb(${this.cfg.color})`,
      mixBlendMode: this.cfg.blend,
      pointerEvents: "none",
      zIndex: "2147483647",
      willChange: "transform",
      transform: "translate3d(-100px, -100px, 0) scale(0)",
    } as Partial<CSSStyleDeclaration>);

    this.onMove = this.onMove.bind(this);
    this.onOver = this.onOver.bind(this);
    this.tick = this.tick.bind(this);
  }

  start() {
    document.documentElement.classList.add("cursor-none");
    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerover", this.onOver, { passive: true });
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.documentElement.classList.remove("cursor-none");
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerover", this.onOver);
  }

  private onMove(e: PointerEvent) {
    this.target.x = e.clientX;
    this.target.y = e.clientY;
    if (!this.seen) {
      // Drop it exactly on the cursor the first time so it doesn't fly in.
      this.seen = true;
      this.pos.x = e.clientX;
      this.pos.y = e.clientY;
    }
  }

  private onOver(e: PointerEvent) {
    const t = e.target as Element | null;
    const interactive = !!t && !!t.closest?.(this.cfg.hoverSelector);
    this.targetScale = interactive ? this.cfg.hoverScale : 1;
  }

  private tick(now: number) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.05) dt = 0.05;

    // Exponential smoothing — critically damped. The cursor decelerates into
    // the target and settles; it can never overshoot, rebound or oscillate.
    // Frame-rate independent, so it behaves the same at 60/120Hz.
    const k = 1 - Math.exp(-this.cfg.smoothing * dt);
    const dx = this.target.x - this.pos.x;
    const dy = this.target.y - this.pos.y;
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
      // Snap the last sub-pixel so it stops exactly where the mouse stopped.
      this.pos.x = this.target.x;
      this.pos.y = this.target.y;
    } else {
      this.pos.x += dx * k;
      this.pos.y += dy * k;
    }

    // Same easing for the intro/hover scale (no CSS transition).
    const goal = this.seen ? this.targetScale : 0;
    this.scale += (goal - this.scale) * (1 - Math.exp(-18 * dt));

    this.el.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0) scale(${this.scale})`;
    this.raf = requestAnimationFrame(this.tick);
  }
}
