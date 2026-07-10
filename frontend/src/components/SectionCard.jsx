import RichText from "./RichText";
import Table from "./Table";
import Quiz from "./Quiz";
import ProduceBox from "./ProduceBox";

// A subtopic card: heading + level badge, the rule, optional "reasoning"
// (the pedagogical why), examples, reference tables, quizzes, produce box.
export default function SectionCard({ section }) {
  const level = (section.level || "").toLowerCase();
  return (
    <section className="section-card" id={`sec-${section.idx.replace(/\./g, "-")}`}>
      <header className="section-head">
        <h3>
          <span className="sec-idx">{section.idx}</span>
          {section.title}
        </h3>
        {section.level && <span className={`level-badge level-${level}`}>{section.level}</span>}
      </header>

      {section.rule && <RichText as="div" className="rule" html={section.rule} />}

      {section.reasoning && (
        <div className="reasoning">
          <span className="reasoning-tag">por qué</span>
          <RichText as="div" html={section.reasoning} />
        </div>
      )}

      {section.examples?.length > 0 && (
        <ul className="examples">
          {section.examples.map((ex, i) => (
            <li key={i}>
              <RichText className="ex-en" html={ex.en} />
              {ex.es && <span className="ex-es">{ex.es}</span>}
            </li>
          ))}
        </ul>
      )}

      {section.tables?.map((t, i) => (
        <Table key={i} table={t} />
      ))}

      {section.quiz?.length > 0 && (
        <div className="quizzes">
          {section.quiz.map((q) => (
            <Quiz key={q.id} q={q} />
          ))}
        </div>
      )}

      {section.produce && <ProduceBox produce={section.produce} />}
    </section>
  );
}
