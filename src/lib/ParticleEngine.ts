// A from-scratch canvas particle field tuned for a calm, premium feel: a still
// dust cloud that parts softly around the cursor and drifts back on springs.
//
// Design notes:
// - One <canvas>, no DOM particles, one requestAnimationFrame loop.
// - Physics, interaction and rendering are separated into their own methods.
// - No spatial grid: every frame already visits all particles for spring +
//   idle + render (unavoidably O(n)), so the mouse test rides along in that
//   same pass — a grid would add complexity without removing that O(n) cost.
// - Motion is integrated with real dt (normalized to 60fps) so it behaves the
//   same on 60/120Hz displays.

export interface ParticleConfig {
  /** Fixed particle count, or "auto" to scale with device capability. */
  count: number | "auto";
  /** Cursor field radius in CSS px — force fades smoothly to zero at the edge. */
  interactionRadius: number;
  /** Peak push acceleration applied right at the cursor. */
  mouseForce: number;
  /** Particle radius range in CSS px (≈ 0.5–1.5 → 1–3px diameter). */
  size: [number, number];
  /** Per-particle opacity range. */
  opacity: [number, number];
  /** "r, g, b" of the particle colour. */
  color: string;
  /** Spring stiffness pulling each particle back to its origin. */
  spring: number;
  /** Velocity retained per 60fps-frame (higher = floatier). */
  damping: number;
  /** Amplitude of the never-ending idle drift, in CSS px. */
  idleAmplitude: number;
  /** Speed of the idle drift (low frequency). */
  idleSpeed: number;
}

export const DEFAULT_CONFIG: ParticleConfig = {
  count: "auto",
  interactionRadius: 150,
  mouseForce: 2.4,
  size: [0.5, 1.6],
  opacity: [0.22, 0.72],
  color: "175, 178, 186",
  spring: 0.045,
  damping: 0.86,
  idleAmplitude: 1.5,
  idleSpeed: 0.32,
};

interface Particle {
  ox: number; // origin
  oy: number;
  x: number; // current position
  y: number;
  vx: number; // velocity
  vy: number;
  r: number; // radius
  o: number; // opacity
  // Independent low-frequency idle drift (per-particle phase + frequency so no
  // two particles ever move in sync).
  fx: number;
  fy: number;
  px: number;
  py: number;
}

const TAU = Math.PI * 2;
const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class ParticleEngine {
  private ctx: CanvasRenderingContext2D;
  private cfg: ParticleConfig;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;

  private mouse = { x: 0, y: 0, active: false };
  private raf = 0;
  private running = false;
  private lastTime = 0;
  private time = 0;
  private reducedMotion = false;

  private ro?: ResizeObserver;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, config: Partial<ParticleConfig> = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.cfg = { ...DEFAULT_CONFIG, ...config };

    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.tick = this.tick.bind(this);
  }

  start() {
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);

    window.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerout", this.onPointerLeave, {
      passive: true,
    });
    window.addEventListener("blur", this.onPointerLeave);
    document.addEventListener("visibilitychange", this.onVisibility);

    if (this.reducedMotion) {
      // Respect the preference: draw a single static field, no loop.
      this.render();
    } else {
      this.play();
    }
  }

  destroy() {
    this.pause();
    this.ro?.disconnect();
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerout", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  // ── loop control ─────────────────────────────────────────────────────────
  private play() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private onVisibility() {
    if (document.hidden) this.pause();
    else if (!this.reducedMotion) this.play();
  }

  // ── sizing / particle generation ─────────────────────────────────────────
  private resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;

    this.width = w;
    this.height = h;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // cap for perf

    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.generate();
    if (this.reducedMotion) this.render();
  }

  private resolveCount(): number {
    if (typeof this.cfg.count === "number") return this.cfg.count;

    // Scale with viewport tier, then trim on low-core devices.
    const w = window.innerWidth;
    let base = w <= 640 ? 380 : w <= 1024 ? 850 : 1400;
    const cores = navigator.hardwareConcurrency || 4;
    if (cores <= 4) base *= 0.75;
    return Math.round(base);
  }

  private generate() {
    const count = this.resolveCount();
    const { size, opacity, idleSpeed } = this.cfg;

    // Jittered grid: even coverage (no clumps or bald spots) but scattered
    // enough that no grid is ever perceptible.
    const cell = Math.sqrt((this.width * this.height) / count);
    const cols = Math.max(1, Math.ceil(this.width / cell));
    const rows = Math.max(1, Math.ceil(this.height / cell));
    const jitter = 0.75; // ± fraction of a cell

    const next: Particle[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col + 0.5 + rand(-jitter, jitter)) * cell;
        const y = (row + 0.5 + rand(-jitter, jitter)) * cell;
        if (x < 0 || x > this.width || y < 0 || y > this.height) continue;
        next.push({
          ox: x,
          oy: y,
          x,
          y,
          vx: 0,
          vy: 0,
          r: rand(size[0], size[1]),
          o: rand(opacity[0], opacity[1]),
          fx: rand(0.6, 1.4) * idleSpeed,
          fy: rand(0.6, 1.4) * idleSpeed,
          px: rand(0, TAU),
          py: rand(0, TAU),
        });
      }
    }
    this.particles = next;
  }

  // ── interaction ──────────────────────────────────────────────────────────
  private onPointerMove(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    this.mouse.active = true;
  }

  private onPointerLeave() {
    // Field switches off; springs quietly draw everything home.
    this.mouse.active = false;
  }

  // ── frame ────────────────────────────────────────────────────────────────
  private tick(now: number) {
    if (!this.running) return;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.05) dt = 0.05; // clamp after a stall/tab switch
    this.time += dt;

    this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  }

  private update(dt: number) {
    const {
      spring,
      damping,
      mouseForce,
      interactionRadius,
      idleAmplitude,
    } = this.cfg;

    const f = dt * 60; // normalize forces/integration to a 60fps baseline
    const damp = Math.pow(damping, f); // exponential decay is dt-correct
    const R2 = interactionRadius * interactionRadius;
    const mx = this.mouse.x;
    const my = this.mouse.y;
    const active = this.mouse.active;
    const t = this.time;

    for (const p of this.particles) {
      // 1. Mouse force — a soft field that grows toward the cursor and fades
      //    to nothing at the radius (no hard edge).
      if (active) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const falloff = 1 - d / interactionRadius; // 0..1
          const push = mouseForce * falloff * falloff * f;
          p.vx += (dx / d) * push;
          p.vy += (dy / d) * push;
        }
      }

      // 2. Spring back toward the origin, offset by an endless idle drift so
      //    the field is alive even when the cursor is still.
      const tx = p.ox + Math.sin(t * p.fx + p.px) * idleAmplitude;
      const ty = p.oy + Math.cos(t * p.fy + p.py) * idleAmplitude;
      p.vx += (tx - p.x) * spring * f;
      p.vy += (ty - p.y) * spring * f;

      // 3. Damping (well-damped so there is no bounce or overshoot).
      p.vx *= damp;
      p.vy *= damp;

      // 4. Integrate.
      p.x += p.vx * f;
      p.y += p.vy * f;
    }
  }

  private render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = `rgb(${this.cfg.color})`;
    for (const p of this.particles) {
      ctx.globalAlpha = p.o;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
