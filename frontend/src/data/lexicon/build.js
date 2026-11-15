import { verbParts, plural, degrees } from "./inflect.js";

// Construye el diccionario a partir de los .txt (ver cabeceras de cada uno):
//   verbs   → Map verbo → { base, es, parts, tail, flags }
//   entries → Map palabra → [{ word, pos, es, extra, note }]
//   forms   → Map forma → [{ lemma, pos, tag }]  (went → go, pasado)
const lines = (raw) =>
  raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

// Variantes ortográficas británica/americana que aparecen en el contenido.
function spellingVariants(w) {
  const out = [];
  if (/is(e|es|ed|ing|ation)$/.test(w)) out.push(w.replace(/is(e|es|ed|ing|ation)$/, "iz$1"));
  if (/ys(e|es|ed|ing)$/.test(w)) out.push(w.replace(/ys(e|es|ed|ing)$/, "yz$1"));
  if (/([aeiou])ll(ed|ing|er)$/.test(w)) out.push(w.replace(/ll(ed|ing|er)$/, "l$1"));
  return out;
}

export function buildLexicon({ verbs: verbTexts, words: wordTexts }) {
  const verbs = new Map();
  const entries = new Map();
  const forms = new Map();

  const addForm = (form, lemma, pos, tag) => {
    for (const f of [form, ...spellingVariants(form)]) {
      const list = forms.get(f) || [];
      if (!list.some((x) => x.lemma === lemma && x.pos === pos && x.tag === tag)) list.push({ lemma, pos, tag });
      forms.set(f, list);
    }
  };
  const addEntry = (e) => {
    const list = entries.get(e.word) || [];
    if (!list.some((x) => x.pos === e.pos && x.es === e.es)) list.push(e);
    entries.set(e.word, list);
  };

  for (const raw of verbTexts) {
    for (const l of lines(raw)) {
      const [base, es, irr = "", tail = "", flags = ""] = l.split("|");
      if (verbs.has(base)) continue;
      const parts = verbParts(base, irr, flags);
      const v = { base, es, parts, tail, flags };
      verbs.set(base, v);
      addEntry({ word: base, pos: "v", es, extra: irr, note: "" });
      addForm(base, base, "v", "base");
      addForm(parts.s3, base, "v", "3ª persona del presente");
      const same = parts.past.join() === parts.pp.join();
      for (const p of parts.past) addForm(p, base, "v", same ? "pasado y participio" : "pasado");
      if (!same) for (const p of parts.pp) addForm(p, base, "v", "participio");
      addForm(parts.ing, base, "v", "gerundio (-ing)");
    }
  }
  // be y have: formas que las reglas no cubren.
  for (const [f, tag] of [["am", "presente (I)"], ["are", "presente (you, we, they)"], ["were", "pasado (you, we, they)"]]) addForm(f, "be", "v", tag);
  addForm("was", "be", "v", "pasado (I, he, she, it)");
  addForm("does", "do", "v", "3ª persona del presente");

  for (const raw of wordTexts) {
    for (const l of lines(raw)) {
      const [word, pos, es, extra = "", note = ""] = l.split("|");
      const e = { word, pos, es, extra, note };
      addEntry(e);
      addForm(word, word, pos, "base");
      if (pos === "n") addForm(plural(word, extra), word, pos, "plural");
      if (pos === "adj" || (pos === "adv" && extra.includes(","))) {
        const d = degrees(word, extra);
        if (d?.short) {
          addForm(d.comp, word, pos, "comparativo");
          addForm(d.sup, word, pos, "superlativo");
        }
      }
    }
  }
  return { verbs, entries, forms };
}

// Busca una palabra tal como aparece en el texto. Devuelve las lecturas
// posibles: [{ lemma, pos, tag, entry }], primero la de la propia palabra.
export function lookupWord(lex, raw) {
  let w = raw.toLowerCase().replace(/’/g, "'");
  let possessive = false;
  let hits = lex.forms.get(w);
  if (!hits && /'s$/.test(w)) {
    possessive = true;
    w = w.slice(0, -2);
    hits = lex.forms.get(w);
  } else if (!hits && /s'$/.test(w)) {
    possessive = true;
    w = w.slice(0, -1);
    hits = lex.forms.get(w);
  }
  if (!hits) return null;
  const out = [];
  for (const h of hits) {
    for (const entry of lex.entries.get(h.lemma) || []) {
      if (entry.pos !== h.pos && !(h.pos === "n" && entry.pos === "nu")) continue;
      out.push({ ...h, entry, possessive });
    }
  }
  // La lectura «base» (la palabra tal cual) va primero.
  out.sort((a, b) => (a.tag === "base" ? 0 : 1) - (b.tag === "base" ? 0 : 1));
  return out.length ? { word: raw, readings: out } : null;
}
