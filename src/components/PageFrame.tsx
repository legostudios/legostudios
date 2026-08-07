import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { SERVICES } from "../data/services";
import { CASE_STUDIES } from "../data/caseStudies";
import { SHOWCASE_IMAGES } from "../data/showcaseImages";

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

type Target = "services" | "caseStudies" | "magazine" | "contact";

const ITEMS: { label: string; target: Target | null }[] = [
  { label: "Services", target: "services" },
  { label: "Case Studies", target: "caseStudies" },
  { label: "Magazine", target: "magazine" },
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

// A single fixed archival image, centred in the empty space (mobile only).
// Default is the Global Outdoor Apparel photo (menu / services / case studies);
// Contact overrides it with a distinct image.
const CENTER_IMAGE_SRC = SHOWCASE_IMAGES[0];
const CONTACT_IMAGE_SRC = SHOWCASE_IMAGES[6];
function CenterImage({
  className,
  src = CENTER_IMAGE_SRC,
}: {
  className: string;
  src?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
    />
  );
}

// A column heading. Collapsed, its words stack onto lines (clipped). Active, the
// words glide onto one line. On mobile the menu is a horizontal band, so the
// name is just shown on one line, vertically centered.
function ColumnName({
  label,
  active,
  mobile,
}: {
  label: string;
  active: boolean;
  mobile: boolean;
}) {
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

  if (mobile) {
    // A compact left-aligned row; the bands stack at the bottom of the menu.
    // The page heading parks at the band centre, so it lands on this name when
    // a page collapses.
    return (
      <span className="block whitespace-nowrap py-3 pl-10 pr-2 text-[clamp(2.4rem,11vw,3.5rem)] font-medium leading-[0.9] tracking-[-0.035em] text-black">
        {label}
      </span>
    );
  }

  return (
    <span className="absolute bottom-6 left-0 w-full whitespace-nowrap pl-10 pr-2 text-[103px] font-medium leading-[0.9] tracking-[-0.035em] text-black">
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
  mobile,
  bandHeight,
  onHeadingClick,
  children,
}: {
  title: string;
  collapsing: boolean;
  mobile: boolean;
  bandHeight: number;
  onHeadingClick: () => void;
  children: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [rowsTop, setRowsTop] = useState(120);
  const [shown, setShown] = useState(false);

  // Parked (menu) position of the heading. Desktop: the bottom of the frame, so
  // it slides straight up. Mobile: the vertical centre of the band — the content
  // rides to the band top, so this offset drops the heading onto the (centred)
  // band name, and the heading then travels up with the divider on open.
  const parkedY = () => {
    const h = headingRef.current;
    const parent = h?.offsetParent as HTMLElement | null;
    if (!h || !parent) return 0;
    if (mobile) {
      // Centre the heading in the (compact) band — may be negative, pulling the
      // heading up into a band shorter than its top offset.
      return bandHeight / 2 - h.offsetHeight / 2 - 40;
    }
    return Math.max(0, parent.clientHeight - h.offsetHeight - 44);
  };

  useLayoutEffect(() => {
    const h = headingRef.current;
    if (!h) return;
    const measure = () => {
      setRowsTop(40 + h.offsetHeight + (mobile ? 36 : 90));
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
        h.style.transition = `transform ${mobile ? EXPAND : 780}ms ${SMOOTH}`;
        h.style.transform = "translateY(0)";
      }
      setShown(true);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reverse: slide the heading back to its parked position and fade the body out.
  useEffect(() => {
    if (!collapsing) return;
    const h = headingRef.current;
    if (h) {
      h.style.transition = `transform ${EXPAND}ms ${SMOOTH}`;
      h.style.transform = `translateY(${parkedY()}px)`;
    }
    setShown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsing]);

  return (
    <div className="absolute inset-0">
      {mobile && title !== "Magazine" && title !== "Contact" && (
        <div className="pointer-events-none absolute inset-x-0 top-[14%] bottom-[52%] z-0 flex items-center justify-center p-8">
          <CenterImage className="max-h-full w-auto max-w-[68%] object-contain" />
        </div>
      )}
      <h1
        ref={headingRef}
        onClick={onHeadingClick}
        role="button"
        aria-label={`Close ${title}`}
        className="absolute left-10 top-10 z-10 cursor-pointer whitespace-nowrap text-[clamp(2.4rem,11vw,3.5rem)] font-medium leading-[0.9] tracking-[-0.035em] text-black will-change-transform lg:text-[103px]"
      >
        {title}
      </h1>
      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col ${mobile ? "justify-end" : ""}`}
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

// The rows below the Services heading. Desktop: bottom-left names in equal boxes
// that grow on hover. Mobile: a compact bottom-aligned list matching the menu.
function ListRows({ items, mobile }: { items: string[]; mobile: boolean }) {
  const [hover, setHover] = useState<number | null>(null);

  if (mobile) {
    return (
      <>
        {items.map((name) => (
          <div
            key={name}
            className="block whitespace-nowrap border-t-2 border-black py-5 pl-10 pr-4 text-[clamp(1.3rem,5vw,1.9rem)] font-medium leading-[0.9] tracking-[-0.035em] text-black"
          >
            {name}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((name, i) => (
        <div
          key={name}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          style={{
            flexGrow: hover === i ? 2.4 : 1,
            transition: `flex-grow ${EXPAND}ms ${SMOOTH}`,
          }}
          className="flex flex-1 basis-0 items-end whitespace-nowrap border-t-2 border-black pb-1 pl-10 text-[clamp(1.4rem,3.1vw,2.7rem)] tracking-[-0.035em] text-black lg:text-[70px]"
        >
          {name}
        </div>
      ))}
    </>
  );
}

// Case-study rows — bottom-left names like the Services rows, but hovering grows
// the box and reveals that study's headline stats beneath the name (shown by
// default on mobile, where there's no hover). Clicking opens the full detail.
function CaseStudyRows({
  onSelect,
  mobile,
}: {
  onSelect: (index: number) => void;
  mobile: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (mobile) {
    // Compact bottom list matching the menu; the highlights sit under each name,
    // constrained to two lines.
    return (
      <>
        {CASE_STUDIES.map((cs, i) => (
          <button
            key={cs.name}
            type="button"
            onClick={() => onSelect(i)}
            className="block whitespace-nowrap border-t-2 border-black py-5 pl-10 pr-4 text-left text-[clamp(1.4rem,5.3vw,2rem)] font-medium leading-[0.9] tracking-[-0.035em] text-black outline-none"
          >
            {cs.name}
          </button>
        ))}
      </>
    );
  }

  return (
    <>
      {CASE_STUDIES.map((cs, i) => {
        const show = mobile || hover === i;
        return (
          <button
            key={cs.name}
            type="button"
            onClick={() => onSelect(i)}
            onMouseEnter={mobile ? undefined : () => setHover(i)}
            onMouseLeave={mobile ? undefined : () => setHover(null)}
            style={{
              flexGrow: !mobile && hover === i ? 2.4 : 1,
              transition: `flex-grow ${EXPAND}ms ${SMOOTH}`,
            }}
            className="flex flex-1 basis-0 flex-col justify-end overflow-hidden border-t-2 border-black pb-8 pl-10 text-left outline-none"
          >
            <span className="whitespace-nowrap text-[clamp(1.4rem,3.1vw,2.7rem)] leading-[0.9] tracking-[-0.035em] text-black lg:text-[70px]">
              {cs.name}
            </span>
            <span
              className="flex flex-wrap gap-x-8 gap-y-1 pl-[2px] pr-4 text-[17px] tracking-[-0.01em] text-black/50"
              style={{
                maxHeight: show ? "4em" : 0,
                opacity: show ? 1 : 0,
                marginTop: show ? "0.15rem" : 0,
                overflow: "hidden",
                transition: `max-height ${EXPAND}ms ${SMOOTH}, margin-top ${EXPAND}ms ${SMOOTH}, opacity 360ms ease`,
              }}
            >
              {cs.stats.map((s) => (
                <span key={s.label} className="whitespace-nowrap">
                  <span className="font-medium text-black">{s.value}</span>{" "}
                  {s.label}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </>
  );
}

// The magazine page's body — a placeholder until it launches.
function MagazineBody() {
  return (
    <div className="flex flex-1 items-center pl-5 text-[clamp(1.4rem,3.1vw,2.7rem)] tracking-[-0.01em] text-black/45">
      Coming Soon
    </div>
  );
}

// The contact page's body — email at the bottom-left (large), social icons at
// the bottom-right on the same line.
function ContactBody({ mobile }: { mobile: boolean }) {
  return (
    <div className={`flex flex-1 flex-col ${mobile ? "" : "justify-end"}`}>
      {/* Mobile: a distinct image, sized to fit entirely in the space *below* the
          heading (object-contain so it never rides up under "Contact"). */}
      {mobile && (
        <div className="flex flex-1 items-center justify-center px-8 pb-4 pt-2">
          <CenterImage
            src={CONTACT_IMAGE_SRC}
            className="max-h-full w-auto max-w-full object-contain"
          />
        </div>
      )}
      {/* items-baseline puts the email's baseline on the icons' base (their
          bottom edge) — aligned on both mobile and desktop. */}
      <div className="flex items-baseline justify-between gap-6 pb-12 pl-10 pr-8">
        <a
          href={`mailto:${EMAIL}`}
          className="whitespace-nowrap text-[clamp(1.3rem,5vw,2.4rem)] leading-[0.9] tracking-[-0.02em] text-black transition-opacity hover:opacity-60 lg:text-[80px]"
        >
          {EMAIL}
        </a>
        <div className="flex shrink-0 items-end gap-[clamp(0.8rem,1.3vw,1.25rem)]">
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="block transition-opacity hover:opacity-60"
        >
          <img
            src="/ig-icon.webp"
            alt="Instagram"
            draggable={false}
            className="h-[clamp(24px,2vw,32px)] w-auto object-contain"
          />
        </a>
        <a
          href={LINKEDIN}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="block transition-opacity hover:opacity-60"
        >
          <img
            src="/li-icon.png"
            alt="LinkedIn"
            draggable={false}
            className="h-[clamp(24px,2vw,32px)] w-auto object-contain"
          />
        </a>
        </div>
      </div>
    </div>
  );
}

interface PageFrameProps {
  open: boolean;
  onClose: () => void;
  onOpenCaseStudy: (index: number) => void;
  // Reports whether a page (Services/Case Studies/Contact) is expanded, and
  // hands the parent a live collapse-to-menu function for the clock button.
  onPanelOpenChange: (open: boolean) => void;
  collapseRef: MutableRefObject<() => void>;
  // The live frame origin (right of the clock, below the logo) so other pages
  // can open inside the same boundary. logoMid is the logo's vertical centre so
  // the Back button can align to it.
  onGeoChange: (g: { vx: number; hy: number; logoMid: number }) => void;
}

// The clock opens this menu: a horizontal line under the logo meets a vertical
// line right of the clock (both draw in on open), and the content area is split
// into four columns. Hovering expands a column; clicking one expands it to a
// blank framed page (the divider slides off the right) with the heading at the
// top. Clicking the heading collapses the page back to the menu.
export function PageFrame({
  open,
  onClose,
  onOpenCaseStudy,
  onPanelOpenChange,
  collapseRef,
  onGeoChange,
}: PageFrameProps) {
  const hRef = useRef<SVGLineElement>(null);
  const vRef = useRef<SVGLineElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const collapseTimer = useRef<number | null>(null);
  const [geo, setGeo] = useState({ vx: 86, hy: 120, logoMid: 40 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  // start/end are the clicked band's edges along the menu axis (x on desktop,
  // y on mobile); size is the menu's extent along that axis.
  const [selGeo, setSelGeo] = useState<{
    start: number;
    end: number;
    size: number;
    index: number;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

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
      const mobile = window.matchMedia("(max-width: 1023px)").matches;
      const clockRight = cr ? cr.right + CLOCK_GAP : 84;
      const logoBottom = lr ? lr.bottom + LOGO_GAP : H * 0.14;
      // Equal inset for the corner: the space left of the vertical line matches
      // the space above the horizontal line. Mobile has no vertical line, so the
      // horizontal line just sits below the logo and the menu spans full width.
      const inset = Math.max(clockRight, logoBottom);
      const vx = mobile ? 0 : Math.round(inset);
      const hy = Math.round(mobile ? logoBottom : inset);
      const logoMid = lr ? Math.round(lr.top + lr.height / 2) : Math.round(hy / 2);
      setGeo({ vx, hy, logoMid });

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
      v.style.opacity = mobile ? "0" : "1";

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
  }, [open, isMobile]);

  // Reverse the expansion: shrink the page back to its column and, when the
  // width animation is done, drop back to the menu.
  const collapsePanel = () => {
    if (collapsing) return;
    setCollapsing(true);
    setRevealed(false);
    setHovered(null); // let the columns underneath ease back to equal widths
    collapseTimer.current = window.setTimeout(() => {
      setSelected(null);
      setSelGeo(null);
      setCollapsing(false);
    }, EXPAND);
  };

  // Keep the parent's collapse handle pointing at the latest closure, and let it
  // know when a page opens/closes (so the clock can route correctly).
  collapseRef.current = collapsePanel;
  useEffect(() => {
    onPanelOpenChange(selected !== null);
  }, [selected, onPanelOpenChange]);
  useEffect(() => {
    onGeoChange(geo);
  }, [geo, onGeoChange]);

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
  const selTarget = selected !== null ? ITEMS[selected].target : null;
  const selPanel = selTarget ? PANELS[selTarget] : undefined;
  // The page is bracketed by two dividers along the menu axis. Opening, it grows
  // out of the clicked band: the near divider slides to the frame line (0), the
  // far one slides off-screen. Collapsing, both ease back to the band's *equal*
  // partition (in sync with the bands underneath returning to equal size).
  let pos1 = 0;
  let pos2 = 0;
  if (selGeo) {
    if (collapsing) {
      if (isMobile) {
        // Mobile bands sit at their own (compact) position — return to it.
        pos1 = selGeo.start;
        pos2 = selGeo.end;
      } else {
        const seg = selGeo.size / ITEMS.length;
        pos1 = selGeo.index * seg;
        pos2 = (selGeo.index + 1) * seg;
      }
    } else if (revealed) {
      pos2 = selGeo.size + 60;
    } else {
      pos1 = selGeo.start;
      pos2 = selGeo.end;
    }
  }

  const panelNode =
    selTarget === "contact" ? (
      <PagePanel
        title="Contact"
        collapsing={collapsing}
        mobile={isMobile}
        bandHeight={selGeo ? selGeo.end - selGeo.start : 0}
        onHeadingClick={collapsePanel}
      >
        <ContactBody mobile={isMobile} />
      </PagePanel>
    ) : selTarget === "magazine" ? (
      <PagePanel
        title="Magazine"
        collapsing={collapsing}
        mobile={isMobile}
        bandHeight={selGeo ? selGeo.end - selGeo.start : 0}
        onHeadingClick={collapsePanel}
      >
        <MagazineBody />
      </PagePanel>
    ) : selPanel ? (
      <PagePanel
        title={selPanel.title}
        collapsing={collapsing}
        mobile={isMobile}
        bandHeight={selGeo ? selGeo.end - selGeo.start : 0}
        onHeadingClick={collapsePanel}
      >
        {selTarget === "caseStudies" ? (
          <CaseStudyRows onSelect={onOpenCaseStudy} mobile={isMobile} />
        ) : (
          <ListRows items={selPanel.items} mobile={isMobile} />
        )}
      </PagePanel>
    ) : null;

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
        {/* Menu columns. The expanding page covers them physically, so they
            stay opaque and are simply overdrawn (and non-interactive) while a
            page is open. */}
        <div
          className={`relative z-[1] flex h-full w-full ${isMobile ? "flex-col" : ""}`}
          style={{ pointerEvents: anySel ? "none" : undefined }}
        >
          {isMobile && (
            <div className="flex flex-1 items-center justify-center overflow-hidden p-8">
              <CenterImage className="max-h-[30vh] w-auto max-w-[64%] object-contain" />
            </div>
          )}
          {ITEMS.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => {
                if (!item.target) return;
                const menuEl = menuRef.current;
                const rect = menuEl?.getBoundingClientRect();
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                let start: number;
                let end: number;
                let size: number;
                if (isMobile) {
                  const menuTop = rect?.top ?? geo.hy;
                  size = menuEl?.clientHeight ?? window.innerHeight - geo.hy;
                  start = r.top - menuTop;
                  end = r.bottom - menuTop;
                } else {
                  const menuLeft = rect?.left ?? geo.vx;
                  size = menuEl?.clientWidth ?? window.innerWidth - geo.vx;
                  start = r.left - menuLeft;
                  end = r.right - menuLeft;
                }
                setSelGeo({ start, end, size, index: i });
                setCollapsing(false);
                setRevealed(false);
                setSelected(i);
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => setRevealed(true)),
                );
              }}
              style={{
                flexGrow: isMobile ? 0 : hovered === i ? 3 : 1,
                transition: `flex-grow ${EXPAND}ms ${SMOOTH}`,
                cursor: item.target ? undefined : "default",
              }}
              className={`relative overflow-hidden border-black text-left outline-none ${
                isMobile
                  ? "border-t-2"
                  : "flex-1 basis-0 border-r-2 last:border-r-0"
              }`}
            >
              <ColumnName
                label={item.label}
                active={hovered === i}
                mobile={isMobile}
              />
            </button>
          ))}
        </div>

        {/* Expanded page. Desktop: the left/right borders are two dividers and
            the page grows horizontally out of the clicked column (inner div
            counter-offset so the content stays pinned to the frame's left).
            Mobile: the page simply covers the horizontal band menu. */}
        {anySel &&
          selGeo &&
          (isMobile ? (
            <div
              className="absolute inset-x-0 z-[2] overflow-hidden border-t-2 border-b-2 border-black bg-white"
              style={{
                top: pos1,
                height: Math.max(0, pos2 - pos1),
                // Shift 1px so the top border sits on the SVG frame line (only
                // while opening/open — see the desktop note above).
                marginTop: collapsing ? "0px" : "-1px",
                transition: `top ${EXPAND}ms ${SMOOTH}, height ${EXPAND}ms ${SMOOTH}`,
              }}
            >
              <div
                className="absolute inset-x-0"
                style={{
                  // Ride with the page (which carries the top divider) so the
                  // heading and the line travel to the top together.
                  top: 0,
                  height: selGeo.size,
                }}
              >
                {panelNode}
              </div>
            </div>
          ) : (
            <div
              className="absolute inset-y-0 z-[2] overflow-hidden border-l-2 border-r-2 border-black bg-white"
              style={{
                left: pos1,
                width: Math.max(0, pos2 - pos1),
                // Shift 1px so the left border sits exactly on the SVG frame line
                // when merged. Only while opening/open — on collapse the borders
                // must land exactly on the column grid (else they flicker 1px as
                // the overlay hands off to the columns underneath).
                marginLeft: collapsing ? "0px" : "-1px",
                transition: `left ${EXPAND}ms ${SMOOTH}, width ${EXPAND}ms ${SMOOTH}`,
              }}
            >
              <div
                className="absolute inset-y-0"
                style={{
                  left: collapsing ? 0 : -pos1,
                  width: selGeo.size,
                  transition: `left ${EXPAND}ms ${SMOOTH}`,
                }}
              >
                {panelNode}
              </div>
            </div>
          ))}
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
