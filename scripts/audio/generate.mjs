#!/usr/bin/env node
// Genera los audios que faltan y los sube a Cloudflare R2. Solo crea lo que
// no existe todavía, así que se puede lanzar siempre que se añada contenido.
//
// Voz: Kokoro en este Mac (gratis; ver kokoro_tts.py). Opcional: OpenAI
// poniendo AUDIO_PROVIDER=openai y OPENAI_API_KEY en .env.local.
//
//   node scripts/audio/generate.mjs --dry-run          cuánto falta (y cuánto tardaría)
//   node scripts/audio/generate.mjs --phase 3          lecciones, palabras y verbos básicos
//   node scripts/audio/generate.mjs                    todo (fases 1–5)
//   node scripts/audio/generate.mjs --max-chars 200000 tope de caracteres en esta pasada
//   node scripts/audio/generate.mjs --resync           rehace el registro local leyendo R2
//
// Sin claves de R2, los MP3 se quedan en scripts/audio/.cache y se suben en
// la siguiente pasada que tenga las claves.
// Claves en .env.local (raíz del repo, nunca se sube a git):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { collect, inputFiles } from "./collect.mjs";
import { r2Client } from "./r2.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const { AUDIO_VOICE, audioPath } = await import(path.join(ROOT, "frontend/src/audio/key.js"));

// ---------- argumentos y configuración ----------
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const maxPhase = Number(opt("--phase", 5));
const maxChars = Number(opt("--max-chars", Infinity));
const quiet = flag("--quiet");
const log = (...m) => !quiet && console.log(...m);

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  const env = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && m[2] !== "") env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return { ...env, ...process.env };
}
const env = loadEnv();
const PROVIDER = env.AUDIO_PROVIDER || "kokoro";
const KOKORO_VOICE = env.KOKORO_VOICE || "af_heart";
const MIN_FREE_GB = 3; // no llenar el disco del Mac

// ---------- registro local ----------
const STATE_DIR = path.join(HERE, ".state");
const CACHE_DIR = path.join(HERE, ".cache", AUDIO_VOICE);
fs.mkdirSync(STATE_DIR, { recursive: true });
fs.mkdirSync(CACHE_DIR, { recursive: true });
const DONE_FILE = path.join(STATE_DIR, `done-${AUDIO_VOICE}.txt`);
const FAILED_FILE = path.join(STATE_DIR, `failed-${AUDIO_VOICE}.txt`);
const STAMP_FILE = path.join(STATE_DIR, `inputs-${AUDIO_VOICE}.txt`);
const readSet = (f) => new Set(fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean) : []);
const cachedFile = (key) => path.join(CACHE_DIR, `${key}.mp3`);

const fingerprint = () =>
  inputFiles()
    .map((f) => {
      const st = fs.statSync(f);
      return `${path.basename(f)}:${st.size}:${Math.round(st.mtimeMs)}`;
    })
    .join("|") + `|phase${maxPhase}`;

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
  fs.writeFileSync(DONE_FILE, ids.join("\n") + (ids.length ? "\n" : ""));
  log(`Registro rehecho desde R2: ${ids.length} audios.`);
}

const done = readSet(DONE_FILE);
const all = collect().filter((it) => it.phase <= maxPhase);
const pending = all.filter((it) => !done.has(it.key));
const cached = pending.filter((it) => fs.existsSync(cachedFile(it.key)));
const toMake = pending.filter((it) => !fs.existsSync(cachedFile(it.key)));

// ---------- resumen ----------
// Kokoro en un M1 genera ~3 s de audio por segundo; ~15 caracteres por segundo de voz.
const secondsFor = (it) => it.text.length / 15 + 0.3;
function summary(list) {
  const by = {};
  for (const it of list) {
    const p = (by[it.phase] ||= { audios: 0, caracteres: 0, horas_de_audio: 0 });
    p.audios++;
    p.caracteres += it.text.length;
    p.horas_de_audio += secondsFor(it) / 3600;
  }
  for (const p of Object.values(by)) {
    p.horas_generando = +(p.horas_de_audio / 3).toFixed(1);
    p.horas_de_audio = +p.horas_de_audio.toFixed(1);
  }
  return by;
}
log(
  `Voz ${AUDIO_VOICE} (${PROVIDER}) · ${all.length} audios en las fases 1–${maxPhase} · subidos ${all.length - pending.length}` +
    ` · en el Mac sin subir ${cached.length} · por generar ${toMake.length}` +
    (r2 ? "" : " · R2 sin configurar: se guardan en el Mac")
);
if (toMake.length) log(summary(toMake));
if (flag("--dry-run")) process.exit(0);

// ---------- subida ----------
let uploaded = 0;
let failed = 0;
const fail = (it, e) => {
  failed++;
  fs.appendFileSync(FAILED_FILE, `${new Date().toISOString()}\t${it.key}\t${it.text.slice(0, 80)}\t${e.message}\n`);
};
async function upload(it) {
  await r2.put(audioPath(it.text), fs.readFileSync(cachedFile(it.key)), "audio/mpeg");
  fs.appendFileSync(DONE_FILE, it.key + "\n");
  fs.unlinkSync(cachedFile(it.key));
  uploaded++;
}
// Subidas en paralelo, sin esperar a cada una.
const uploads = new Set();
async function queueUpload(it) {
  while (uploads.size >= 8) await Promise.race(uploads);
  const p = upload(it)
    .catch((e) => fail(it, e))
    .finally(() => uploads.delete(p));
  uploads.add(p);
}

if (r2 && cached.length) {
  log(`Subiendo ${cached.length} audios que estaban en el Mac…`);
  for (const it of cached) await queueUpload(it);
  await Promise.all(uploads);
}

// ---------- generación ----------
const freeGB = () => {
  const s = fs.statfsSync(CACHE_DIR);
  return (s.bavail * s.bsize) / 1e9;
};

let chars = 0;
let made = 0;
let stopped = ""; // motivo de parada durante la generación
let capped = false; // la tanda se cortó por el tope de caracteres
const started = Date.now();
const batch = [];
for (const it of toMake) {
  if (chars + it.text.length > maxChars) {
    capped = true;
    break;
  }
  chars += it.text.length;
  batch.push(it);
}

async function afterMade(it) {
  made++;
  if (r2) await queueUpload(it);
  if (made % 250 === 0) {
    const rate = made / ((Date.now() - started) / 60000);
    log(`  ${made}/${batch.length} · ${rate.toFixed(0)} por minuto · quedan ~${Math.round((batch.length - made) / rate)} min`);
  }
}

async function runKokoro(items) {
  const py = path.join(HERE, ".venv/bin/python");
  if (!fs.existsSync(py)) throw new Error("Falta Kokoro: scripts/audio/.venv (ver kokoro_tts.py)");
  const child = spawn(py, [path.join(HERE, "kokoro_tts.py"), "--voice", KOKORO_VOICE, "--out", CACHE_DIR], {
    stdio: ["pipe", "pipe", "ignore"],
  });
  const byKey = new Map(items.map((it) => [it.key, it]));
  const rl = readline.createInterface({ input: child.stdout });
  const finished = new Promise((resolve) => child.on("close", resolve));
  (async () => {
    for (const it of items) {
      if (stopped) break;
      if (made % 200 === 0 && !r2 && freeGB() < MIN_FREE_GB) {
        stopped = "poco espacio en disco";
        break;
      }
      if (!child.stdin.write(JSON.stringify({ id: it.key, text: it.text }) + "\n")) {
        await new Promise((r) => child.stdin.once("drain", r));
      }
    }
    child.stdin.end();
  })();
  for await (const line of rl) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    const it = byKey.get(msg.id);
    if (!it) continue;
    if (msg.ok) await afterMade(it);
    else fail(it, new Error(msg.error));
  }
  await finished;
}

async function runOpenAI(items) {
  if (!env.OPENAI_API_KEY) throw new Error("Falta OPENAI_API_KEY en .env.local");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const queue = items.slice();
  async function worker() {
    while (!stopped && queue.length) {
      const it = queue.shift();
      try {
        let ok = false;
        for (let attempt = 0; attempt < 7 && !ok; attempt++) {
          const res = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
            body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "marin", input: it.text, response_format: "mp3" }),
          });
          if (res.ok) {
            fs.writeFileSync(cachedFile(it.key), Buffer.from(await res.arrayBuffer()));
            ok = true;
          } else if (res.status === 429 || res.status >= 500) {
            await sleep(Math.min(60000, 1500 * 2 ** attempt));
          } else {
            const detail = (await res.text()).slice(0, 300);
            if (res.status === 401 || /insufficient_quota|billing/i.test(detail)) stopped = "error de OpenAI: " + detail;
            throw new Error(`OpenAI ${res.status}: ${detail}`);
          }
        }
        if (!ok) throw new Error("OpenAI: demasiados reintentos");
        await afterMade(it);
      } catch (e) {
        fail(it, e);
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
}

if (batch.length) {
  log(`Generando ${batch.length} audios con ${PROVIDER === "openai" ? "OpenAI" : `Kokoro (${KOKORO_VOICE})`}…`);
  await (PROVIDER === "openai" ? runOpenAI(batch) : runKokoro(batch));
}
await Promise.all(uploads);

const complete = r2 && !stopped && !capped && failed === 0 && made === batch.length;
if (complete) fs.writeFileSync(STAMP_FILE, fingerprint());
console.log(
  `Hecho: ${made} generados, ${uploaded} subidos, ${failed} fallos, en ${Math.round((Date.now() - started) / 60000)} min.` +
    (stopped ? ` Detenido: ${stopped}.` : "") +
    (capped ? " Quedan más: se alcanzó el tope de caracteres de esta pasada." : "") +
    (!r2 && made ? " Quedan en el Mac hasta que se configure R2." : "") +
    (failed ? ` Fallos en ${path.relative(ROOT, FAILED_FILE)}.` : "")
);
