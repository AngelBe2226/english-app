#!/usr/bin/env node
// Genera con OpenAI los audios que faltan y los sube a Cloudflare R2.
// Solo pide lo que no existe todavía, así que se puede lanzar siempre que se
// añada contenido: genera lo nuevo y nada más.
//
//   node scripts/audio/generate.mjs --dry-run          cuánto falta y cuánto costaría
//   node scripts/audio/generate.mjs --phase 3          lecciones, palabras y verbos básicos
//   node scripts/audio/generate.mjs                    todo (fases 1–5)
//   node scripts/audio/generate.mjs --max-chars 200000 tope de caracteres en esta pasada
//   node scripts/audio/generate.mjs --resync           rehace el registro local leyendo R2
//
// Claves en .env.local (raíz del repo, nunca se sube a git):
//   OPENAI_API_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collect, inputFiles } from "./collect.mjs";
import { r2Client } from "./r2.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const { AUDIO_VOICE, audioPath } = await import(path.join(ROOT, "frontend/src/audio/key.js"));

const MODEL = "gpt-4o-mini-tts";
const VOICE = "marin";
const INSTRUCTIONS = {
  sentence:
    "Native British English speaker (standard Southern British accent). Warm, clear and natural, like a friendly hotel professional or language teacher. Moderate pace, natural intonation.",
  passage:
    "Native British English speaker (standard Southern British accent). Read this text naturally and clearly, at a calm, moderate pace, like an audiobook narrator.",
  phrase:
    "Native British English speaker (standard Southern British accent). Read this verb form clearly and naturally, as a teacher would model it for a student. Commas are short pauses.",
  word:
    "Native British English speaker (standard Southern British accent). Say only this single English word, clearly and naturally, as in a dictionary recording. No extra words.",
};
// Estimación para el presupuesto: ~15 caracteres por segundo de voz y unos
// 0,015 $ por minuto de audio (gpt-4o-mini-tts). Orientativo: el coste real
// está en platform.openai.com → Usage.
const USD_PER_MIN = 0.015;
const secondsFor = (it) => it.text.length / 15 + 0.4;

// ---------- argumentos y configuración ----------
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const maxPhase = Number(opt("--phase", 5));
const maxChars = Number(opt("--max-chars", Infinity));
const concurrency = Number(opt("--concurrency", 6));
const quiet = flag("--quiet");
const log = (...m) => !quiet && console.log(...m);

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  const env = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return { ...env, ...process.env };
}
const env = loadEnv();

// ---------- registro local de lo ya subido ----------
const STATE_DIR = path.join(HERE, ".state");
fs.mkdirSync(STATE_DIR, { recursive: true });
const DONE_FILE = path.join(STATE_DIR, `done-${AUDIO_VOICE}.txt`);
const FAILED_FILE = path.join(STATE_DIR, `failed-${AUDIO_VOICE}.txt`);
const STAMP_FILE = path.join(STATE_DIR, `inputs-${AUDIO_VOICE}.txt`);
const readSet = (f) => new Set(fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean) : []);

const fingerprint = () =>
  inputFiles()
    .map((f) => {
      const st = fs.statSync(f);
      return `${path.basename(f)}:${st.size}:${Math.round(st.mtimeMs)}`;
    })
    .join("|") + `|phase${maxPhase}`;

// Pasada automática sin cambios desde la última completa: no hace nada.
if (flag("--if-changed") && fs.existsSync(STAMP_FILE) && fs.readFileSync(STAMP_FILE, "utf8") === fingerprint()) {
  process.exit(0);
}

const r2 =
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET
    ? r2Client({
        accountId: env.R2_ACCOUNT_ID,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket: env.R2_BUCKET,
      })
    : null;

if (flag("--resync")) {
  if (!r2) throw new Error("Faltan las claves de R2 en .env.local");
  const keys = await r2.list(`${AUDIO_VOICE}/`);
  const ids = keys.map((k) => k.split("/").pop().replace(/\.mp3$/, ""));
  fs.writeFileSync(DONE_FILE, ids.join("\n") + "\n");
  log(`Registro rehecho desde R2: ${ids.length} audios.`);
}

const done = readSet(DONE_FILE);
const all = collect().filter((it) => it.phase <= maxPhase);
const pending = all.filter((it) => !done.has(it.key));

// ---------- resumen ----------
const summary = (list) => {
  const by = {};
  for (const it of list) {
    const p = (by[it.phase] ||= { audios: 0, caracteres: 0, minutos: 0 });
    p.audios++;
    p.caracteres += it.text.length;
    p.minutos += secondsFor(it) / 60;
  }
  for (const p of Object.values(by)) {
    p.coste_usd = +(p.minutos * USD_PER_MIN).toFixed(2);
    p.minutos = Math.round(p.minutos);
  }
  return by;
};
log(`Voz ${AUDIO_VOICE} · ${all.length} audios en las fases 1–${maxPhase} · hechos ${all.length - pending.length} · faltan ${pending.length}`);
if (pending.length) log(summary(pending));

if (flag("--dry-run")) process.exit(0);
if (!pending.length) {
  fs.writeFileSync(STAMP_FILE, fingerprint());
  log("Todo al día.");
  process.exit(0);
}
if (!env.OPENAI_API_KEY) throw new Error("Falta OPENAI_API_KEY en .env.local");
if (!r2) throw new Error("Faltan las claves de R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET) en .env.local");

// ---------- generación ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function synthesize(it) {
  for (let attempt = 0; attempt < 7; attempt++) {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
        input: it.text,
        instructions: INSTRUCTIONS[it.kind] || INSTRUCTIONS.sentence,
        response_format: "mp3",
      }),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const detail = (await res.text()).slice(0, 300);
    // Sin saldo o clave inválida: no tiene sentido seguir.
    if (res.status === 401 || /insufficient_quota|billing/i.test(detail)) {
      const e = new Error(`OpenAI ${res.status}: ${detail}`);
      e.fatal = true;
      throw e;
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(Math.min(60000, 1500 * 2 ** attempt) + Math.random() * 500);
      continue;
    }
    throw new Error(`OpenAI ${res.status}: ${detail}`);
  }
  throw new Error("OpenAI: demasiados reintentos");
}

let chars = 0;
let made = 0;
let failed = 0;
let stop = false;
const started = Date.now();
const queue = pending.slice();

async function worker() {
  while (!stop && queue.length) {
    const it = queue.shift();
    if (chars + it.text.length > maxChars) {
      stop = true;
      break;
    }
    chars += it.text.length;
    try {
      const mp3 = await synthesize(it);
      await r2.put(audioPath(it.text), mp3, "audio/mpeg");
      fs.appendFileSync(DONE_FILE, it.key + "\n");
      made++;
      if (made % 250 === 0) {
        const rate = made / ((Date.now() - started) / 60000);
        log(`  ${made}/${pending.length} · ${rate.toFixed(0)} por minuto · quedan ~${Math.round((pending.length - made) / rate)} min`);
      }
    } catch (e) {
      failed++;
      fs.appendFileSync(FAILED_FILE, `${new Date().toISOString()}\t${it.key}\t${it.text.slice(0, 80)}\t${e.message}\n`);
      if (e.fatal) {
        stop = true;
        console.error(e.message);
      }
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
const finished = !stop && made + failed === pending.length && failed === 0;
if (finished) fs.writeFileSync(STAMP_FILE, fingerprint());
console.log(
  `Hecho: ${made} audios nuevos, ${failed} fallos, ${chars} caracteres en ${Math.round((Date.now() - started) / 60000)} min.` +
    (stop ? " Pasada detenida (tope de caracteres o error grave)." : "") +
    (failed ? ` Fallos en ${path.relative(ROOT, FAILED_FILE)}.` : "")
);
