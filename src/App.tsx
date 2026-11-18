import { useCallback, useEffect, useRef, useState } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { PageFrame } from "./components/PageFrame";
import { Hero } from "./components/Hero";
import { MenuButton } from "./components/MenuButton";
import { CaseStudyPage } from "./components/CaseStudyPage";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [caseDetail, setCaseDetail] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [frameGeo, setFrameGeo] = useState({ vx: 86, hy: 120, logoMid: 40 });
  const [isMobile, setIsMobile] = useState(false);
  const collapsePanel = useRef<() => void>(() => {});

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Warm the horizontal wordmark so it's ready to fade in the moment the menu
  // opens (no first-load pop).
  useEffect(() => {
    const img = new Image();
    img.src = "/Logo-Horizontal.png";
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Opening a case study leaves the menu mounted underneath, so closing the
  // detail (Back) drops the user straight back onto the Case Studies list.
  const openCaseStudy = useCallback((i: number) => setCaseDetail(i), []);
  const closeCaseStudy = useCallback(() => setCaseDetail(null), []);

  const isHome = !menuOpen && caseDetail === null;

  // Step back one level: detail → list, page → menu, menu → home.
  const onBack = useCallback(() => {
    if (caseDetail !== null) setCaseDetail(null);
    else if (panelOpen) collapsePanel.current();
    else if (menuOpen) setMenuOpen(false);
  }, [caseDetail, panelOpen, menuOpen]);

  // The menu button steps back one level, same as the Back button.
  const onClock = useCallback(() => {
    if (caseDetail !== null) {
      setCaseDetail(null);
      collapsePanel.current();
    } else if (panelOpen) {
      collapsePanel.current();
    } else if (menuOpen) {
      setMenuOpen(false);
    } else {
      setMenuOpen(true);
    }
  }, [caseDetail, panelOpen, menuOpen]);

  return (
    <>
      <CustomCursor />

      {/* Framed expanding-column menu — opens when the menu button is clicked. Every
          destination (Services, Case Studies, Contact) opens inside the frame. */}
      <PageFrame
        open={menuOpen}
        onClose={closeMenu}
        onOpenCaseStudy={openCaseStudy}
        onPanelOpenChange={setPanelOpen}
        collapseRef={collapsePanel}
        onGeoChange={setFrameGeo}
      />

      {/* The square menu button sits on every page; clicking it steps back a level. */}
      <MenuButton onClick={onClock} light={isHome} />

      {/* Back button — in the top band (right of the vertical line) on every page
          except home. Steps back one level. */}
      {!isHome && (
        <button
          type="button"
          onClick={onBack}
          className="chrome-fade-in fixed z-[86] flex items-center gap-1 text-[18px] font-medium tracking-wide text-black transition-opacity hover:opacity-60"
          style={{
            left: isMobile ? "50%" : Math.max(frameGeo.vx, 60) + 37,
            top: frameGeo.hy / 2,
            transform: isMobile ? "translate(-50%, -50%)" : "translateY(-50%)",
            fontFamily: HELV,
          }}
        >
          <img
            src="/back_icon.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-auto -translate-y-[1px]"
            style={{ height: "0.6em" }}
          />
          Back
        </button>
      )}

      {/* Home page: background video, the computer and the bottom strip. */}
      <Hero />

      {caseDetail !== null && (
        <CaseStudyPage
          index={caseDetail}
          left={frameGeo.vx}
          top={frameGeo.hy}
          onBack={closeCaseStudy}
        />
      )}
    </>
  );
}
