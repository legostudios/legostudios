import { useCallback, useRef, useState } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { PageFrame } from "./components/PageFrame";
import { Hero } from "./components/Hero";
import { TimeLine } from "./components/TimeLine";
import { CaseStudyPage } from "./components/CaseStudyPage";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [caseDetail, setCaseDetail] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [frameGeo, setFrameGeo] = useState({ vx: 86, hy: 120 });
  const collapsePanel = useRef<() => void>(() => {});

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

  // The clock steps back one level: a page collapses to the menu, the menu
  // closes to home, and home opens the menu.
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

      {/* The LEGO logo doubles as a home button — clicking it dismisses the menu. */}
      <Hero onHome={goHome} />

      {caseDetail !== null && (
        <CaseStudyPage
          index={caseDetail}
          left={frameGeo.vx}
          top={frameGeo.hy}
          onBack={closeCaseStudy}
          onOpen={openCaseStudy}
        />
      )}
    </>
  );
}
