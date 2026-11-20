import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { usePresence } from "../hooks/usePresence";
import { Folder, type FolderTheme } from "./Folder";
import { BackIcon } from "./BackIcon";

export type PageId = "services" | "caseStudies" | "contact";

const FOLDERS: { label: string; id: PageId; theme: FolderTheme }[] = [
  { label: "services", id: "services", theme: "blue" },
  { label: "case studies", id: "caseStudies", theme: "orange" },
  { label: "contact", id: "contact", theme: "green" },
];

// Moving less than this (px) counts as a click, not a drag.
const DRAG_THRESHOLD = 6;
// Folders stop this far (px) from the screen edges.
const EDGE = 12;

type Offset = { x: number; y: number };
type Offsets = Partial<Record<PageId, Offset>>;

// Dragged positions last while the visitor moves around the site, and reset
// to the default layout on refresh (kept in memory only, never saved).
let sessionOffsets: Offsets = {};

// Clear positions that older versions saved in the browser.
try {
  window.localStorage.removeItem("lego-menu-folders");
  window.localStorage.removeItem("lego-menu-folders-v2");
} catch {
  /* storage unavailable — nothing to clear */
}

interface MenuProps {
  open: boolean;
  onOpenPage: (id: PageId) => void;
  onBack: () => void;
}

// Full-screen brand-pink menu: desktop-style folders (Services, Case Studies,
// Contact) that can be dragged anywhere on the screen. A short click opens a
// folder; a drag just moves it.
export function Menu({ open, onOpenPage, onBack }: MenuProps) {
  const { mounted, visible } = usePresence(open);
  const [offsets, setOffsets] = useState<Offsets>(() => sessionOffsets);
  // Stacking order: the last-touched folder sits on top.
  const [order, setOrder] = useState<PageId[]>(FOLDERS.map((f) => f.id));
  const [dragging, setDragging] = useState<PageId | null>(null);
  const els = useRef<Partial<Record<PageId, HTMLButtonElement | null>>>({});
  const drag = useRef<{
    id: PageId;
    pointer: number;
    startX: number;
    startY: number;
    origin: Offset;
    // How far the folder may move in each direction before leaving the screen.
    min: Offset;
    max: Offset;
    moved: boolean;
  } | null>(null);
  // Set when a drag just ended, so the click that follows doesn't open it.
  const suppressClick = useRef<PageId | null>(null);

  const offsetOf = useCallback((id: PageId) => offsets[id] ?? { x: 0, y: 0 }, [offsets]);

  // Keep folders on screen if the window shrinks (or remembered positions came
  // from a bigger screen).
  useEffect(() => {
    if (!mounted) return;
    const fit = () => {
      setOffsets((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const f of FOLDERS) {
          const el = els.current[f.id];
          const o = prev[f.id];
          if (!el || !o) continue;
          const r = el.getBoundingClientRect();
          let dx = 0;
          let dy = 0;
          if (r.left < EDGE) dx = EDGE - r.left;
          else if (r.right > window.innerWidth - EDGE) dx = window.innerWidth - EDGE - r.right;
          if (r.top < EDGE) dy = EDGE - r.top;
          else if (r.bottom > window.innerHeight - EDGE) dy = window.innerHeight - EDGE - r.bottom;
          if (dx || dy) {
            next[f.id] = { x: o.x + dx, y: o.y + dy };
            changed = true;
          }
        }
        if (changed) sessionOffsets = next;
        return changed ? next : prev;
      });
    };
    // First check once the rise-in animation has finished (mid-animation the
    // folders sit 24px low, which would wrongly nudge edge-parked ones up).
    const t = window.setTimeout(fit, 1100);
    window.addEventListener("resize", fit);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", fit);
    };
  }, [mounted]);

  const onPointerDown = (id: PageId) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const origin = offsetOf(id);
    drag.current = {
      id,
      pointer: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin,
      min: { x: origin.x - r.left + EDGE, y: origin.y - r.top + EDGE },
      max: {
        x: origin.x + (window.innerWidth - EDGE - r.right),
        y: origin.y + (window.innerHeight - EDGE - r.bottom),
      },
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
    setOrder((o) => [...o.filter((x) => x !== id), id]);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(d.id);
    }
    const x = Math.min(d.max.x, Math.max(d.min.x, d.origin.x + dx));
    const y = Math.min(d.max.y, Math.max(d.min.y, d.origin.y + dy));
    setOffsets((o) => ({ ...o, [d.id]: { x, y } }));
  };

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    if (d.moved) {
      suppressClick.current = d.id;
      setDragging(null);
      setOffsets((o) => {
        sessionOffsets = o;
        return o;
      });
    }
  };

  const onClick = (id: PageId) => () => {
    if (suppressClick.current === id) {
      suppressClick.current = null;
      return;
    }
    onOpenPage(id);
  };

  if (!mounted) return null;

  return (
    <nav
      aria-label="Main menu"
      aria-hidden={!open}
      className={`big-menu ${visible ? "is-open" : ""}`}
    >
      <button type="button" onClick={onBack} className="big-menu-back" aria-label="Back" title="Back">
        <BackIcon />
      </button>
      <ul className="menu-folders">
        {FOLDERS.map((f, i) => {
          const o = offsetOf(f.id);
          return (
            <li
              key={f.id}
              className={`menu-folder-slot menu-folder-slot--${f.id}`}
              style={{ "--i": i, zIndex: order.indexOf(f.id) + 1 } as CSSProperties}
            >
              <button
                ref={(el) => {
                  els.current[f.id] = el;
                }}
                type="button"
                tabIndex={open ? 0 : -1}
                onPointerDown={onPointerDown(f.id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClick={onClick(f.id)}
                className={`menu-folder ${dragging === f.id ? "is-dragging" : ""}`}
                style={{ transform: `translate(${o.x}px, ${o.y}px)` }}
              >
                <Folder theme={f.theme} />
                <span className="menu-folder-label">{f.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
