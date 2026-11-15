import { useEffect, useState } from "react";

// Carga perezosa del diccionario: un trozo aparte del bundle que solo se pide
// la primera vez que hace falta (y queda en caché para usarlo sin conexión).
let lex = null;
let loading = null;
const waiting = new Set();

export function loadLexicon() {
  if (lex) return Promise.resolve(lex);
  if (!loading) {
    loading = import("./data/lexicon/index.js").then((m) => {
      lex = { ...m.lexicon, lookup: (w) => m.lookupWord(m.lexicon, w) };
      waiting.forEach((fn) => fn(lex));
      waiting.clear();
      return lex;
    });
  }
  return loading;
}

export function useLexicon() {
  const [value, setValue] = useState(lex);
  useEffect(() => {
    if (lex) return;
    waiting.add(setValue);
    loadLexicon();
    return () => waiting.delete(setValue);
  }, []);
  return value;
}
