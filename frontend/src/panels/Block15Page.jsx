import RichText from "../components/RichText";
import ProduceBox from "../components/ProduceBox";
import ProgressPanel from "./ProgressPanel";
import IdiomFlashcards from "./IdiomFlashcards";
import ExamSimulator from "./ExamSimulator";

// Block 15 is a functional dashboard, not static content. Each section's
// fixed text comes from block_15.json; the live widgets are wired in by idx.
const PANELS = {
  "15.1": (props) => <ProgressPanel index={props.index} />,
  "15.2": () => <IdiomFlashcards />,
  "15.3": () => <ExamSimulator />,
};

export default function Block15Page({ block, index }) {
  return (
    <article className="block-page">
      <div className="block-kicker">{block.kicker}</div>
      <h2 className="block-title">{block.title}</h2>
      <RichText as="p" className="block-intro" html={block.intro} />

      <div className="sections">
        {block.sections.map((s) => {
          const Panel = PANELS[s.idx];
          return (
            <section className="section-card" key={s.idx}>
              <header className="section-head">
                <h3>
                  <span className="sec-idx">{s.idx}</span>
                  {s.title}
                </h3>
                {s.level && <span className="level-badge level-goflu">{s.level}</span>}
              </header>
              {s.rule && <RichText as="div" className="rule" html={s.rule} />}
              {Panel && <Panel index={index} />}
              {s.produce && <ProduceBox produce={s.produce} />}
            </section>
          );
        })}
      </div>
    </article>
  );
}
