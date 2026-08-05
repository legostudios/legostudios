import { useCallback, useState } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { PageFrame } from "./components/PageFrame";
import { Hero } from "./components/Hero";
import { TimeLine } from "./components/TimeLine";
import { CaseStudyPage } from "./components/CaseStudyPage";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [caseDetail, setCaseDetail] = useState<number | null>(null);

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
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

  return (
    <>
      <CustomCursor />

      {/* Framed expanding-column menu — opens when the clock is clicked. Every
          destination (Services, Case Studies, Contact) opens inside the frame. */}
      <PageFrame
        open={menuOpen}
        onClose={closeMenu}
        onOpenCaseStudy={openCaseStudy}
      />

      {/* The time-line clock sits on every page; clicking it opens the menu. */}
      <TimeLine onClick={toggleMenu} />

      {/* The LEGO logo doubles as a home button — clicking it dismisses the menu. */}
      <Hero onHome={goHome} />

      {caseDetail !== null && (
        <CaseStudyPage
          index={caseDetail}
          onBack={closeCaseStudy}
          onHome={goHome}
          onOpen={openCaseStudy}
        />
      )}
    </>
  );
}
