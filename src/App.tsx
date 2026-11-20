import { useCallback, useEffect, useState } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { Hero } from "./components/Hero";
import { MenuButton, type SquareSkip } from "./components/MenuButton";
import { ContactIcon } from "./components/ContactIcon";
import { Menu, type PageId } from "./components/Menu";
import { ServicesPage } from "./components/pages/ServicesPage";
import { CaseStudiesPage } from "./components/pages/CaseStudiesPage";
import { ContactPage } from "./components/pages/ContactPage";
import { CaseStudyPage } from "./components/CaseStudyPage";
import { CASE_STUDIES } from "./data/caseStudies";

type Nav = { menuOpen: boolean; page: PageId | null; caseDetail: number | null };

// The page is kept in the address (a "#" route), so a refresh or a shared
// link reopens the same page, and the browser's back/forward buttons work:
//   #/menu · #/services · #/case-studies · #/case-studies/2 · #/contact
const SLUGS: Record<PageId, string> = { services: "services", caseStudies: "case-studies", contact: "contact" };

function toHash({ menuOpen, page, caseDetail }: Nav): string {
  if (caseDetail !== null) return `#/case-studies/${caseDetail + 1}`;
  if (page) return `#/${SLUGS[page]}`;
  return menuOpen ? "#/menu" : "";
}

function fromHash(hash: string): Nav {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [first, second] = parts;
  if (first === "menu") return { menuOpen: true, page: null, caseDetail: null };
  if (first === "services") return { menuOpen: true, page: "services", caseDetail: null };
  if (first === "contact") return { menuOpen: false, page: "contact", caseDetail: null };
  if (first === "case-studies") {
    const n = Number(second);
    const detail = Number.isInteger(n) && n >= 1 && n <= CASE_STUDIES.length ? n - 1 : null;
    return { menuOpen: true, page: "caseStudies", caseDetail: detail };
  }
  return { menuOpen: false, page: null, caseDetail: null };
}

// Navigation is three stacked layers over the home page:
//   menu (pink)  →  page (Services / Case Studies / Contact)  →  case study.
// Back (top-right on every page) steps down one layer. The home-page
// Contact link opens the Contact page without the menu, so Back goes home.
export default function App() {
  const [menuOpen, setMenuOpen] = useState(() => fromHash(window.location.hash).menuOpen);
  const [page, setPage] = useState<PageId | null>(() => fromHash(window.location.hash).page);
  const [caseDetail, setCaseDetail] = useState<number | null>(() => fromHash(window.location.hash).caseDetail);

  // Keep the address in step with the page shown (adds a history entry, so
  // the browser's back button steps back too).
  useEffect(() => {
    const hash = toHash({ menuOpen, page, caseDetail });
    if (hash !== window.location.hash) {
      const url = hash || window.location.pathname + window.location.search;
      window.history.pushState(null, "", url);
    }
  }, [menuOpen, page, caseDetail]);

  // Browser back/forward (or a hand-edited address): show that page.
  useEffect(() => {
    const onNav = () => {
      const n = fromHash(window.location.hash);
      setMenuOpen(n.menuOpen);
      setPage(n.page);
      setCaseDetail(n.caseDetail);
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
    };
  }, []);

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
            ? "pink"
            : null;

  return (
    <>
      <CustomCursor />

      <Hero />

      {isHome && (
        <button
          type="button"
          onClick={openContactFromHome}
          className="home-contact"
          aria-label="Contact"
        >
          <ContactIcon />
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
