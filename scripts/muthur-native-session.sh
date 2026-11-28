#!/bin/bash
#
# MUTHUR OS native session wrapper.
# This is the user-facing fullscreen session path.

set -euo pipefail

# Kept under ~/.local/state: XDG_RUNTIME_DIR is wiped when the session ends.
LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/muthur"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/session.log"
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

# The compositor (wlroots) and WebKit need GPU 3D. Virtual machines and
# machines without a render node get software rendering instead, the same
# rules the muthur launcher applies; otherwise cage exits with
# "Unable to create the wlroots renderer" and the boot ends at a login prompt.
USE_SOFTWARE=0
if command -v systemd-detect-virt &>/dev/null && [ "$(systemd-detect-virt 2>/dev/null || true)" != "none" ]; then
    USE_SOFTWARE=1
fi
if ! ls /dev/dri/renderD* &>/dev/null; then
    USE_SOFTWARE=1
fi
if [ "${MUTHUR_HARDWARE_RENDER:-}" = "1" ]; then
    USE_SOFTWARE=0
fi
if [ "$USE_SOFTWARE" = "1" ]; then
    echo "[$(date)] Software rendering (virtual machine or no GPU render node)"
    export WLR_RENDERER=pixman
    export WLR_RENDERER_ALLOW_SOFTWARE=1
    export WLR_NO_HARDWARE_CURSORS=1
    export LIBGL_ALWAYS_SOFTWARE=1
    export WEBKIT_DISABLE_COMPOSITING_MODE=1
    export WEBKIT_DISABLE_DMABUF_RENDERER=1
fi

sleep 0.35
echo "[$(date)] Handing display to MUTHUR"
exec "$SESSION_HOST" -d -- "$APP_BIN" --fullscreen-force --session-mode
