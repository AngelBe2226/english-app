import { useMemo } from "react";
import RichText from "./RichText";
import SectionCard from "./SectionCard";
import { useProgress } from "../progress";

// Legend chips cycle through the role colors so each block's legend is
// visually distinct even though the JSON only carries label + description.
const LEGEND_COLORS = [
  "var(--role-subj)",
  "var(--role-obj)",
  "var(--role-poss)",
  "var(--role-refl)",
  "var(--role-place)",
];

export default function BlockPage({ block, onReset }) {
  const { getVal } = useProgress();

  const { correct, total } = useMemo(() => {
    let c = 0,
      t = 0;
    for (const s of block.sections) {
      for (const q of s.quiz || []) {
        t++;
        const saved = getVal(q.id);
        if (saved !== null && parseInt(saved, 10) === q.correctIndex) c++;
      }
    }
    return { correct: c, total: t };
  }, [block, getVal]);

  const pct = total ? Math.round((correct / total) * 100) : 0;

  return (
    <article className="block-page">
      <div className="block-kicker">{block.kicker}</div>
      <h2 className="block-title">{block.title}</h2>
      <RichText as="p" className="block-intro" html={block.intro} />

      {block.legend?.length > 0 && (
        <div className="legend">
          {block.legend.map((l, i) => (
            <span className="legend-item" key={i}>
              <span
                className="legend-dot"
                style={{ background: LEGEND_COLORS[i % LEGEND_COLORS.length] }}
              />
              <b>{l.label}</b> — {l.desc}
            </span>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="block-progress">
          <div className="track">
            <div className="fill" style={{ width: pct + "%" }} />
          </div>
          <span className="prog-text">
            {correct} / {total} aciertos · {pct}%
          </span>
          <button className="reset-btn" onClick={onReset}>
            Reiniciar bloque
          </button>
        </div>
      )}

      <div className="sections">
        {block.sections.map((s) => (
          <SectionCard key={s.idx} section={s} />
        ))}
      </div>
    </article>
  );
}
