import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import { Hero } from "./components/Hero";
import { NavBar } from "./components/NavBar";
import { ServicesPage } from "./components/ServicesPage";
import { CaseStudiesPage } from "./components/CaseStudiesPage";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

type Page = "services" | "caseStudies" | null;

export default function App() {
  const [page, setPage] = useState<Page>(null);
  const [closing, setClosing] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const open = page !== null;

  const openServices = useCallback(() => setPage("services"), []);
  const openCaseStudies = useCallback(() => setPage("caseStudies"), []);

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

  return (
    <>
      <NavBar onServices={openServices} onCaseStudies={openCaseStudies} />
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
    </>
  );
}
