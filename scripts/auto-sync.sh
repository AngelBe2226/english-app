#!/usr/bin/env bash
# Auto-sync de english-app entre máquinas (Mac Mini <-> MacBook Air): cada vez
# que corre (LaunchAgent com.angelbe.english-app-sync, cada 5 min) commitea los
# cambios locales, integra con rebase lo que haya subido la otra máquina, y hace
# push. Además, si el pull trae cambios de FRONTEND reconstruye el build (dist no
# va en git), y si cambia el backend en Python reinicia el servidor — así la app
# en marcha refleja siempre lo sincronizado, sin pasos manuales. Desatendido: si
# el rebase choca, aborta y solo deja aviso en el log (resolución manual).
set -uo pipefail

# LaunchAgents traen un PATH mínimo; añade Homebrew para git/node/npm.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR" || exit 1

log() { echo "$(date '+%F %T') [auto-sync] $1"; }

if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] || [ -f .git/MERGE_HEAD ]; then
    log "Repo en medio de un rebase/merge sin resolver — no se toca hasta que se arregle a mano."
    exit 1
fi

HOST="$(scutil --get ComputerName 2>/dev/null | sed 's/^ *//;s/ *$//')"
[ -z "$HOST" ] && HOST="$(hostname)"

if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -q -m "Auto-sync desde ${HOST} — $(date '+%Y-%m-%d %H:%M:%S')

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
    log "Commit local creado."
fi

BEFORE="$(git rev-parse HEAD)"

if ! git pull --rebase --autostash origin main >/tmp/english-app-sync-pull.log 2>&1; then
    log "Conflicto al integrar cambios remotos — abortando rebase, requiere resolución manual. Detalle en /tmp/english-app-sync-pull.log"
    git rebase --abort 2>/dev/null
    exit 1
fi

AFTER="$(git rev-parse HEAD)"

# Si el pull trajo commits nuevos, mira qué cambió y actúa.
if [ "$BEFORE" != "$AFTER" ]; then
    CHANGED="$(git diff --name-only "$BEFORE" "$AFTER")"
    # Frontend (fuera de dist) → reconstruir el build de producción.
    if echo "$CHANGED" | grep -qE '^frontend/(src/|index\.html|package(-lock)?\.json|vite\.config)'; then
        log "Cambios de frontend detectados — reconstruyendo (npm run build)…"
        if npm --prefix frontend run build >/tmp/english-app-sync-build.log 2>&1; then
            log "Frontend reconstruido."
        else
            log "Fallo al reconstruir el frontend. Detalle en /tmp/english-app-sync-build.log"
        fi
    fi
    # Backend en Python → reiniciar el servidor (el contenido JSON ya recarga solo).
    if echo "$CHANGED" | grep -qE '^backend/app/.*\.py$|^backend/requirements\.txt$'; then
        log "Cambios de backend (Python) detectados — reiniciando el servidor…"
        launchctl kickstart -k "gui/$(id -u)/com.angelbe.english-app" 2>/dev/null \
            && log "Servidor reiniciado." || log "No se pudo reiniciar el servidor (revísalo a mano)."
    fi
fi

if ! git push origin main >/tmp/english-app-sync-push.log 2>&1; then
    log "Push falló — se reintentará en el siguiente ciclo. Detalle en /tmp/english-app-sync-push.log"
    exit 1
fi

log "OK."
