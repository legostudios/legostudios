import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { CustomCursor } from "./components/CustomCursor";
import { PageFrame } from "./components/PageFrame";
import { Hero } from "./components/Hero";
import { TimeLine } from "./components/TimeLine";
import { ServicesPage } from "./components/ServicesPage";
import { CaseStudiesPage } from "./components/CaseStudiesPage";
import { ContactPage } from "./components/ContactPage";
import { SHOWCASE_IMAGES } from "./data/showcaseImages";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

// Warm the browser cache with the services/case-study photos once the home page
// is idle, so opening those pages shows the images with no load time.
function preloadShowcase() {
  SHOWCASE_IMAGES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

type Page = "services" | "caseStudies" | "contact" | null;

export default function App() {
  const [page, setPage] = useState<Page>(null);
  const [closing, setClosing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const open = page !== null;

  useEffect(() => {
    const ric = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
      }
    ).requestIdleCallback;
    if (ric) ric(preloadShowcase, { timeout: 2500 });
    else {
      const t = window.setTimeout(preloadShowcase, 1500);
      return () => window.clearTimeout(t);
    }
  }, []);

  const finishClose = useCallback(() => {
    flushSync(() => {
      setPage(null);
      setClosing(false);
    });
  }, []);

  const requestClose = useCallback(() => {
    if (reducedMotion) {
      finishClose();
    } else {
      setClosing(true);
    }
  }, [reducedMotion, finishClose]);

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Selecting a page from the menu dismisses the menu and opens that page.
  const menuGo = useCallback((target: Exclude<Page, null>) => {
    setMenuOpen(false);
    setPage(target);
  }, []);

  return (
    <>
      <CustomCursor />

      {/* Framed expanding-column menu — draws in when the clock opens it. */}
      <PageFrame open={menuOpen} onNavigate={menuGo} onClose={closeMenu} />

      {/* The time-line clock sits on every page; clicking it opens the menu. */}
      <TimeLine onClick={toggleMenu} />

      <div inert={open}>
        <Hero />
      </div>

      {page === "services" && (
        <ServicesPage
          closing={closing}
          onRequestClose={requestClose}
          onCloseFinished={finishClose}
        />
      )}
      {page === "caseStudies" && (
        <CaseStudiesPage
          closing={closing}
          onRequestClose={requestClose}
          onCloseFinished={finishClose}
        />
      )}
      {page === "contact" && (
        <ContactPage
          closing={closing}
          onRequestClose={requestClose}
          onCloseFinished={finishClose}
        />
      )}
    </>
  );
}
