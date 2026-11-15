// Morfología del inglés: formas de verbos, plurales y grados del adjetivo.
// Ortografía británica (travelled, cancelled), que es la del contenido.

const VOWEL = /[aeiou]/;

function syllables(w) {
  const groups = w.replace(/qu/g, "q").replace(/e$/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

// ¿Se dobla la consonante final? (stop → stopped, travel → travelled)
export function doubles(base, flags = "") {
  if (flags.includes("d")) return true;
  const w = base.replace(/qu/g, "q");
  // Británico: vocal simple + l se dobla (travel, cancel, control, label).
  if (/[^aeiou][aeiou]l$/.test(w) && w.length > 3) return true;
  // Monosílabo terminado en consonante-vocal-consonante (no w, x, y).
  return syllables(w) === 1 && /(^|[^aeiou])[aeiou][bcdfgklmnprstvz]$/.test(w);
}

export function thirdPerson(base) {
  if (base === "be") return "is";
  if (base === "have") return "has";
  if (/(s|x|z|ch|sh|o)$/.test(base)) return base + "es";
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
  return base + "s";
}

export function ingForm(base, flags = "") {
  if (base === "be") return "being";
  if (/ie$/.test(base)) return base.slice(0, -2) + "ying";
  if (/(ee|ye|oe)$/.test(base)) return base + "ing";
  if (/[^aeiou]e$/.test(base) || /[aeiou]{1}[^aeiou]e$/.test(base) || /ue$/.test(base)) return base.slice(0, -1) + "ing";
  if (doubles(base, flags)) return base + base.slice(-1) + "ing";
  return base + "ing";
}

export function edForm(base, flags = "") {
  if (/e$/.test(base)) return base + "d";
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ied";
  if (doubles(base, flags)) return base + base.slice(-1) + "ed";
  return base + "ed";
}

// Formas principales de un verbo. `irr` = "pasado,participio[,gerundio]" con
// alternativas separadas por «/» (burnt/burned).
export function verbParts(base, irr = "", flags = "") {
  const [p, pp, ing] = (irr || "").split(",");
  const past = p ? p.split("/") : [edForm(base, flags)];
  const part = pp ? pp.split("/") : past.slice();
  return {
    base,
    s3: thirdPerson(base),
    past,
    pp: part,
    ing: ing || ingForm(base, flags),
    irregular: Boolean(irr),
  };
}

export function plural(noun, irr = "") {
  if (irr) return irr;
  if (/(s|x|z|ch|sh)$/.test(noun)) return noun + "es";
  if (/[^aeiou]y$/.test(noun)) return noun.slice(0, -1) + "ies";
  return noun + "s";
}

// Comparativo y superlativo. extra: "better,best" · "er" · "more" · "-"
export function degrees(adj, extra = "") {
  if (extra === "-") return null;
  if (extra && extra.includes(",")) {
    const [c, s] = extra.split(",");
    return { comp: c, sup: s, short: true };
  }
  const n = syllables(adj);
  const takesEr = extra === "er" || (extra !== "more" && (n === 1 || (n === 2 && /y$/.test(adj))));
  if (!takesEr) return { comp: "more " + adj, sup: "most " + adj, short: false };
  let stem = adj;
  if (/[^aeiou]y$/.test(adj)) stem = adj.slice(0, -1) + "i";
  else if (/e$/.test(adj)) stem = adj.slice(0, -1);
  else if (n === 1 && /(^|[^aeiou])[aeiou][bcdfgklmnprstvz]$/.test(adj)) stem = adj + adj.slice(-1);
  return { comp: stem + "er", sup: stem + "est", short: true };
}

export { VOWEL, syllables };
