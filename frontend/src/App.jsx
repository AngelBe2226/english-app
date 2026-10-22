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

function scrollToSection(idx) {
  const el = document.getElementById("sec-" + idx.replace(/\./g, "-"));
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function App() {
  const { loaded, resetPrefix } = useProgress();
  const [index, setIndex] = useState([]);
  const [current, setCurrent] = useState("09"); // same default as the original site
  const [block, setBlock] = useState(null);
  const [loadingBlock, setLoadingBlock] = useState(true);
  const pendingSection = useRef(null);

  useEffect(() => {
    api.listBlocks().then(setIndex).catch(() => setIndex([]));
  }, []);

  useEffect(() => {
    if (current === "highlights" || current === "placement" || current === "cambridge") {
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
  }, [current]);

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
        <div className="brand">
          <span className="brand-mark">EN</span>
          <span className="brand-name">Índice de Inglés</span>
        </div>
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
          <p className="muted center">Cargando…</p>
        ) : current === "highlights" ? (
          <HighlightsPanel index={index} onGoToSection={goToSection} />
        ) : current === "placement" ? (
          <PlacementTest index={index} onSelectBlock={setCurrent} onGoToSection={goToSection} />
        ) : current === "cambridge" ? (
          <CambridgeExam />
        ) : !block ? (
          <p className="muted center">No se pudo cargar el bloque {current}.</p>
        ) : current === "15" ? (
          <Block15Page block={block} index={index} />
        ) : (
          <BlockPage block={block} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
