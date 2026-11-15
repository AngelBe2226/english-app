// Diccionario de la app (se carga bajo demanda: es un trozo aparte del bundle).
import irregular from "./verbs-irregular.txt?raw";
import regular from "./verbs-regular.txt?raw";
import grammar from "./grammar.txt?raw";
import wordsAL from "./words-a-l.txt?raw";
import wordsMZ from "./words-m-z.txt?raw";
import { buildLexicon } from "./build.js";

export { lookupWord } from "./build.js";
export const lexicon = buildLexicon({ verbs: [irregular, regular], words: [grammar, wordsAL, wordsMZ] });
