#!/usr/bin/env bash
# Generación automática de audios (LaunchAgent com.angelbe.english-app-audio,
# cada 15 min en el Mac que tiene .env.local). Solo actúa si AUDIO_AUTO=1 y
# hay claves de R2; sin cambios en el contenido sale al instante
# (--if-changed) y si ya hay una generación en marcha también (generate.lock).
#
# Horario (decidido el 2026-11-18): la tanda grande (hasta AUDIO_PHASE) solo de
# 0:00 a 8:00, para dejar el Mac libre de día. De día solo se generan los
# audios de contenido nuevo de las fases 1–3 (pocos y rápidos).
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$REPO_DIR/.env.local"
[ -f "$ENV_FILE" ] || exit 0
grep -qE '^\s*AUDIO_AUTO\s*=\s*1' "$ENV_FILE" || exit 0
# Sin R2 no se genera en automático (los audios se acumularían en el disco).
grep -qE '^\s*R2_SECRET_ACCESS_KEY\s*=\s*\S' "$ENV_FILE" || exit 0

PHASE="$(grep -E '^\s*AUDIO_PHASE\s*=' "$ENV_FILE" | tail -1 | sed 's/.*=[[:space:]]*//')"
MAXC="$(grep -E '^\s*AUDIO_MAX_CHARS_PER_RUN\s*=' "$ENV_FILE" | tail -1 | sed 's/.*=[[:space:]]*//')"
HOUR=$((10#$(date +%H)))
if [ "$HOUR" -lt 8 ]; then
    exec node "$REPO_DIR/scripts/audio/generate.mjs" --if-changed --quiet \
        --phase "${PHASE:-5}" --max-chars "${MAXC:-300000}" --until 8
else
    PHASE_DAY=$(( ${PHASE:-5} < 3 ? ${PHASE:-5} : 3 ))
    exec nice -n 10 node "$REPO_DIR/scripts/audio/generate.mjs" --if-changed --quiet \
        --phase "$PHASE_DAY" --max-chars 50000
fi
