import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SERVICES } from "../data/services";
import { CASE_STUDIES } from "../data/caseStudies";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const SMOOTH = "cubic-bezier(0.22, 1, 0.36, 1)";
const EXPAND = 700; // column expansion + name glide
const DRAW = 1000; // frame line draw
const OUT = 460; // frame line retract

const LOGO_GAP = 18;
const CLOCK_GAP = 16;

const EMAIL = "hello@legostudios.co";
const LINKEDIN = "https://www.linkedin.com/company/lego-studios/";
const INSTAGRAM =
  "https://www.instagram.com/legostudios.co?igsh=MXI2NjBwN2d4dnlncw==";

type Target = "services" | "caseStudies" | "contact";

const ITEMS: { label: string; target: Target | null }[] = [
  { label: "Services", target: "services" },
  { label: "Case Studies", target: "caseStudies" },
  { label: "Magazine", target: null },
  { label: "Contact", target: "contact" },
];

// Menu columns that expand into a framed list page (heading + equal rows).
const PANELS: Record<string, { title: string; items: string[] }> = {
  services: { title: "Services", items: SERVICES },
  caseStudies: {
    title: "Case Studies",
    items: CASE_STUDIES.map((c) => c.name),
  },
};

// A column heading. Collapsed, its words stack onto lines (clipped). Active, the
// words glide onto one line.
function ColumnName({ label, active }: { label: string; active: boolean }) {
  const words = label.split(" ");
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [stacked, setStacked] = useState<string[]>(() =>
    words.map(() => "translate(0, 0)"),
  );

  useLayoutEffect(() => {
    const measure = () => {
      const els = wordRefs.current;
      const first = els[0];
      if (!first) return;
      const n = words.length;
      const lineHeight = first.offsetHeight;
      const left0 = first.offsetLeft;
      setStacked(
        words.map((_, i) => {
          const el = els[i];
          const dx = el ? -(el.offsetLeft - left0) : 0;
          const dy = -((n - 1 - i) * lineHeight);
          return `translate(${dx}px, ${dy}px)`;
        }),
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [label]);

  return (
    <span className="absolute bottom-6 left-0 w-full whitespace-nowrap pl-5 pr-2 text-[clamp(2.5rem,7vw,7rem)] font-bold leading-[0.9] tracking-[-0.02em] text-black">
      {words.map((word, i) => (
        <span
          key={i}
          ref={(el) => {
            wordRefs.current[i] = el;
          }}
          className="inline-block"
          style={{
            transform: active ? "translate(0, 0)" : stacked[i],
            transition: `transform ${EXPAND}ms ${SMOOTH}`,
          }}
        >
          {i < words.length - 1 ? `${word} ` : word}
        </span>
      ))}
    </span>
  );
}

// An expanded page: the heading slides up to the top (and back down when the
// panel is collapsing), and the area below holds the page body. Clicking the
// heading collapses the panel back to the menu.
function PagePanel({
  title,
  collapsing,
  onHeadingClick,
  children,
}: {
  title: string;
  collapsing: boolean;
  onHeadingClick: () => void;
  children: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [rowsTop, setRowsTop] = useState(120);
  const [shown, setShown] = useState(false);

  const parkedY = () => {
    const h = headingRef.current;
    const parent = h?.offsetParent as HTMLElement | null;
    if (!h || !parent) return 0;
    return Math.max(0, parent.clientHeight - h.offsetHeight - 44);
  };

  useLayoutEffect(() => {
    const h = headingRef.current;
    if (!h) return;
    const measure = () => {
      setRowsTop(20 + h.offsetHeight + 64);
      if (!shown) {
        h.style.transition = "none";
        h.style.transform = `translateY(${parkedY()}px)`;
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const h = headingRef.current;
      if (h) {
        h.style.transition = `transform 780ms ${SMOOTH}`;
        h.style.transform = "translateY(0)";
      }
      setShown(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Reverse: slide the heading back down and fade the body out.
  useEffect(() => {
    if (!collapsing) return;
    const h = headingRef.current;
    if (h) {
      h.style.transition = `transform 560ms ${SMOOTH}`;
      h.style.transform = `translateY(${parkedY()}px)`;
    }
    setShown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsing]);

  return (
    <div className="absolute inset-0">
      <h1
        ref={headingRef}
        onClick={onHeadingClick}
        role="button"
        aria-label={`Close ${title}`}
        className="absolute left-5 top-5 z-10 cursor-pointer whitespace-nowrap text-[clamp(2.5rem,7vw,7rem)] font-bold leading-[0.9] tracking-[-0.02em] text-black will-change-transform"
      >
        {title}
      </h1>
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col"
        style={{
          top: rowsTop,
          opacity: shown ? 1 : 0,
          transition: shown ? "opacity 520ms ease 380ms" : "opacity 280ms ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// The equal rows below a list page's heading (one per service / case study).
// When `onSelect` is given, each row is a button that opens its detail.
function ListRows({
  items,
  onSelect,
}: {
  items: string[];
  onSelect?: (index: number) => void;
}) {
  return (
    <>
      {items.map((name, i) =>
        onSelect ? (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(i)}
            className="flex flex-1 items-center border-t-2 border-black pl-5 text-left text-[clamp(1.4rem,3.1vw,2.7rem)] tracking-[-0.01em] text-black outline-none transition-[padding-left] duration-300 ease-out hover:pl-8"
          >
            {name}
          </button>
        ) : (
          <div
            key={name}
            className="flex flex-1 items-center border-t-2 border-black pl-5 text-[clamp(1.4rem,3.1vw,2.7rem)] tracking-[-0.01em] text-black"
          >
            {name}
          </div>
        ),
      )}
    </>
  );
}

// The contact page's body — email + social icons, filling the area below the
// "Contact" heading.
function ContactBody() {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-[clamp(1.5rem,4vh,2.75rem)] pl-5">
      <a
        href={`mailto:${EMAIL}`}
        className="text-[clamp(1.4rem,3.1vw,2.7rem)] tracking-[-0.01em] text-black transition-opacity hover:opacity-60"
      >
        {EMAIL}
      </a>
      <div className="flex items-center gap-[clamp(0.8rem,1.3vw,1.25rem)]">
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="transition-opacity hover:opacity-60"
        >
          <img
            src="/ig-logo.webp"
            alt="Instagram"
            draggable={false}
            className="h-[clamp(28px,2.4vw,38px)] w-[clamp(28px,2.4vw,38px)] object-contain"
          />
        </a>
        <a
          href={LINKEDIN}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="transition-opacity hover:opacity-60"
        >
          <img
            src="/li-logo.png"
            alt="LinkedIn"
            draggable={false}
            className="h-[clamp(28px,2.4vw,38px)] w-[clamp(28px,2.4vw,38px)] object-contain"
          />
        </a>
      </div>
    </div>
  );
}

interface PageFrameProps {
  open: boolean;
  onClose: () => void;
  onOpenCaseStudy: (index: number) => void;
}

// The clock opens this menu: a horizontal line under the logo meets a vertical
// line right of the clock (both draw in on open), and the content area is split
// into four columns. Hovering expands a column; clicking one expands it to a
// blank framed page (the divider slides off the right) with the heading at the
// top. Clicking the heading collapses the page back to the menu.
export function PageFrame({ open, onClose, onOpenCaseStudy }: PageFrameProps) {
  const hRef = useRef<SVGLineElement>(null);
  const vRef = useRef<SVGLineElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const collapseTimer = useRef<number | null>(null);
  const [geo, setGeo] = useState({ vx: 86, hy: 120 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [selGeo, setSelGeo] = useState<{ start: number; full: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [collapsing, setCollapsing] = useState(false);

  useEffect(() => {
    const h = hRef.current;
    const v = vRef.current;
    if (!h || !v) return;

    const position = (draw: boolean) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const logo = document.querySelector('img[alt="LEGO"]') as HTMLElement | null;
      const clock = document.querySelector('[aria-label="Menu"]') as HTMLElement | null;
      const lr = logo?.getBoundingClientRect();
      const cr = clock?.getBoundingClientRect();
      const vx = Math.round(cr ? cr.right + CLOCK_GAP : 84);
      const hy = Math.round(lr ? lr.bottom + LOGO_GAP : H * 0.14);
      setGeo({ vx, hy });

      h.setAttribute("x1", String(W));
      h.setAttribute("y1", String(hy));
      h.setAttribute("x2", String(vx));
      h.setAttribute("y2", String(hy));
      v.setAttribute("x1", String(vx));
      v.setAttribute("y1", String(H));
      v.setAttribute("x2", String(vx));
      v.setAttribute("y2", String(0));

      const hLen = W - vx;
      const vLen = H;
      h.style.strokeDasharray = String(hLen);
      v.style.strokeDasharray = String(vLen);
      h.style.opacity = "1";
      v.style.opacity = "1";

      if (draw) {
        h.style.transition = "none";
        v.style.transition = "none";
        h.style.strokeDashoffset = String(hLen);
        v.style.strokeDashoffset = String(vLen);
        void h.getBoundingClientRect();
        requestAnimationFrame(() => {
          h.style.transition = `stroke-dashoffset ${DRAW}ms ${EASE}`;
          v.style.transition = `stroke-dashoffset ${DRAW}ms ${EASE}`;
          h.style.strokeDashoffset = "0";
          v.style.strokeDashoffset = "0";
        });
      } else {
        h.style.transition = "none";
        v.style.transition = "none";
        h.style.strokeDashoffset = "0";
        v.style.strokeDashoffset = "0";
      }
    };

    if (open) {
      position(true);
      const onResize = () => position(false);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const hLen = Number(h.style.strokeDasharray) || 0;
    const vLen = Number(v.style.strokeDasharray) || 0;
    h.style.transition = `stroke-dashoffset ${OUT}ms ${EASE}`;
    v.style.transition = `stroke-dashoffset ${OUT}ms ${EASE}`;
    h.style.strokeDashoffset = String(hLen);
    v.style.strokeDashoffset = String(vLen);
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    setHovered(null);
    setSelected(null);
    setSelGeo(null);
    setRevealed(false);
    setCollapsing(false);
  }, [open]);

  // Reverse the expansion: shrink the page back to its column and, when the
  // width animation is done, drop back to the menu.
  const collapsePanel = () => {
    if (collapsing) return;
    setCollapsing(true);
    setRevealed(false);
    collapseTimer.current = window.setTimeout(() => {
      setSelected(null);
      setSelGeo(null);
      setCollapsing(false);
    }, EXPAND);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selected !== null) collapsePanel();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, selected, collapsing]);

  const anySel = selected !== null;
  const menuHidden = anySel && !collapsing;
  const selTarget = selected !== null ? ITEMS[selected].target : null;
  const selPanel = selTarget ? PANELS[selTarget] : undefined;

  return (
    <>
      {/* Content area. */}
      <div
        ref={menuRef}
        aria-hidden={!open}
        className={`fixed z-[74] overflow-hidden bg-white transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          left: geo.vx,
          top: geo.hy,
          right: 0,
          bottom: 0,
          transitionDelay: open ? "80ms" : "0ms",
          fontFamily: HELV,
        }}
      >
        {/* Menu columns. */}
        <div
          className="flex h-full w-full transition-opacity duration-300"
          style={{
            opacity: menuHidden ? 0 : 1,
            pointerEvents: menuHidden ? "none" : undefined,
          }}
        >
          {ITEMS.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => {
                if (!item.target) return;
                const start = (e.currentTarget as HTMLElement).offsetWidth;
                const full =
                  menuRef.current?.clientWidth ?? window.innerWidth - geo.vx;
                setSelGeo({ start, full });
                setCollapsing(false);
                setRevealed(false);
                setSelected(i);
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => setRevealed(true)),
                );
              }}
              style={{
                flexGrow: hovered === i ? 3 : 1,
                transition: `flex-grow ${EXPAND}ms ${SMOOTH}`,
                cursor: item.target ? undefined : "default",
              }}
              className="relative flex-1 basis-0 overflow-hidden border-r-2 border-black text-left outline-none last:border-r-0"
            >
              <ColumnName label={item.label} active={hovered === i} />
            </button>
          ))}
        </div>

        {/* Expanded page — revealed by a divider that slides off the right. */}
        {anySel && selGeo && (
          <div
            className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-black bg-white"
            style={{
              width: revealed ? selGeo.full + 60 : selGeo.start,
              transition: `width ${EXPAND}ms ${SMOOTH}`,
            }}
          >
            <div className="absolute inset-y-0 left-0" style={{ width: selGeo.full }}>
              {selTarget === "contact" ? (
                <PagePanel
                  title="Contact"
                  collapsing={collapsing}
                  onHeadingClick={collapsePanel}
                >
                  <ContactBody />
                </PagePanel>
              ) : selPanel ? (
                <PagePanel
                  title={selPanel.title}
                  collapsing={collapsing}
                  onHeadingClick={collapsePanel}
                >
                  <ListRows
                    items={selPanel.items}
                    onSelect={
                      selTarget === "caseStudies" ? onOpenCaseStudy : undefined
                    }
                  />
                </PagePanel>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Frame lines, drawn on top. */}
      <svg
        className="pointer-events-none fixed inset-0 z-[76] h-full w-full"
        aria-hidden="true"
      >
        <line ref={hRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" style={{ opacity: 0 }} />
        <line ref={vRef} stroke="#000000" strokeWidth={2} shapeRendering="crispEdges" style={{ opacity: 0 }} />
      </svg>
    </>
  );
}
