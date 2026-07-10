from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from . import db
from .routers import content, progress

# Where Vite writes its production build (frontend/dist).
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="Índice de Inglés", lifespan=lifespan)

# In dev the frontend runs on Vite (localhost:5173) and calls this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content.router)
app.include_router(progress.router)


@app.get("/api/health")
def health():
    return {"ok": True}


# In production, serve the built React app. Any non-API path falls back to
# index.html so client-side navigation works.
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        index = FRONTEND_DIST / "index.html"
        return FileResponse(index)
