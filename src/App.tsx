import { useCallback, useEffect, useState } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { Hero } from "./components/Hero";
import { MenuButton } from "./components/MenuButton";
import { Menu, type PageId } from "./components/Menu";
import { ServicesPage } from "./components/pages/ServicesPage";
import { CaseStudiesPage } from "./components/pages/CaseStudiesPage";
import { ContactPage } from "./components/pages/ContactPage";
import { CaseStudyPage } from "./components/CaseStudyPage";

// Navigation is three stacked layers over the home page:
//   menu (yellow)  →  page (Services / Case Studies / Contact)  →  case study.
// Back steps down one layer; Close returns straight home. The home-page
// Contact link opens the Contact page without the menu, so Back goes home.
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState<PageId | null>(null);
  const [caseDetail, setCaseDetail] = useState<number | null>(null);

  const isHome = !menuOpen && page === null && caseDetail === null;

  const closeAll = useCallback(() => {
    setCaseDetail(null);
    setPage(null);
    setMenuOpen(false);
  }, []);

  const back = useCallback(() => {
    if (caseDetail !== null) setCaseDetail(null);
    else if (page !== null) setPage(null);
    else setMenuOpen(false);
  }, [caseDetail, page]);

  // The menu square opens the menu from home, and steps back everywhere else.
  const onMenuButton = useCallback(() => {
    if (isHome) setMenuOpen(true);
    else back();
  }, [isHome, back]);

  const openContactFromHome = useCallback(() => setPage("contact"), []);

  useEffect(() => {
    if (isHome) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHome, back]);

  // The square is white-on-dark over the home video (difference blend) and on
  // the black Contact page; black on every other page colour.
  const lightButton = isHome || (page === "contact" && caseDetail === null);

  return (
    <>
      <CustomCursor />

      <Hero />

      {isHome && (
        <button type="button" onClick={openContactFromHome} className="home-contact">
          Contact
        </button>
      )}

      <Menu open={menuOpen} onOpenPage={setPage} onClose={closeAll} />

      <ServicesPage open={page === "services"} onBack={back} onClose={closeAll} />
      <CaseStudiesPage
        open={page === "caseStudies"}
        onBack={back}
        onClose={closeAll}
        onSelect={setCaseDetail}
      />
      <ContactPage open={page === "contact"} onBack={back} onClose={closeAll} />

      <CaseStudyPage
        index={caseDetail}
        onBack={back}
        onClose={closeAll}
        onNavigate={setCaseDetail}
      />

      <MenuButton onClick={onMenuButton} light={lightButton} />
    </>
  );
}
