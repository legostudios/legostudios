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
// at the bottom. Grab and throw them; the pointer itself also bumps words
// it passes through.
export function GravityWords({ words }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = stage.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0022 } });
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
      const w = el.offsetWidth;
      const h = el.offsetHeight * 0.78;
      const x = rand(w / 2 + 10, Math.max(w / 2 + 11, W - w / 2 - 10));
      const y = reduced ? rand(H * 0.45, H * 0.85) : -h - i * h * 1.35;
      const b = Bodies.rectangle(x, y, w, h, {
        angle: 0,
        restitution: 0.25,
        friction: 0.5,
        frictionAir: 0.012,
        density: 0.0016,
        chamfer: { radius: Math.min(8, h / 4) },
      });
      // Words stay level: they fall straight down and stack flat, and keep
      // level when dragged or thrown.
      Body.setInertia(b, Infinity);
      (b as Matter.Body & { wordIndex: number }).wordIndex = i;
      bodies.push(b);
    });
    Composite.add(world, bodies);

    // Pointer: drag to grab/throw; an invisible round "bumper" follows the
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
    const bumper = Bodies.circle(-1000, -1000, 26, { isStatic: true, render: { visible: false } });
    Composite.add(world, bumper);
    let pointerIn = false;
    const onEnter = () => (pointerIn = true);
    const onLeave = () => {
      pointerIn = false;
      Body.setPosition(bumper, { x: -1000, y: -1000 });
    };
    root.addEventListener("pointerenter", onEnter);
    // The pointer may already be over the page when it opens (no enter event).
    root.addEventListener("pointermove", onEnter);
    root.addEventListener("pointerleave", onLeave);

    Events.on(grab, "startdrag", () => root.classList.add("is-grabbing"));
    Events.on(grab, "enddrag", () => root.classList.remove("is-grabbing"));

    // Simulation + DOM update loop.
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (pointerIn && !grab.body) {
        const prev = { ...bumper.position };
        const p = mouse.position;
        Body.setPosition(bumper, p);
        Body.setVelocity(bumper, { x: p.x - prev.x, y: p.y - prev.y });
      } else if (grab.body) {
        Body.setPosition(bumper, { x: -1000, y: -1000 });
      }
      Engine.update(engine, dt);
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
