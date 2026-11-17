// Reúne todo lo que la app puede leer en voz alta, en el mismo formato que
// usa al reproducir (normText/audioKey), ordenado por prioridad:
//   1 lecciones  · ejemplos, diálogos, lecturas, traducciones, repaso, idioms
//   2 palabras   · cada palabra de los textos con ficha + todo el diccionario
//   3 verbos     · formas, ejemplos en afirmativa (activa), formas no personales, modales
//   4 verbos+    · ejemplos en negativa y pregunta, y toda la voz pasiva
//   5 tablas     · cada fila de cada tabla de conjugación
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "frontend/src");
const CONTENT = path.join(ROOT, "backend/app/content");
const LEX = path.join(SRC, "data/lexicon");

const { normText, audioKey } = await import(path.join(SRC, "audio/key.js"));
const { buildLexicon, lookupWord } = await import(path.join(LEX, "build.js"));
const C = await import(path.join(LEX, "conjugate.js"));
const { VOCAB } = await import(path.join(SRC, "data/vocab.js"));
const { IDIOMS } = await import(path.join(SRC, "data/idioms.js"));
const { MODALS } = await import(path.join(SRC, "data/modals.js"));

// Archivos de los que sale el audio: si no cambian, no hay nada nuevo.
export function inputFiles() {
  const list = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".json")).map((f) => path.join(CONTENT, f));
  for (const f of fs.readdirSync(LEX)) list.push(path.join(LEX, f));
  for (const f of ["data/vocab.js", "data/idioms.js", "data/modals.js", "audio/key.js"]) list.push(path.join(SRC, f));
  return list.sort();
}

const read = (f) => fs.readFileSync(path.join(LEX, f), "utf8");

export function collect() {
  const lex = buildLexicon({
    verbs: [read("verbs-irregular.txt"), read("verbs-regular.txt")],
    words: [read("grammar.txt"), read("words-a-l.txt"), read("words-m-z.txt")],
  });
  const items = new Map(); // key → { text, phase, kind }
  const add = (raw, phase, kind) => {
    const text = normText(raw);
    if (!text || !/[A-Za-z]/.test(text)) return;
    const key = audioKey(text);
    const prev = items.get(key);
    if (!prev || prev.phase > phase) items.set(key, { key, text, phase, kind });
  };

  // ---- 1 · lecciones (+ textos de donde salen las palabras) ----
  const wordSources = [];
  for (const f of fs.readdirSync(CONTENT).filter((f) => /^block_\d+\.json$/.test(f)).sort()) {
    const b = JSON.parse(fs.readFileSync(path.join(CONTENT, f), "utf8"));
    for (const s of b.sections || []) {
      for (const e of s.examples || []) add(e.en, 1, "sentence"), wordSources.push(e.en);
      for (const t of s.dialogue || []) add(t.en, 1, "sentence"), wordSources.push(t.en);
      if (s.reading?.text) add(s.reading.text, 1, "passage"), wordSources.push(s.reading.text);
      for (const g of s.reading?.glossary || []) wordSources.push(g.en);
      for (const t of s.translate || []) add(t.en, 1, "sentence"), wordSources.push(t.en);
      for (const it of s.analysis?.items || []) wordSources.push((it.parts || []).map((p) => p.t).join(" "));
      if (s.produce?.model) wordSources.push(s.produce.model);
    }
  }
  for (const v of VOCAB) add(v.en, 1, "sentence");
  for (const [, idiom] of IDIOMS) add(idiom, 1, "sentence");

  // ---- 2 · palabras ----
  for (const src of wordSources) {
    const plain = String(src).replace(/<[^>]*>/g, " ").replace(/&\w+;/g, " ");
    for (const tok of plain.match(/(?<![0-9A-Za-z])[A-Za-z]+(?:['’][A-Za-z]+)*(?![0-9])/g) || []) {
      if (lookupWord(lex, tok)) add(tok, 2, "word");
    }
  }
  for (const form of lex.forms.keys()) add(form, 2, "word");
  for (const word of lex.entries.keys()) add(word, 2, "word");

  // ---- 3, 4, 5 · verbos ----
  for (const v of lex.verbs.values()) {
    const V = v.parts;
    for (const f of [V.base, V.s3, V.ing, ...V.past, ...V.pp]) add(f, 3, "word");
    const stative = v.flags.includes("s");
    const transitive = v.flags.includes("t");
    let i = 0;
    for (const g of C.TENSES) {
      for (const t of g.items) {
        for (const mode of ["aff", "neg", "q"]) {
          const c = C.conjugateTense(V, t.id, { mode, tail: v.tail, index: i, stative });
          if (c.example) add(c.example, mode === "aff" ? 3 : 4, "sentence");
          for (const r of c.rows) add(C.rowSpeech(r.text), 5, "phrase");
          if (transitive && C.PASSIVE_TENSES.includes(t.id)) {
            const p = C.conjugateTense(V, t.id, { mode, passive: true, tail: v.tail });
            if (p.example) add(p.example, 4, "sentence");
            for (const r of p.rows) add(C.rowSpeech(r.text), 5, "phrase");
          }
        }
        i++;
      }
    }
    for (const passive of transitive ? [false, true] : [false]) {
      for (const o of C.otherForms(V, { passive, tail: v.tail })) {
        add(o.example, passive ? 4 : 3, "sentence");
        for (const [, value] of o.rows) add(C.rowSpeech(value), 5, "phrase");
      }
    }
  }
  for (const m of MODALS) {
    add(m.base, 3, "word");
    add(m.ex, 3, "sentence");
    add(C.rowSpeech(`I / she / they ${m.base} work`), 5, "phrase");
    add(C.rowSpeech(`I / she / they ${m.neg.split(" (")[0]} work`), 5, "phrase");
    add(m.base === "ought to" ? "Ought I to work?" : `${m.base[0].toUpperCase() + m.base.slice(1)} I / she / they work?`, 5, "phrase");
  }

  return [...items.values()].sort((a, b) => a.phase - b.phase);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = collect();
  const by = {};
  for (const it of all) (by[it.phase] ||= { clips: 0, chars: 0 }), by[it.phase].clips++, (by[it.phase].chars += it.text.length);
  console.log(by, "total", all.length);
}
