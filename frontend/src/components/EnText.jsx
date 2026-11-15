import { useMemo } from "react";
import { useLexicon } from "../lexiconStore";

// Texto en inglés con cada palabra conocida subrayada con línea discontinua.
// Al pasar el ratón o tocarla, WordTip muestra su significado y sus formas.
// El HTML es contenido propio (como en RichText); solo se envuelven palabras
// del texto, nunca las etiquetas. Los paréntesis en español no se tocan.
const cache = new Map();
const SPANISH = /[áéíóúñ¿¡]|\b(el|la|los|las|del|que|con|para|por|es|un|una|y|lo|al|hecho|ej|o sea)\b/i;

export function wrapWords(html, lex) {
  const key = html;
  if (cache.has(key)) return cache.get(key);
  // 1) Marca los paréntesis en español para no envolver nada dentro.
  const marked = html.replace(/\(([^()]*)\)/g, (m, inner) =>
    SPANISH.test(inner.replace(/<[^>]+>/g, "")) ? "\u0001" + m + "\u0002" : m
  );
  // 2) Recorre el texto fuera de las etiquetas.
  let skip = 0;
  const out = marked
    .split(/(<[^>]+>)/)
    .map((chunk) => {
      if (chunk.startsWith("<")) return chunk;
      return chunk.replace(/[\u0001\u0002]|&#?\w+;|[A-Za-z]+(?:['’][A-Za-z]+)*/g, (t) => {
        if (t === "\u0001") return (skip++, "");
        if (t === "\u0002") return (skip--, "");
        if (skip > 0 || t.startsWith("&")) return t;
        return lex.lookup(t) ? `<span class="w" data-w="${t}" tabindex="0">${t}</span>` : t;
      });
    })
    .join("");
  cache.set(key, out);
  return out;
}

export default function EnText({ html, as: Tag = "span", className }) {
  const lex = useLexicon();
  const content = useMemo(() => (lex ? wrapWords(html || "", lex) : html || ""), [html, lex]);
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: content }} />;
}
