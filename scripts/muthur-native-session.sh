#!/bin/bash
#
# MUTHUR OS native session wrapper.
# This is the user-facing fullscreen session path.

set -euo pipefail

LOG_FILE="${XDG_RUNTIME_DIR:-/tmp}/muthur-session.log"
exec 1>> "$LOG_FILE"
exec 2>&1

echo "[$(date)] MUTHUR native session starting"

export XDG_SESSION_TYPE=wayland
export XDG_CURRENT_DESKTOP=MUTHUR
export MUTHUR_SESSION_MODE=native

APP_BIN="/usr/bin/muthur-os-terminal"
if [ ! -x "$APP_BIN" ] && [ -x "/usr/local/bin/muthur" ]; then
    APP_BIN="/usr/local/bin/muthur"
fi

if [ ! -x "$APP_BIN" ]; then
    echo "ERROR: MUTHUR runtime not found"
    notify-send -u critical "MUTHUR Session Error" "MUTHUR runtime not found" 2>/dev/null || true
    exit 1
fi

SESSION_HOST="${MUTHUR_SESSION_HOST:-}"
if [ -z "$SESSION_HOST" ]; then
    SESSION_HOST="$(command -v cage 2>/dev/null || true)"
fi

if [ -z "$SESSION_HOST" ]; then
    echo "ERROR: native fullscreen session host unavailable"
    notify-send -u critical "MUTHUR Session Error" "Native fullscreen session host unavailable" 2>/dev/null || true
    exit 1
fi

sleep 0.35
echo "[$(date)] Handing display to MUTHUR"
exec "$SESSION_HOST" -d -- "$APP_BIN" --fullscreen-force --session-mode
