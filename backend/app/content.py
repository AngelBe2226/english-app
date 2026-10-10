"""Loads the block content JSON files from disk.

Content is plain data (the 15 blocks) that Claude can edit directly in
app/content/*.json to add sections, examples, reasoning, quizzes, etc.
Files are cached in memory and reloaded automatically when changed.
"""
import json
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent / "content"

_cache: dict[str, tuple[float, dict]] = {}


def _load(path: Path) -> dict:
    mtime = path.stat().st_mtime
    cached = _cache.get(path.name)
    if cached and cached[0] == mtime:
        return cached[1]
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    _cache[path.name] = (mtime, data)
    return data


def get_index() -> list[dict]:
    return _load(CONTENT_DIR / "_index.json")


def get_block(block: str) -> dict | None:
    path = CONTENT_DIR / f"block_{block}.json"
    if not path.exists():
        return None
    return _load(path)


def get_search_index() -> list[dict]:
    """Lightweight index for the sidebar search: every block plus its section
    headings (idx + title + level). One request covers the whole app, so the
    frontend can filter blocks and sections client-side."""
    out: list[dict] = []
    for item in get_index():
        block = item["block"]
        data = get_block(block)
        if not data:
            continue
        out.append(
            {
                "block": block,
                "title": item.get("title", ""),
                "sections": [
                    {
                        "idx": s.get("idx"),
                        "title": s.get("title"),
                        "level": s.get("level"),
                    }
                    for s in data.get("sections", [])
                ],
            }
        )
    return out
