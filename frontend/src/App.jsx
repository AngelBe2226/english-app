import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useProgress } from "./progress";
import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";
import BlockPage from "./components/BlockPage";
import Block15Page from "./panels/Block15Page";
import HighlightsPanel from "./panels/HighlightsPanel";
import PlacementTest from "./panels/PlacementTest";
import CambridgeExam from "./panels/CambridgeExam";
import SrsReview from "./panels/SrsReview";
import HomePage, { LAST_BLOCK_KEY } from "./panels/HomePage";
import { LoadingSkeleton, ErrorState } from "./components/StateViews";

// Vistas que no son bloques de contenido (no se cargan del API).
const PANELS = new Set(["home", "highlights", "placement", "cambridge", "srs"]);

function scrollToSection(idx) {
  const el = document.getElementById("sec-" + idx.replace(/\./g, "-"));
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function App() {
  const { loaded, resetPrefix } = useProgress();
  const [index, setIndex] = useState([]);
  const [current, setCurrent] = useState("home");
  const [block, setBlock] = useState(null);
  const [loadingBlock, setLoadingBlock] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);
  const pendingSection = useRef(null);

  useEffect(() => {
    api.listBlocks().then(setIndex).catch(() => setIndex([]));
  }, []);

  useEffect(() => {
    if (PANELS.has(current)) {
      setBlock(null);
      setLoadingBlock(false);
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    setLoadingBlock(true);
    api
      .getBlock(current)
      .then((data) => {
        setBlock(data);
        // Recordar el último bloque abierto para "continúa donde lo dejaste".
        try {
          localStorage.setItem(LAST_BLOCK_KEY, current);
        } catch {
          /* modo privado: no pasa nada */
        }
        // After the new block renders, jump to a requested section or the top.
        requestAnimationFrame(() => {
          if (pendingSection.current) {
            scrollToSection(pendingSection.current);
            pendingSection.current = null;
          } else {
            window.scrollTo({ top: 0, behavior: "instant" });
          }
        });
      })
      .catch(() => setBlock(null))
      .finally(() => setLoadingBlock(false));
  }, [current, reloadNonce]);

  function goToSection(targetBlock, idx) {
    if (targetBlock === current) {
      scrollToSection(idx); // already loaded — scroll now
    } else {
      pendingSection.current = idx; // scroll once the new block has rendered
      setCurrent(targetBlock);
    }
  }

  async function handleReset() {
    if (!window.confirm("¿Borrar tu progreso y respuestas de este bloque?")) return;
    await resetPrefix("b" + current + "-");
    if (current === "12" || current === "15") await resetPrefix("idiom:");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <button className="brand" onClick={() => setCurrent("home")} aria-label="Ir al inicio">
          <span className="brand-mark">En</span>
          <span className="brand-name">Índice de Inglés</span>
        </button>
        <Sidebar
          index={index}
          current={current}
          onSelectBlock={setCurrent}
          onGoToSection={goToSection}
        />
        <ThemeToggle />
      </aside>

      <main className="content">
        {!loaded || loadingBlock ? (
          <LoadingSkeleton />
        ) : current === "home" ? (
          <HomePage index={index} onSelectBlock={setCurrent} />
        ) : current === "highlights" ? (
          <HighlightsPanel index={index} onGoToSection={goToSection} />
        ) : current === "placement" ? (
          <PlacementTest index={index} onSelectBlock={setCurrent} onGoToSection={goToSection} />
        ) : current === "cambridge" ? (
          <CambridgeExam />
        ) : current === "srs" ? (
          <SrsReview />
        ) : !block ? (
          <ErrorState blockId={current} onRetry={() => setReloadNonce((n) => n + 1)} />
        ) : current === "15" ? (
          <Block15Page block={block} index={index} />
        ) : (
          <BlockPage block={block} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
