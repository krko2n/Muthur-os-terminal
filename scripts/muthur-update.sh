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
    if [ "${MUTHUR_FORCE_UPDATE:-}" = "1" ]; then
        return 0
    fi

    if [ -n "$(git status --porcelain)" ]; then
        printf "\n\n  ${RED}${BOLD}Local changes detected.${RESET}\n"
        printf "  ${DIM}Update stopped so your work is not overwritten.${RESET}\n"
        printf "  Commit/stash changes, or run ${BOLD}MUTHUR_FORCE_UPDATE=1 make update${RESET}.\n\n"
        exit 1
    fi
}

load_toolchains() {
    [ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc" 2>/dev/null || true
    [ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env" || true
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || true
}

printf "%b" "$HIDE"
rm -f "$BUILD_LOG"
draw_frame
draw_progress 2 "Preparing update controller..."
sleep 0.15

[ -d ".git" ] || fail "This directory is not a git repository."
load_toolchains
ensure_clean_tree

run_step 8 "Fetching latest source..." git fetch origin --quiet
run_step 14 "Fast-forwarding local branch..." git pull --ff-only origin main --quiet

NEW_VERSION=$(grep '^version' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2 2>/dev/null || echo "unknown")

rewind_progress
draw_progress 22 "Checking toolchains..."
command -v npm >/dev/null 2>&1 || fail "npm was not found. Install Node.js first."
command -v cargo >/dev/null 2>&1 || fail "cargo was not found. Install Rust first."
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
sudo install -Dm755 "$BINARY" /usr/local/bin/muthur >> "$BUILD_LOG" 2>&1
sudo ln -sf /usr/local/bin/muthur /usr/bin/muthur-os-terminal >> "$BUILD_LOG" 2>&1 || true

rewind_progress
draw_progress 98 "Verifying installation..."
[ -x "/usr/local/bin/muthur" ] || fail "Verification failed: /usr/local/bin/muthur is not executable."
SIZE=$(du -h /usr/local/bin/muthur | cut -f1)
sleep 0.2

rewind_progress
draw_progress 100 "Update complete."
printf "\n\n"
printf "  ${GREEN}${BOLD}UPDATE COMPLETE${RESET}\n"
printf "  ${DIM}Version:${RESET} v%s\n" "$NEW_VERSION"
printf "  ${DIM}Binary:${RESET}  %s\n" "$SIZE"
printf "  ${DIM}Path:${RESET}    /usr/local/bin/muthur\n"
printf "\n"
