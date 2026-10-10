#!/usr/bin/env bash
# Auto-sync de english-app entre máquinas (Mac Mini <-> MacBook Air): cada vez
# que corre (LaunchAgent com.angelbe.english-app-sync, cada minuto) commitea los
# cambios locales, integra con rebase lo que haya subido la otra máquina, y hace
# push. Además mantiene la app en marcha al día sin pasos manuales:
#   - FRONTEND: reconstruye dist/ (que no va en git) cuando cambia el fuente del
#     frontend, da igual si el cambio es local o llega por pull. Lo decide por
#     huella del código (no por el diff del pull), así también refleja TUS
#     ediciones en esta misma máquina.
#   - BACKEND: si el pull trae cambios de Python, reinicia el servidor.
# Desatendido: si el rebase choca, aborta y solo deja aviso en el log.
set -uo pipefail

# LaunchAgents traen un PATH mínimo; añade las ubicaciones habituales.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR" || exit 1

FRONT_DIR="$REPO_DIR/frontend"
FRONT_MARKER="$FRONT_DIR/.dist-src-hash"   # huella del fuente ya construido (local, no va en git)

log() { echo "$(date '+%F %T') [auto-sync] $1"; }

# Asegura que npm y node son invocables; si el PATH mínimo no los trae, prueba
# Homebrew, /usr/local y por último la última versión instalada por nvm. Así
# funciona igual en máquinas con node de sistema o con node vía nvm.
resolve_npm() {
    command -v npm >/dev/null 2>&1 && command -v node >/dev/null 2>&1 && return 0
    local d latest
    for d in /opt/homebrew/bin /usr/local/bin; do
        [ -x "$d/npm" ] && [ -x "$d/node" ] && { PATH="$d:$PATH"; return 0; }
    done
    if [ -d "$HOME/.nvm/versions/node" ]; then
        latest="$(ls -1 "$HOME/.nvm/versions/node" 2>/dev/null | sort -V | tail -1)"
        if [ -n "$latest" ] && [ -x "$HOME/.nvm/versions/node/$latest/bin/npm" ]; then
            PATH="$HOME/.nvm/versions/node/$latest/bin:$PATH"
            return 0
        fi
    fi
    return 1
}

# Huella estable del fuente del frontend (ignora node_modules y dist).
frontend_fingerprint() {
    {
        find "$FRONT_DIR/src" -type f 2>/dev/null
        printf '%s\n' "$FRONT_DIR/index.html" "$FRONT_DIR/package.json" \
            "$FRONT_DIR/package-lock.json" "$FRONT_DIR/vite.config.js"
    } | sort | while read -r f; do [ -f "$f" ] && shasum "$f"; done | shasum | awk '{print $1}'
}

# Reconstruye dist/ solo si el fuente cambió desde el último build (o si falta dist).
rebuild_frontend_if_changed() {
    local fp cur
    fp="$(frontend_fingerprint)"
    cur="$(cat "$FRONT_MARKER" 2>/dev/null || true)"
    if [ -f "$FRONT_DIR/dist/index.html" ] && [ "$fp" = "$cur" ]; then
        return 0   # nada cambió — no reconstruir
    fi
    if ! resolve_npm; then
        log "Frontend cambió pero no encuentro npm/node — build omitido (instala Node o ajusta PATH)."
        return 1
    fi
    if [ ! -d "$FRONT_DIR/node_modules" ]; then
        log "Instalando dependencias del frontend (primera vez)…"
        if ! npm --prefix "$FRONT_DIR" ci >/tmp/english-app-sync-npmci.log 2>&1; then
            log "npm ci falló — detalle en /tmp/english-app-sync-npmci.log"
            return 1
        fi
    fi
    log "Frontend cambió — reconstruyendo (npm run build)…"
    if npm --prefix "$FRONT_DIR" run build >/tmp/english-app-sync-build.log 2>&1; then
        echo "$fp" > "$FRONT_MARKER"
        log "Frontend reconstruido."
    else
        log "Fallo al reconstruir el frontend. Detalle en /tmp/english-app-sync-build.log"
        return 1
    fi
}

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

# Si el pull trajo cambios de BACKEND (Python) → reiniciar el servidor.
# (El frontend se reconstruye aparte, por huella, cubra local o pull.)
if [ "$BEFORE" != "$AFTER" ]; then
    CHANGED="$(git diff --name-only "$BEFORE" "$AFTER")"
    if echo "$CHANGED" | grep -qE '^backend/app/.*\.py$|^backend/requirements\.txt$'; then
        log "Cambios de backend (Python) detectados — reiniciando el servidor…"
        launchctl kickstart -k "gui/$(id -u)/com.angelbe.english-app" 2>/dev/null \
            && log "Servidor reiniciado." || log "No se pudo reiniciar el servidor (revísalo a mano)."
    fi
fi

# Reconstruye el frontend si su fuente cambió (ediciones locales o cambios traídos por el pull).
rebuild_frontend_if_changed

if ! git push origin main >/tmp/english-app-sync-push.log 2>&1; then
    log "Push falló — se reintentará en el siguiente ciclo. Detalle en /tmp/english-app-sync-push.log"
    exit 1
fi

log "OK."
