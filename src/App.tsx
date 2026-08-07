import { useCallback, useEffect, useRef, useState } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { PageFrame } from "./components/PageFrame";
import { Hero } from "./components/Hero";
import { TimeLine } from "./components/TimeLine";
import { CaseStudyPage } from "./components/CaseStudyPage";

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [caseDetail, setCaseDetail] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [frameGeo, setFrameGeo] = useState({ vx: 86, hy: 120, logoMid: 40 });
  const collapsePanel = useRef<() => void>(() => {});

  // Warm the horizontal wordmark so it's ready to fade in the moment the menu
  // opens (no first-load pop).
  useEffect(() => {
    const img = new Image();
    img.src = "/Logo-Horizontal.png";
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // The LEGO logo returns to the bare home page from anywhere.
  const goHome = useCallback(() => {
    setMenuOpen(false);
    setCaseDetail(null);
  }, []);

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

  // The clock steps back one level, same as the Back button.
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

      {/* Framed expanding-column menu — opens when the clock is clicked. Every
          destination (Services, Case Studies, Contact) opens inside the frame. */}
      <PageFrame
        open={menuOpen}
        onClose={closeMenu}
        onOpenCaseStudy={openCaseStudy}
        onPanelOpenChange={setPanelOpen}
        collapseRef={collapsePanel}
        onGeoChange={setFrameGeo}
      />

      {/* The time-line clock sits on every page; clicking it steps back a level. */}
      <TimeLine onClick={onClock} />

      {/* Back button — in the top band (right of the vertical line) on every page
          except home. Steps back one level. */}
      {!isHome && (
        <button
          type="button"
          onClick={onBack}
          className="chrome-fade-in fixed z-[86] flex items-center gap-2.5 text-[22px] font-medium tracking-wide text-black transition-opacity hover:opacity-60"
          style={{
            left: Math.max(frameGeo.vx, 60) + 37,
            top: frameGeo.logoMid + 5,
            transform: "translateY(-50%)",
            fontFamily: HELV,
          }}
        >
          <img
            src="/arrow.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-auto"
            style={{ height: "0.62em" }}
          />
          Back
        </button>
      )}

      {/* The LEGO logo doubles as a home button — clicking it dismisses the menu.
          Off the home page (menu or a detail open) it swaps to the horizontal
          wordmark. */}
      <Hero onHome={goHome} pageLogo={!isHome} />

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
