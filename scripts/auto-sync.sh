#!/usr/bin/env bash
# Auto-sync de english-app entre máquinas (Mac Mini <-> MacBook Air): cada vez
# que corre (ver el LaunchAgent com.angelbe.english-app-sync, cada 5 min), si
# hay cambios locales los commitea, integra lo que haya subido la otra máquina
# con rebase, y hace push. Pensado para correr desatendido, así que nunca deja
# el repo a medio resolver: si el rebase choca, aborta y solo deja un aviso en
# el log — la resolución manual la hace una persona, no este script.
set -uo pipefail

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

if ! git pull --rebase --autostash origin main >/tmp/english-app-sync-pull.log 2>&1; then
    log "Conflicto al integrar cambios remotos — abortando rebase, requiere resolución manual. Detalle en /tmp/english-app-sync-pull.log"
    git rebase --abort 2>/dev/null
    exit 1
fi

if ! git push origin main >/tmp/english-app-sync-push.log 2>&1; then
    log "Push falló — se reintentará en el siguiente ciclo. Detalle en /tmp/english-app-sync-push.log"
    exit 1
fi

log "OK."
