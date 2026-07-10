import { useEffect, useState } from "react";
import { api } from "./api";
import { useProgress } from "./progress";
import BlockPage from "./components/BlockPage";
import Block15Page from "./panels/Block15Page";

export default function App() {
  const { loaded, resetPrefix } = useProgress();
  const [index, setIndex] = useState([]);
  const [current, setCurrent] = useState("09"); // same default as the original site
  const [block, setBlock] = useState(null);
  const [loadingBlock, setLoadingBlock] = useState(true);

  useEffect(() => {
    api.listBlocks().then(setIndex).catch(() => setIndex([]));
  }, []);

  useEffect(() => {
    setLoadingBlock(true);
    api
      .getBlock(current)
      .then(setBlock)
      .catch(() => setBlock(null))
      .finally(() => setLoadingBlock(false));
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [current]);

  async function handleReset() {
    if (!window.confirm("¿Borrar tu progreso y respuestas de este bloque?")) return;
    await resetPrefix("b" + current + "-");
    // Idioms live under idiom:* — clear them only when resetting block 12 or 15.
    if (current === "12" || current === "15") await resetPrefix("idiom:");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">EN</span>
          <span className="brand-name">Índice de Inglés</span>
        </div>
        <nav>
          {index.map((b) => (
            <button
              key={b.block}
              className={"nav-item" + (b.block === current ? " active" : "")}
              onClick={() => setCurrent(b.block)}
            >
              <span className="nav-num">{b.block}</span>
              <span className="nav-title">{b.title}</span>
              <span className="nav-count">{b.sectionCount}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        {!loaded || loadingBlock ? (
          <p className="muted center">Cargando…</p>
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
