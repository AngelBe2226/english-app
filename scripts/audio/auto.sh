#!/usr/bin/env bash
# Lo llama auto-sync en cada ciclo. Si en .env.local está AUDIO_AUTO=1 (y las
# claves), genera en segundo plano los audios del contenido nuevo. Sin cambios
# en el contenido sale al instante (--if-changed). Nunca dos a la vez.
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$REPO_DIR/.env.local"
[ -f "$ENV_FILE" ] || exit 0
grep -qE '^\s*AUDIO_AUTO\s*=\s*1' "$ENV_FILE" || exit 0
# Sin R2 no se genera en automático (los audios se acumularían en el disco).
grep -qE '^\s*R2_SECRET_ACCESS_KEY\s*=\s*\S' "$ENV_FILE" || exit 0

LOCK="$REPO_DIR/scripts/audio/.state/auto.lock"
mkdir -p "$REPO_DIR/scripts/audio/.state"
if ! mkdir "$LOCK" 2>/dev/null; then
    pid="$(cat "$LOCK/pid" 2>/dev/null || true)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then exit 0; fi
    rm -rf "$LOCK"; mkdir "$LOCK" || exit 0
fi

PHASE="$(grep -E '^\s*AUDIO_PHASE\s*=' "$ENV_FILE" | tail -1 | sed 's/.*=\s*//')"
MAXC="$(grep -E '^\s*AUDIO_MAX_CHARS_PER_RUN\s*=' "$ENV_FILE" | tail -1 | sed 's/.*=\s*//')"
LOG="$HOME/Library/Logs/english-app-audio.log"
(
    echo "$BASHPID" > "$LOCK/pid"
    node "$REPO_DIR/scripts/audio/generate.mjs" --if-changed --quiet \
        --phase "${PHASE:-5}" --max-chars "${MAXC:-300000}" >> "$LOG" 2>&1
    rm -rf "$LOCK"
) &
