import { useEffect, useRef } from "react";
import Matter from "matter-js";

export interface GravityWord {
  text: string;
  /** Which phrase the word belongs to (e.g. the full service name). */
  group: string;
  /** Optional accent colour for the word. */
  color?: string;
}

interface Props {
  words: GravityWord[];
}

const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// Words that drop in under gravity, falling straight down and stacking flat
// at the bottom. Grab and throw them; the pointer playfully knocks words it
// passes (once pushed, a word is free to tumble).
export function GravityWords({ words }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = stage.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = Engine.create({
      gravity: { x: 0, y: 1, scale: 0.0022 },
      // Stricter contact solving so stacked words never sink into each other.
      positionIterations: 24,
      velocityIterations: 16,
    });
    const world = engine.world;

    let W = root.clientWidth;
    let H = root.clientHeight;

    // Walls: floor and sides (a ceiling far above lets thrown words come back).
    const T = 400;
    const walls = [
      Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true }),
      Bodies.rectangle(-T / 2, H / 2 - H, T, H * 4, { isStatic: true }),
      Bodies.rectangle(W + T / 2, H / 2 - H, T, H * 4, { isStatic: true }),
      Bodies.rectangle(W / 2, -H * 1.5 - T / 2, W * 3, T, { isStatic: true }),
    ];
    Composite.add(world, walls);

    // One body per word, sized from its rendered box, dropped in from above
    // at random positions and angles, a few at a time.
    const bodies: Matter.Body[] = [];
    words.forEach((_, i) => {
      const el = els.current[i];
      if (!el) return;
      // Collision box hugs the capitals (plus a hair of space), so words rest
      // right on top of each other without their letters touching.
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const w = el.offsetWidth + fs * 0.12;
      const h = fs * 0.84;
      const x = rand(w / 2 + 10, Math.max(w / 2 + 11, W - w / 2 - 10));
      const y = reduced ? rand(H * 0.45, H * 0.85) : -h - i * h * 1.35;
      const b = Bodies.rectangle(x, y, w, h, {
        angle: 0,
        restitution: 0,
        friction: 0.8,
        frictionStatic: 1,
        frictionAir: 0.012,
        density: 0.0016,
        chamfer: { radius: Math.min(4, h / 8) },
        slop: 0.01,
      });
      // Words fall straight down and stack flat (no rotation) until the
      // pointer first pushes them; then they're free to tumble.
      (b as Matter.Body & { freeInertia: number }).freeInertia = b.inertia * 3;
      Body.setInertia(b, Infinity);
      (b as Matter.Body & { wordIndex: number }).wordIndex = i;
      bodies.push(b);
    });
    Composite.add(world, bodies);

    // Pointer: drag to grab and throw (a soft push is applied in the loop).
    // pointer so passing over words nudges them.
    const mouse = Mouse.create(root);
    // Matter adds wheel listeners that block scrolling; we don't need them.
    const m = mouse as unknown as { element: HTMLElement; mousewheel: EventListener };
    m.element.removeEventListener("wheel", m.mousewheel);
    m.element.removeEventListener("mousewheel", m.mousewheel);
    m.element.removeEventListener("DOMMouseScroll", m.mousewheel);
    const grab = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, damping: 0.1, render: { visible: false } },
    });
    Composite.add(world, grab);
    let pointerIn = false;
    const onEnter = () => (pointerIn = true);
    const onLeave = () => {
      pointerIn = false;
    };
    root.addEventListener("pointerenter", onEnter);
    // The pointer may already be over the page when it opens (no enter event).
    root.addEventListener("pointermove", onEnter);
    root.addEventListener("pointerleave", onLeave);

    // Let go of a dragged word when the button is released anywhere, even
    // outside the page/window (Matter only listens on the stage, so otherwise
    // the word stays stuck to the cursor).
    const release = () => {
      (mouse as unknown as { button: number }).button = -1;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("mouseup", release);
    window.addEventListener("blur", release);

    Events.on(grab, "startdrag", () => root.classList.add("is-grabbing"));
    Events.on(grab, "enddrag", () => root.classList.remove("is-grabbing"));

    // Simulation + DOM update loop.
    let raf = 0;
    let last = performance.now();
    let lastPointer = { x: -1000, y: -1000 };
    const loop = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      // The pointer gently pushes nearby words away (and a little up). A
      // force, not a collision body, so words are never forced into each
      // other.
      if (pointerIn && !grab.body) {
        const p = mouse.position;
        const v = { x: p.x - lastPointer.x, y: p.y - lastPointer.y };
        const speed = Math.min(40, Math.hypot(v.x, v.y));
        for (const b of bodies) {
          const bb = b.bounds;
          // Distance from the pointer to the word's box.
          const dx = Math.max(bb.min.x - p.x, 0, p.x - bb.max.x);
          const dy = Math.max(bb.min.y - p.y, 0, p.y - bb.max.y);
          const d = Math.hypot(dx, dy);
          if (d < 50 && speed > 0.5) {
            // Release the word so it can tumble, with a little random spin.
            const fb = b as Matter.Body & { freeInertia: number };
            if (b.inertia === Infinity) {
              Body.setInertia(b, fb.freeInertia);
              Body.setAngularVelocity(b, rand(-0.06, 0.06));
            }
            const k = (1 - d / 50) * speed * 0.00009 * b.mass;
            const sx = Math.sign(b.position.x - p.x) || Math.sign(v.x) || 1;
            // Away from the pointer, along its motion, upward, plus a random
            // kick, applied off-centre so the word spins.
            Body.applyForce(
              b,
              { x: b.position.x + rand(-0.3, 0.3) * (bb.max.x - bb.min.x), y: b.position.y },
              { x: sx * k * 1.8 + v.x * k * 0.08 + rand(-1, 1) * k, y: -k * (1.6 + Math.random()) },
            );
          }
        }
      }
      lastPointer = { ...mouse.position };
      Engine.update(engine, dt);
      // Never let a word end up inside the floor or past the side walls (a
      // hard drag can push one through). A word stuck below the screen edge
      // would be invisible and leave the words above it floating.
      for (const b of bodies) {
        const bb = b.bounds;
        let dx = 0;
        let dy = 0;
        if (bb.max.y > H) dy = H - bb.max.y;
        if (bb.min.x < 0) dx = -bb.min.x;
        else if (bb.max.x > W) dx = W - bb.max.x;
        if (dx || dy) {
          Body.setPosition(b, { x: b.position.x + dx, y: b.position.y + dy });
          Body.setVelocity(b, {
            x: dx ? 0 : b.velocity.x,
            y: dy ? Math.min(0, b.velocity.y) : b.velocity.y,
          });
        }
      }
      for (const b of bodies) {
        const el = els.current[(b as Matter.Body & { wordIndex: number }).wordIndex];
        if (el) el.style.transform = `translate(${b.position.x}px, ${b.position.y}px) translate(-50%, -50%) rotate(${b.angle}rad)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Keep the walls at the screen edges when the window changes size.
    const onResize = () => {
      const nW = root.clientWidth;
      const nH = root.clientHeight;
      Body.setPosition(walls[0], { x: nW / 2, y: nH + T / 2 });
      Body.setPosition(walls[1], { x: -T / 2, y: nH / 2 - nH });
      Body.setPosition(walls[2], { x: nW + T / 2, y: nH / 2 - nH });
      for (const b of bodies) {
        if (b.position.x > nW - 20) Body.setPosition(b, { x: nW - 40, y: b.position.y });
        if (b.position.y > nH - 10) Body.setPosition(b, { x: b.position.x, y: nH - 40 });
      }
      W = nW;
      H = nH;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("blur", release);
      Events.off(grab, "startdrag");
      Events.off(grab, "enddrag");
      Mouse.clearSourceEvents(mouse);
      Composite.clear(world, false);
      Engine.clear(engine);
    };
  }, [words]);

  return (
    <>
      <div ref={stage} className="gravity-stage">
        {words.map((w, i) => (
          <span
            key={i}
            ref={(el) => {
              els.current[i] = el;
            }}
            className="gravity-word"
            style={w.color ? { color: w.color } : undefined}
          >
            {w.text}
          </span>
        ))}
      </div>
    </>
  );
}
