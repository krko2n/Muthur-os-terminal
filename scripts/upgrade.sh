#!/bin/bash

# MUTHUR OS Terminal - Fully Autonomous Upgrade Script
# Discards local changes, pulls latest, builds, installs. Zero prompts.

set -e

# --- Self-update mechanism ---
if [ -z "$MUTHUR_UPGRADE_PHASE" ]; then
    if [ ! -d ".git" ]; then
        echo "Error: Not in a git repository"
        exit 1
    fi

    if [ ! -f "/usr/local/bin/muthur" ]; then
        chmod +x install-auto.sh
        ./install-auto.sh
        exit 0
    fi

    git checkout -- . > /dev/null 2>&1
    git clean -fd > /dev/null 2>&1
    git fetch origin --quiet
    git reset --hard origin/main > /dev/null 2>&1

    export MUTHUR_UPGRADE_PHASE=build
    exec bash "$0" "$@"
fi

# --- Phase 2: Build and install ---
set +e

if [ -f "$HOME/.bashrc" ]; then source "$HOME/.bashrc" 2>/dev/null; fi
if [ -f "$HOME/.cargo/env" ]; then source "$HOME/.cargo/env"; fi
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh"; fi

if ! command -v npm &> /dev/null; then
    for p in /usr/local/bin /usr/bin "$HOME/.local/bin" "$HOME/.nvm/versions/node"/*/bin; do
        if [ -x "$p/npm" ]; then export PATH="$p:$PATH"; break; fi
    done
fi

ESC=$'\e'
HIDE="${ESC}[?25l"
SHOW="${ESC}[?25h"
CL="${ESC}[2K"
UP="${ESC}[1A"
GREEN="${ESC}[32m"
RED="${ESC}[31m"
CYAN="${ESC}[36m"
DIM="${ESC}[2m"
BOLD="${ESC}[1m"
RST="${ESC}[0m"

cleanup() { printf "%b" "$SHOW"; }
trap cleanup EXIT INT TERM
printf "%b" "$HIDE"

START_TIME=$SECONDS

# --- Progress bar (GIF style): timer | ####.... | percent ---
# Updates in place: 2 lines (bar + status). Call draw_bar then draw_status.
draw_bar() {
    local percent=$1
    local width=50
    local filled=$((percent * width / 100))
    local empty=$((width - filled))
    local elapsed=$(( SECONDS - START_TIME ))
    local mins=$(printf "%02d" $((elapsed / 60)))
    local secs=$(printf "%02d" $((elapsed % 60)))

    local bar_fill=$(printf '%*s' "$filled" | tr ' ' '#')
    local bar_empty=$(printf '%*s' "$empty" | tr ' ' '.')

    printf "\r${CL}  ${GREEN}${mins}:${secs}${RST}  ${RED}%s${RST}${DIM}%s${RST}  ${GREEN}%d%%${RST}" "$bar_fill" "$bar_empty" "$percent"
}

draw_status() {
    printf "\n${CL}  ${DIM}%s${RST}" "$1"
}

clear_bar() {
    printf "\r${CL}${UP}\r${CL}"
}

# --- Header ---
echo ""
printf "  ${BOLD}╔══════════════════════════════════════════╗${RST}\n"
printf "  ${BOLD}║${RST}     ${GREEN}MUTHUR OS TERMINAL${RST} ${DIM}// UPGRADE${RST}      ${BOLD}║${RST}\n"
printf "  ${BOLD}╚══════════════════════════════════════════╝${RST}\n"
echo ""

# --- [1/4] Sync ---
draw_bar 5
draw_status "Syncing to latest version..."
sleep 0.3

NEW_VERSION=$(grep '^version' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2 2>/dev/null || echo "unknown")
clear_bar
draw_bar 10
draw_status "[1/4] Synced - v${NEW_VERSION}"
sleep 0.5

# --- [2/4] Dependencies ---
clear_bar
draw_bar 15
draw_status "[2/4] Checking Rust toolchain..."

if ! command -v rustc &> /dev/null; then
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    else
        clear_bar; draw_bar 15; draw_status "[2/4] Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --quiet > /dev/null 2>&1
        source "$HOME/.cargo/env"
    fi
fi

clear_bar; draw_bar 20; draw_status "[2/4] Checking Node.js..."

if ! command -v node &> /dev/null; then
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
    else
        clear_bar; draw_bar 20; draw_status "[2/4] Installing Node.js..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash > /dev/null 2>&1
        export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm install 20 --silent > /dev/null 2>&1
    fi
fi

if ! command -v npm &> /dev/null; then
    clear_bar; draw_bar 0
    printf "\n\n  ${RED}npm not found.${RST} Install Node.js first.\n"
    exit 1
fi

clear_bar; draw_bar 22; draw_status "[2/4] Checking Ollama..."

if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh > /dev/null 2>&1
fi

if ! pgrep -x "ollama" > /dev/null 2>&1; then
    ollama serve > /dev/null 2>&1 &
    sleep 2
fi

# Pull model in background
ollama pull llama3.2 > /dev/null 2>&1 &

clear_bar; draw_bar 25; draw_status "[2/4] Installing npm packages..."

export PATH
npm ci --quiet 2>/dev/null || npm install --quiet 2>/dev/null
clear_bar; draw_bar 30; draw_status "[2/4] Dependencies resolved"
sleep 0.3

# --- [3/4] Build ---
clear_bar; draw_bar 32; draw_status "[3/4] Building frontend..."

BUILD_LOG="/tmp/muthur_build.log"

if pgrep -x "muthur-os-terminal" > /dev/null 2>&1; then
    pkill -x "muthur-os-terminal" || true
    sleep 1
fi

rm -rf dist/ dist-ssr/ src-tauri/target/release/bundle/ 2>/dev/null || true

# Build frontend + backend in background
bash -c "export PATH='$PATH' && npm run build && cd src-tauri && cargo build --release" > "$BUILD_LOG" 2>&1 &
BUILD_PID=$!

# Animate progress bar during build (30% -> 90%)
build_percent=32
while kill -0 "$BUILD_PID" 2>/dev/null; do
    # Detect phase from log
    status="Compiling..."
    if [ -f "$BUILD_LOG" ]; then
        if grep -q "Compiling muthur" "$BUILD_LOG" 2>/dev/null; then
            status="Linking muthur-os-terminal..."
            [[ $build_percent -lt 85 ]] && build_percent=85
        elif grep -q "Compiling " "$BUILD_LOG" 2>/dev/null; then
            # Count compiled crates for progress
            local_count=$(grep -c "Compiling " "$BUILD_LOG" 2>/dev/null || echo "0")
            status="Compiling crate ${local_count}..."
            new_pct=$((35 + local_count / 2))
            [[ $new_pct -gt $build_percent && $new_pct -lt 85 ]] && build_percent=$new_pct
        elif grep -q "built in" "$BUILD_LOG" 2>/dev/null; then
            status="Frontend built, starting Rust..."
            [[ $build_percent -lt 35 ]] && build_percent=35
        elif grep -q "vite" "$BUILD_LOG" 2>/dev/null; then
            status="Bundling frontend assets..."
            [[ $build_percent -lt 33 ]] && build_percent=33
        fi
    fi

    clear_bar
    draw_bar $build_percent
    draw_status "[3/4] ${status}"
    sleep 0.2
done

wait "$BUILD_PID"
BUILD_EXIT=$?

if [[ $BUILD_EXIT -eq 0 ]]; then
    clear_bar; draw_bar 90; draw_status "[3/4] Build successful"
    sleep 0.3
else
    clear_bar; draw_bar $build_percent
    printf "\n\n  ${RED}Build failed.${RST} Log: ${BUILD_LOG}\n\n"
    printf "  ${BOLD}Last 15 lines:${RST}\n"
    tail -15 "$BUILD_LOG" | sed 's/^/    /'
    echo ""
    exit 1
fi

# --- [4/4] Install ---
clear_bar; draw_bar 92; draw_status "[4/4] Installing binary..."

BINARY="src-tauri/target/release/muthur-os-terminal"
if [ ! -f "$BINARY" ]; then
    printf "\n\n  ${RED}Binary not found.${RST} Check: ${BUILD_LOG}\n"
    exit 1
fi

sudo cp "$BINARY" /usr/local/bin/muthur
sudo chmod +x /usr/local/bin/muthur

clear_bar; draw_bar 97; draw_status "[4/4] Verifying..."
sleep 0.2

if [ ! -x "/usr/local/bin/muthur" ]; then
    printf "\n\n  ${RED}Verification failed.${RST}\n"
    exit 1
fi

clear_bar; draw_bar 100; draw_status "[4/4] Complete"
sleep 0.3

# --- Done ---
SIZE=$(du -h /usr/local/bin/muthur | cut -f1)
printf "\n\n"
printf "  ${BOLD}╔══════════════════════════════════════════╗${RST}\n"
printf "  ${BOLD}║${RST}  ${GREEN}UPGRADE COMPLETE${RST}                       ${BOLD}║${RST}\n"
printf "  ${BOLD}╚══════════════════════════════════════════╝${RST}\n"
echo ""
printf "  ${DIM}Version:${RST}  v%s\n" "$NEW_VERSION"
printf "  ${DIM}Binary:${RST}   %s\n" "$SIZE"
printf "  ${DIM}Path:${RST}     /usr/local/bin/muthur\n"
echo ""
printf "  Run ${BOLD}muthur${RST} to launch.\n"
echo ""
