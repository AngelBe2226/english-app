import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";

function Chevron() {
  return (
    <svg className="chev" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Normaliza para buscar sin importar acentos ni mayúsculas.
const norm = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Sidebar en cascada: cada capítulo (bloque) tiene un chevrón para desplegar
// sus epígrafes. Acordeón: al abrir uno se cierra el que estuviera abierto.
// Arriba, un buscador que filtra bloques y secciones de toda la app.
export default function Sidebar({ index, current, onSelectBlock, onGoToSection }) {
  const [expanded, setExpanded] = useState(current);
  const [secCache, setSecCache] = useState({});
  const [query, setQuery] = useState("");
  const [searchIdx, setSearchIdx] = useState(null);
  const inputRef = useRef(null);

  // El capítulo actual se abre solo al cambiar de bloque.
  useEffect(() => {
    setExpanded(current);
  }, [current]);

  // Índice de búsqueda (bloques + secciones), una sola vez.
  useEffect(() => {
    api.searchIndex().then(setSearchIdx).catch(() => setSearchIdx([]));
  }, []);

  // Carga perezosa de los epígrafes del capítulo abierto.
  useEffect(() => {
    if (expanded && expanded !== "highlights" && !secCache[expanded]) {
      api
        .getBlock(expanded)
        .then((d) =>
          setSecCache((c) => ({
            ...c,
            [expanded]: d.sections.map((s) => ({ idx: s.idx, title: s.title })),
          }))
        )
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Atajo "/" para enfocar el buscador (si no estás escribiendo en otro campo).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey)
        return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))
        return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (block) => setExpanded((prev) => (prev === block ? null : block));

  const q = query.trim();

  // Resultados planos: bloques y secciones que casan con la consulta.
  const results = useMemo(() => {
    if (!q || !searchIdx) return [];
    const nq = norm(q);
    const out = [];
    for (const b of searchIdx) {
      if (norm(b.title).includes(nq) || norm(b.block).includes(nq))
        out.push({ type: "block", block: b.block, title: b.title });
      for (const s of b.sections || []) {
        if (norm(s.title).includes(nq) || norm(s.idx).includes(nq))
          out.push({
            type: "section",
            block: b.block,
            idx: s.idx,
            title: s.title,
            level: s.level,
          });
      }
    }
    return out.slice(0, 60);
  }, [q, searchIdx]);

  function selectResult(r) {
    if (r.type === "block") onSelectBlock(r.block);
    else onGoToSection(r.block, r.idx);
    setQuery("");
  }

  const searching = q.length > 0;

  return (
    <>
      <div className="nav-search">
        <svg className="nav-search-icon" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          className="nav-search-input"
          placeholder="Buscar…  ( / )"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setQuery("");
              e.currentTarget.blur();
            } else if (e.key === "Enter" && results.length) {
              selectResult(results[0]);
            }
          }}
          aria-label="Buscar en el índice"
        />
        {searching && (
          <button
            className="nav-search-clear"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>

      {searching ? (
        <div className="search-results">
          {!searchIdx ? (
            <div className="nav-sub muted">Cargando índice…</div>
          ) : results.length === 0 ? (
            <div className="search-empty">Sin resultados para «{q}»</div>
          ) : (
            <>
              <div className="search-count">
                {results.length} resultado{results.length === 1 ? "" : "s"}
              </div>
              {results.map((r, i) => (
                <button
                  key={(r.type === "block" ? "b" : "s") + r.block + (r.idx || "") + i}
                  className={"search-result" + (r.type === "block" ? " is-block" : "")}
                  onClick={() => selectResult(r)}
                >
                  <span className="sr-num">{r.type === "block" ? r.block : r.idx}</span>
                  <span className="sr-title">{r.title}</span>
                  {r.type === "block" && <span className="sr-kind">bloque</span>}
                </button>
              ))}
            </>
          )}
        </div>
      ) : (
        <>
          <button
            className={"nav-pin" + (current === "highlights" ? " current" : "")}
            onClick={() => onSelectBlock("highlights")}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path
                d="M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 17.6l-6.1 3.1 1.5-6.7-5.1-4.6 6.8-.7z"
                fill={current === "highlights" ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            Destacados
          </button>

          <nav className="toc">
            {index.map((b) => {
              const open = expanded === b.block;
              const sections = secCache[b.block];
              return (
                <div className={"nav-chapter" + (open ? " open" : "")} key={b.block}>
                  <div className={"nav-row" + (b.block === current ? " current" : "")}>
                    <button className="nav-item" onClick={() => onSelectBlock(b.block)}>
                      <span className="nav-num">{b.block}</span>
                      <span className="nav-title">{b.title}</span>
                    </button>
                    <button
                      className="nav-chevron"
                      aria-expanded={open}
                      aria-label={open ? "Contraer capítulo" : "Expandir capítulo"}
                      onClick={() => toggle(b.block)}
                    >
                      <Chevron />
                    </button>
                  </div>

                  {open && (
                    <div className="nav-sections">
                      {sections ? (
                        sections.map((s) => (
                          <button
                            key={s.idx}
                            className="nav-sub"
                            onClick={() => onGoToSection(b.block, s.idx)}
                          >
                            <span className="sub-idx">{s.idx}</span>
                            <span className="sub-title">{s.title}</span>
                          </button>
                        ))
                      ) : (
                        <div className="nav-sub muted">Cargando…</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </>
      )}
    </>
  );
}
