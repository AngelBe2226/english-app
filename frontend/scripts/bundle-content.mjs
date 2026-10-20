// Empaqueta el contenido (backend/app/content/*.json) como archivos estáticos
// en frontend/public/content/, para que la PWA funcione OFFLINE sin backend.
// Genera además search-index.json (mismo formato que /api/search-index).
// Se ejecuta como 'prebuild', así que cada 'npm run build' lo regenera.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "../../backend/app/content");
const OUT = resolve(here, "../public/content");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Copia _index.json y todos los block_*.json verbatim.
const files = readdirSync(SRC).filter((f) => f.endsWith(".json"));
for (const f of files) copyFileSync(join(SRC, f), join(OUT, f));

// Genera el search-index (block + title + sections[{idx,title,level}]).
const index = JSON.parse(readFileSync(join(SRC, "_index.json"), "utf8"));
const searchIndex = index.map((item) => {
  const block = JSON.parse(readFileSync(join(SRC, `block_${item.block}.json`), "utf8"));
  return {
    block: item.block,
    title: item.title || "",
    sections: (block.sections || []).map((s) => ({
      idx: s.idx,
      title: s.title,
      level: s.level,
    })),
  };
});
writeFileSync(join(OUT, "search-index.json"), JSON.stringify(searchIndex));

console.log(`[bundle-content] ${files.length} archivos + search-index.json → public/content/`);
