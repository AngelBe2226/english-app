import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useProgress } from "../progress";
import RichText from "../components/RichText";

const NOTE_LABEL = { exception: "excepción", emphasis: "ojo", tip: "truco", why: "por qué" };

// Reúne todo lo marcado con el botón ★ (reglas, notas, ejemplos) en todos
// los bloques, y permite saltar de vuelta a su sección de origen.
export default function HighlightsPanel({ index, onGoToSection }) {
  const { progress } = useProgress();
  const [blocks, setBlocks] = useState(null);

  useEffect(() => {
    Promise.all(index.map((b) => api.getBlock(b.block)))
      .then(setBlocks)
      .catch(() => setBlocks([]));
  }, [index]);

  const items = useMemo(() => {
    if (!blocks) return [];
    const out = [];
    for (const blk of blocks) {
      for (const s of blk.sections || []) {
        const base = { block: blk.block, blockTitle: blk.title, idx: s.idx, secTitle: s.title };

        if (s.rule && progress[`hl:${s.idx}-rule`] != null) {
          out.push({ ...base, key: `hl:${s.idx}-rule`, kind: "regla", html: s.rule });
        }
        if (s.reasoning && progress[`hl:${s.idx}-reasoning`] != null) {
          out.push({ ...base, key: `hl:${s.idx}-reasoning`, kind: "por qué", html: s.reasoning });
        }
        (s.notes || []).forEach((n, i) => {
          const key = `hl:${s.idx}-note${i}`;
          if (progress[key] != null) {
            out.push({ ...base, key, kind: NOTE_LABEL[n.type] || "nota", html: n.text });
          }
        });
        (s.examples || []).forEach((ex, i) => {
          const key = `hl:${s.idx}-ex${i}`;
          if (progress[key] != null) {
            out.push({ ...base, key, kind: "ejemplo", en: ex.en, es: ex.es });
          }
        });
      }
    }
    return out;
  }, [blocks, progress]);

  if (!blocks) return <p className="muted center">Cargando destacados…</p>;

  return (
    <article className="block-page">
      <div className="block-kicker">Tu selección</div>
      <h2 className="block-title">Destacados</h2>
      <p className="block-intro">
        Todo lo que has marcado con <span className="hl-inline-star">★</span> en cualquier bloque,
        reunido aquí. Pulsa la estrella junto a una regla, nota o ejemplo para guardarlo, y vuelve
        a pulsarla para quitarlo.
      </p>

      {items.length === 0 ? (
        <p className="muted center">
          Aún no has destacado nada. Explora un bloque y pulsa la ★ junto a una regla, nota o
          ejemplo.
        </p>
      ) : (
        <div className="hl-list">
          {items.map((it) => (
            <div className="hl-card" key={it.key}>
              <div className="hl-card-meta">
                <span className="hl-card-tag">{it.kind}</span>
                <span className="hl-card-src">
                  {it.block} · {it.idx} {it.secTitle}
                </span>
                <button className="hl-jump" onClick={() => onGoToSection(it.block, it.idx)}>
                  Ir a la sección →
                </button>
              </div>
              {it.en ? (
                <>
                  <RichText className="ex-en" html={it.en} />
                  {it.es && <span className="ex-es">{it.es}</span>}
                </>
              ) : (
                <RichText as="div" className="hl-card-body" html={it.html} />
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
