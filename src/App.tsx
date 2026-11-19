import { useCallback, useEffect, useState } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { Hero } from "./components/Hero";
import { MenuButton, type SquareSkip } from "./components/MenuButton";
import { Menu, type PageId } from "./components/Menu";
import { ServicesPage } from "./components/pages/ServicesPage";
import { CaseStudiesPage } from "./components/pages/CaseStudiesPage";
import { ContactPage } from "./components/pages/ContactPage";
import { CaseStudyPage } from "./components/CaseStudyPage";

// Navigation is three stacked layers over the home page:
//   menu (yellow)  →  page (Services / Case Studies / Contact)  →  case study.
// Back (top-right on every page) steps down one layer. The home-page
// Contact link opens the Contact page without the menu, so Back goes home.
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState<PageId | null>(null);
  const [caseDetail, setCaseDetail] = useState<number | null>(null);

  const isHome = !menuOpen && page === null && caseDetail === null;

  const back = useCallback(() => {
    if (caseDetail !== null) setCaseDetail(null);
    else if (page !== null) setPage(null);
    else setMenuOpen(false);
  }, [caseDetail, page]);

  // The menu square always opens the menu (from home or any page). On the
  // menu itself it closes it, back to home.
  const onMenuOnly = menuOpen && page === null && caseDetail === null;
  const onMenuButton = useCallback(() => {
    if (onMenuOnly) {
      setMenuOpen(false);
      return;
    }
    setCaseDetail(null);
    setPage(null);
    setMenuOpen(true);
  }, [onMenuOnly]);

  const openContactFromHome = useCallback(() => setPage("contact"), []);

  useEffect(() => {
    if (isHome) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHome, back]);

  // The square flashes through the brand colours; on a page whose background
  // is one of them, that colour is skipped so the square never disappears.
  const squareSkip: SquareSkip =
    caseDetail !== null
      ? null
      : page === "services"
        ? "sky"
        : page === "caseStudies"
          ? "pink"
          : page === null && menuOpen
            ? "yellow"
            : null;

  return (
    <>
      <CustomCursor />

      <Hero />

      {isHome && (
        <button type="button" onClick={openContactFromHome} className="home-contact">
          Contact
        </button>
      )}

      <Menu open={menuOpen} onOpenPage={setPage} onBack={back} />

      <ServicesPage open={page === "services"} onBack={back} />
      <CaseStudiesPage
        open={page === "caseStudies"}
        onBack={back}
        onSelect={setCaseDetail}
      />
      <ContactPage open={page === "contact"} onBack={back} />

      <CaseStudyPage
        index={caseDetail}
        onBack={back}
        onNavigate={setCaseDetail}
      />

      <MenuButton onClick={onMenuButton} skip={squareSkip} />
    </>
  );
}
