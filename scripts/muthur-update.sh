#!/bin/bash

# MUTHUR OS Terminal - Professional Update Flow
# Syncs, builds, and installs with a clean progress display.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ESC=$'\033'
HIDE="${ESC}[?25l"
SHOW="${ESC}[?25h"
CLEAR="${ESC}[2K"
UP="${ESC}[1A"
GREEN="${ESC}[32m"
RED="${ESC}[31m"
CYAN="${ESC}[36m"
DIM="${ESC}[2m"
BOLD="${ESC}[1m"
RESET="${ESC}[0m"

BUILD_LOG="${TMPDIR:-/tmp}/muthur-update-build.log"
START_TIME=$SECONDS

cleanup() {
    printf "%b" "$SHOW"
}
trap cleanup EXIT INT TERM

draw_frame() {
    printf "\n"
    printf "  ${BOLD}${CYAN}+--------------------------------------------------+${RESET}\n"
    printf "  ${BOLD}${CYAN}|${RESET}  ${GREEN}MUTHUR OS TERMINAL${RESET}  ${DIM}// UPDATE CONTROL${RESET}       ${BOLD}${CYAN}|${RESET}\n"
    printf "  ${BOLD}${CYAN}+--------------------------------------------------+${RESET}\n"
    printf "\n"
}

draw_progress() {
    local percent=$1
    local label=$2
    local width=42
    local filled=$((percent * width / 100))
    local empty=$((width - filled))
    local elapsed=$((SECONDS - START_TIME))
    local mins
    local secs
    mins=$(printf "%02d" $((elapsed / 60)))
    secs=$(printf "%02d" $((elapsed % 60)))

    local bar_fill
    local bar_empty
    bar_fill=$(printf '%*s' "$filled" | tr ' ' '=')
    bar_empty=$(printf '%*s' "$empty" | tr ' ' '.')

    printf "\r${CLEAR}  ${DIM}%s:%s${RESET}  ${GREEN}[%-42s]${RESET} ${GREEN}%3d%%${RESET}" "$mins" "$secs" "${bar_fill}${bar_empty}" "$percent"
    printf "\n${CLEAR}  ${DIM}%s${RESET}" "$label"
}

rewind_progress() {
    printf "\r${CLEAR}${UP}\r${CLEAR}"
}

fail() {
    rewind_progress || true
    printf "\n\n  ${RED}${BOLD}UPDATE FAILED${RESET}\n"
    printf "  ${DIM}%s${RESET}\n" "$1"
    if [ -f "$BUILD_LOG" ]; then
        printf "\n  ${BOLD}Last build output:${RESET}\n"
        tail -20 "$BUILD_LOG" | sed 's/^/    /'
    fi
    printf "\n"
    exit 1
}

run_step() {
    local percent=$1
    local label=$2
    shift 2
    rewind_progress
    draw_progress "$percent" "$label"
    "$@" >> "$BUILD_LOG" 2>&1
}

ensure_clean_tree() {
    if [ -z "$(git status --porcelain)" ]; then
        return 0
    fi

    # Auto-stash local changes and continue (like professional app updates)
    git stash --quiet --include-untracked 2>/dev/null || true
    STASHED="true"
}

load_toolchains() {
    [ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env" || true
    unset PREFIX NPM_CONFIG_PREFIX npm_config_prefix
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || true
}

STASHED=""

printf "%b" "$HIDE"
rm -f "$BUILD_LOG"
draw_frame
draw_progress 2 "Preparing update controller..."
sleep 0.15

[ -d ".git" ] || fail "This directory is not a git repository."
load_toolchains
ensure_clean_tree

run_step 8 "Fetching latest source..." git fetch origin --quiet

rewind_progress
draw_progress 14 "Syncing to latest version..."
if ! git pull --ff-only origin main --quiet >> "$BUILD_LOG" 2>&1; then
    git reset --hard origin/main --quiet >> "$BUILD_LOG" 2>&1
fi

NEW_VERSION=$(grep '^version' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2 2>/dev/null || echo "unknown")

rewind_progress
draw_progress 22 "Checking toolchains..."
command -v npm >/dev/null 2>&1 || fail "npm was not found. Install Node.js first."
command -v cargo >/dev/null 2>&1 || fail "cargo was not found. Install Rust first."
[ -f "$ROOT_DIR/scripts/muthur-health-check.sh" ] && bash "$ROOT_DIR/scripts/muthur-health-check.sh" >> "$BUILD_LOG" 2>&1 || true
sleep 0.15

run_step 32 "Installing frontend dependencies..." npm ci --quiet

rewind_progress
draw_progress 42 "Building application..."
npm run build > "$BUILD_LOG" 2>&1 &
BUILD_PID=$!
build_percent=42

while kill -0 "$BUILD_PID" 2>/dev/null; do
    build_percent=$((build_percent + 1))
    [ "$build_percent" -gt 68 ] && build_percent=68
    rewind_progress
    draw_progress "$build_percent" "Compiling frontend assets..."
    sleep 0.25
done

wait "$BUILD_PID" || fail "Frontend build failed."

rewind_progress
draw_progress 70 "Building native runtime..."
(cd src-tauri && cargo build --release) >> "$BUILD_LOG" 2>&1 &
CARGO_PID=$!
cargo_percent=70

while kill -0 "$CARGO_PID" 2>/dev/null; do
    cargo_percent=$((cargo_percent + 1))
    [ "$cargo_percent" -gt 90 ] && cargo_percent=90
    rewind_progress
    draw_progress "$cargo_percent" "Compiling native runtime..."
    sleep 0.35
done

wait "$CARGO_PID" || fail "Native build failed."

BINARY="src-tauri/target/release/muthur-os-terminal"
[ -f "$BINARY" ] || fail "Build artifact not found: $BINARY"

rewind_progress
draw_progress 94 "Installing binary..."

# Create launcher wrapper
cat > /tmp/muthur-launcher << 'WRAPPER'
#!/bin/bash
if [ -n "${DISPLAY:-}" ] || [ -n "${WAYLAND_DISPLAY:-}" ]; then
    exec muthur-bin "$@"
fi
if command -v cage &>/dev/null; then
    exec cage -d -- muthur-bin "$@"
fi
echo "No display server available. Install cage: sudo pacman -S cage" >&2
exit 1
WRAPPER

if [ "$EUID" -eq 0 ]; then
    install -Dm755 "$BINARY" /usr/local/bin/muthur-bin >> "$BUILD_LOG" 2>&1
    install -Dm755 /tmp/muthur-launcher /usr/local/bin/muthur >> "$BUILD_LOG" 2>&1
    ln -sf /usr/local/bin/muthur-bin /usr/bin/muthur-os-terminal >> "$BUILD_LOG" 2>&1 || true
else
    sudo install -Dm755 "$BINARY" /usr/local/bin/muthur-bin >> "$BUILD_LOG" 2>&1
    sudo install -Dm755 /tmp/muthur-launcher /usr/local/bin/muthur >> "$BUILD_LOG" 2>&1
    sudo ln -sf /usr/local/bin/muthur-bin /usr/bin/muthur-os-terminal >> "$BUILD_LOG" 2>&1 || true
fi
rm -f /tmp/muthur-launcher

rewind_progress
draw_progress 98 "Verifying installation..."
[ -x "/usr/local/bin/muthur-bin" ] || fail "Verification failed: /usr/local/bin/muthur-bin is not executable."
SIZE=$(du -h /usr/local/bin/muthur-bin | cut -f1)

# Restore stashed changes if any
if [ "$STASHED" = "true" ]; then
    git stash pop --quiet 2>/dev/null || true
fi
sleep 0.2

rewind_progress
draw_progress 100 "Update complete."
printf "\n\n"
printf "  ${GREEN}${BOLD}UPDATE COMPLETE${RESET}\n"
printf "  ${DIM}Version:${RESET} v%s\n" "$NEW_VERSION"
printf "  ${DIM}Binary:${RESET}  %s\n" "$SIZE"
printf "  ${DIM}Path:${RESET}    /usr/local/bin/muthur\n"
printf "\n"

if [ -t 0 ] && [ -f "$ROOT_DIR/scripts/muthur-offline-pack.sh" ]; then
    pack_state="$(bash "$ROOT_DIR/scripts/muthur-offline-pack.sh" --status 2>/dev/null || true)"
    offline_answer=""
    case "$pack_state" in
        current)
            printf "  ${DIM}Offline pack current.${RESET}\n"
            ;;
        stale)
            read -r -p "  Offline pack needs an update. Refresh selected modules now? [y/N] " offline_answer || offline_answer=""
            case "$offline_answer" in
                y|Y) bash "$ROOT_DIR/scripts/muthur-offline-pack.sh" --auto ;;
                *) printf "  ${DIM}Offline pack update skipped. Run later: scripts/muthur-offline-pack.sh --update${RESET}\n" ;;
            esac
            ;;
        *)
            read -r -p "  Optional offline pack is not installed. Install it now? [y/N] " offline_answer || offline_answer=""
            case "$offline_answer" in
                y|Y) bash "$ROOT_DIR/scripts/muthur-offline-pack.sh" --install ;;
                *) printf "  ${DIM}Offline pack skipped. Run later: scripts/muthur-offline-pack.sh${RESET}\n" ;;
            esac
            ;;
    esac
fi
