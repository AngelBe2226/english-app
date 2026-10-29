import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useProgress } from "./progress";
import { K_LAST_BLOCK } from "./keys";
import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";
import SyncStatus from "./components/SyncStatus";
import BlockPage from "./components/BlockPage";
import Block15Page from "./panels/Block15Page";
import HighlightsPanel from "./panels/HighlightsPanel";
import PlacementTest from "./panels/PlacementTest";
import CambridgeExam from "./panels/CambridgeExam";
import SrsReview from "./panels/SrsReview";
import HomePage from "./panels/HomePage";
import SyncPanel from "./panels/SyncPanel";
import { LoadingSkeleton, ErrorState } from "./components/StateViews";

// Vistas que no son bloques de contenido (no se cargan del API).
const PANELS = new Set(["home", "highlights", "placement", "cambridge", "srs", "sync"]);
const PANEL_TITLES = {
  home: "Inicio",
  highlights: "Destacados",
  placement: "Test de nivel",
  cambridge: "Simulacro Cambridge",
  srs: "Repaso diario",
  sync: "Sincronizar",
};

function scrollToSection(idx) {
  const el = document.getElementById("sec-" + idx.replace(/\./g, "-"));
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Iconos de la barra de pestañas (trazo, heredan color).
const ICONS = {
  home: "M4 11l8-6.5 8 6.5M6.5 9.5V19h4v-5h3v5h4V9.5",
  toc: "M5 6h14M5 12h14M5 18h9",
  srs: "M4 12a8 8 0 1 0 2.4-5.7M4 4.5v3.8h3.8",
  star: "M12 3.5l2.6 5.5 6 .6-4.5 4.1 1.3 5.9L12 16.7l-5.4 2.9 1.3-5.9-4.5-4.1 6-.6z",
};
function Icon({ d, size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const { loaded, resetPrefix, setVal } = useProgress();
  const [index, setIndex] = useState([]);
  const [current, setCurrent] = useState("home");
  const [block, setBlock] = useState(null);
  const [loadingBlock, setLoadingBlock] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingSection = useRef(null);
  const burgerRef = useRef(null);
  const drawerCloseRef = useRef(null);
  const touchStart = useRef(null);
  const setValRef = useRef(setVal);
  setValRef.current = setVal;

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
        // Recordar el último bloque abierto ("continúa donde lo dejaste"),
        // también en los demás dispositivos.
        setValRef.current(K_LAST_BLOCK, current);
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

  // ---------- cajón (menú hamburguesa) ----------
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("menu-lock", menuOpen); // sin scroll del fondo
    if (menuOpen) {
      drawerCloseRef.current?.focus({ preventScroll: true });
      const onKey = (e) => e.key === "Escape" && closeMenu();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    // Devolver el foco al botón que abrió el menú (accesibilidad).
    requestAnimationFrame(() => burgerRef.current?.focus({ preventScroll: true }));
  }

  // Deslizar a la izquierda para cerrar el cajón.
  function onTouchStart(e) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e) {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s || !menuOpen) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    if (dx < -60 && Math.abs(t.clientY - s.y) < Math.abs(dx)) closeMenu();
  }

  function go(view) {
    setCurrent(view);
    setMenuOpen(false);
  }

  function goToSection(targetBlock, idx) {
    setMenuOpen(false);
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

  const isBlock = !PANELS.has(current);
  const viewTitle = isBlock
    ? index.find((b) => b.block === current)?.title || `Bloque ${current}`
    : PANEL_TITLES[current];

  return (
    <div className={"layout" + (menuOpen ? " menu-open" : "")}>
      {/* Barra superior (solo móvil) */}
      <header className="mobilebar">
        <button
          ref={burgerRef}
          className="mb-icon"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls="app-nav"
        >
          <Icon d="M4 7h16M4 12h16M4 17h16" />
        </button>
        <button className="mb-brand" onClick={() => go("home")} aria-label="Ir al inicio">
          <span className="brand-mark">En</span>
          <span className="mb-title">{viewTitle}</span>
        </button>
        <SyncStatus compact onOpen={() => go("sync")} />
      </header>

      <div className="drawer-scrim" onClick={closeMenu} aria-hidden="true" />

      <aside
        id="app-nav"
        className="sidebar"
        aria-label="Menú"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button className="brand" onClick={() => go("home")} aria-label="Ir al inicio">
          <span className="brand-mark">En</span>
          <span className="brand-name">Índice de Inglés</span>
        </button>
        <button ref={drawerCloseRef} className="drawer-close" onClick={closeMenu} aria-label="Cerrar menú">
          <Icon d="M6 6l12 12M18 6L6 18" size={20} />
        </button>
        <Sidebar index={index} current={current} onSelectBlock={go} onGoToSection={goToSection} />
        <div className="sidebar-foot">
          <SyncStatus onOpen={() => go("sync")} />
          <ThemeToggle />
        </div>
      </aside>

      <main className="content">
        {!loaded || loadingBlock ? (
          <LoadingSkeleton />
        ) : current === "home" ? (
          <HomePage index={index} onSelectBlock={go} />
        ) : current === "highlights" ? (
          <HighlightsPanel index={index} onGoToSection={goToSection} />
        ) : current === "placement" ? (
          <PlacementTest index={index} onSelectBlock={go} onGoToSection={goToSection} />
        ) : current === "cambridge" ? (
          <CambridgeExam />
        ) : current === "srs" ? (
          <SrsReview />
        ) : current === "sync" ? (
          <SyncPanel />
        ) : !block ? (
          <ErrorState blockId={current} onRetry={() => setReloadNonce((n) => n + 1)} />
        ) : current === "15" ? (
          <Block15Page block={block} index={index} />
        ) : (
          <BlockPage block={block} onReset={handleReset} />
        )}
      </main>

      {/* Pestañas inferiores (solo móvil): destinos frecuentes al alcance del pulgar */}
      <nav className="tabbar" aria-label="Navegación principal">
        <button className={"tab" + (current === "home" ? " active" : "")} onClick={() => go("home")}>
          <Icon d={ICONS.home} />
          <span>Inicio</span>
        </button>
        <button
          className={"tab" + (isBlock ? " active" : "")}
          onClick={() => setMenuOpen(true)}
          aria-controls="app-nav"
          aria-expanded={menuOpen}
        >
          <Icon d={ICONS.toc} />
          <span>Temario</span>
        </button>
        <button className={"tab" + (current === "srs" ? " active" : "")} onClick={() => go("srs")}>
          <Icon d={ICONS.srs} />
          <span>Repaso</span>
        </button>
        <button className={"tab" + (current === "highlights" ? " active" : "")} onClick={() => go("highlights")}>
          <Icon d={ICONS.star} />
          <span>Destacados</span>
        </button>
      </nav>
    </div>
  );
}
