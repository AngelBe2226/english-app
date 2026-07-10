# Índice de Inglés

App de estudio de inglés con 15 bloques de contenido (reglas, ejemplos, tablas,
quizzes y cajas de "escribe tu frase"), más un panel de práctica (bloque 15) con
progreso agregado, flashcards de 50 idioms y un simulador de speaking cronometrado.

Migrado desde un HTML de un solo archivo a un proyecto real:

- **Frontend:** React + Vite (`frontend/`)
- **Backend:** FastAPI + SQLite (`backend/`) — guarda tu progreso
- **Contenido:** archivos JSON editables en `backend/app/content/` (uno por bloque)

## Estructura

```
backend/
  app/
    main.py            FastAPI: API + sirve el build de React en producción
    db.py              SQLite (tabla key/value de progreso)
    content.py         carga los JSON de contenido
    content/           block_01.json … block_15.json, _index.json  ← el contenido
    routers/
      content.py       GET /api/blocks, /api/blocks/{block}
      progress.py      GET/PUT/DELETE progreso, import y reset
  requirements.txt
  data/                progress.db (se crea solo; no se sube a git)
frontend/
  src/
    App.jsx            layout + sidebar + carga de bloques
    progress.jsx       estado global de progreso (carga 1 vez, escribe al backend)
    components/        BlockPage, SectionCard, Quiz, ProduceBox, Table, RichText
    panels/            Block15Page, ProgressPanel, IdiomFlashcards, ExamSimulator
    data/              idioms.js, examPrompts.js
    styles/            tokens.css (design tokens), app.css
```

## Cómo correrlo (desarrollo)

Necesitas **dos terminales**.

**1. Backend (API + base de datos):**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**2. Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Abre http://localhost:5173 — Vite reenvía las llamadas `/api` al backend.

## Producción (un solo servidor)

```bash
cd frontend && npm run build       # genera frontend/dist
cd ../backend && uvicorn app.main:app --port 8001
```
Ahora http://localhost:8001 sirve la app completa (FastAPI entrega el build de React).

## Desplegar en Railway

El repo trae un `Dockerfile` (multi-stage: compila React y luego lo sirve con
FastAPI) y `railway.json`. Railway detecta el Dockerfile automáticamente.

1. Sube el repo a GitHub.
2. En Railway: **New Project → Deploy from GitHub repo** y elige este repo.
3. Railway construye la imagen y arranca el servicio. La app escucha en `$PORT`
   (Railway lo inyecta solo) y sirve React + API en el mismo dominio.
4. **Para que tu progreso no se borre en cada redeploy** (el disco del contenedor
   es efímero), añade un **Volume** montado en `/data` y una variable de entorno
   `DATABASE_PATH=/data/progress.db`.

El healthcheck ya apunta a `/api/health`.

## Agregar o editar contenido

Todo el contenido pedagógico vive en `backend/app/content/block_XX.json`. Para
añadir una sección, ejemplo, tabla, quiz o el campo opcional `reasoning` (el "por
qué" de la regla), edita ese JSON — la app lo recarga automáticamente. El esquema
de cada bloque está documentado en el export original.

## Migrar progreso del sitio viejo

El progreso se guarda con las **mismas keys** que el HTML original (`b01-s1q1`,
`idiom:3`, etc.). Si exportas tu `localStorage` viejo a un JSON `{ "clave": "valor" }`,
puedes importarlo de una vez:

```bash
curl -X POST http://localhost:8001/api/progress/import \
  -H 'Content-Type: application/json' \
  -d '{"items": {"b01-s1q1": "0", "idiom:3": "known"}}'
```
