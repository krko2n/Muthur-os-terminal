#!/bin/bash

# MUTHUR OS Terminal - Fully Autonomous Upgrade Script
# Discards local changes, pulls latest, builds, installs. Zero prompts.

set -e

ESC=$'\e'
HIDE_CURSOR="${ESC}[?25l"
SHOW_CURSOR="${ESC}[?25h"
CLEAR_LINE="${ESC}[2K"
MOVE_UP="${ESC}[1A"

GREEN="${ESC}[32m"
RED="${ESC}[31m"
YELLOW="${ESC}[33m"
CYAN="${ESC}[36m"
DIM="${ESC}[2m"
BOLD="${ESC}[1m"
RESET="${ESC}[0m"

cleanup() {
    printf "%b" "$SHOW_CURSOR"
}
trap cleanup EXIT INT TERM

printf "%b" "$HIDE_CURSOR"

# --- Progress bar renderer ---
progress_bar() {
    local current=$1
    local total=$2
    local label=$3
    local width=40

    local percent=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))

    local bar_fill=$(printf '%*s' "$filled" | tr ' ' '█')
    local bar_empty=$(printf '%*s' "$empty" | tr ' ' '░')

    local color="$RED"
    [[ $percent -ge 40 ]] && color="$YELLOW"
    [[ $percent -ge 75 ]] && color="$GREEN"

    printf "\r${CLEAR_LINE}"
    printf "  ${color}[%s%s]${RESET} %3d%%  ${DIM}%s${RESET}" "$bar_fill" "$bar_empty" "$percent" "$label"
}

status_line() {
    printf "\r${CLEAR_LINE}  %b\n" "$1"
}

# --- Spinner for indeterminate tasks ---
spin_task() {
    local message=$1
    shift
    local chars=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    local i=0

    "$@" > /tmp/muthur_upgrade_out.log 2>&1 &
    local pid=$!

    while kill -0 "$pid" 2>/dev/null; do
        printf "\r${CLEAR_LINE}  ${CYAN}%s${RESET} %s" "${chars[$((i % ${#chars[@]}))]}" "$message"
        ((i++))
        sleep 0.08
    done

    wait "$pid"
    local exit_code=$?

    if [[ $exit_code -eq 0 ]]; then
        printf "\r${CLEAR_LINE}  ${GREEN}✓${RESET} %s\n" "$message"
    else
        printf "\r${CLEAR_LINE}  ${RED}✗${RESET} %s\n" "$message"
        printf "    ${DIM}See /tmp/muthur_upgrade_out.log for details${RESET}\n"
        exit $exit_code
    fi
}

# --- Header ---
echo ""
printf "  ${BOLD}╔══════════════════════════════════════════╗${RESET}\n"
printf "  ${BOLD}║${RESET}     ${GREEN}MUTHUR OS TERMINAL${RESET} ${DIM}// UPGRADE${RESET}      ${BOLD}║${RESET}\n"
printf "  ${BOLD}╚══════════════════════════════════════════╝${RESET}\n"
echo ""

# --- Pre-checks ---
if [ ! -d ".git" ]; then
    printf "  ${RED}✗${RESET} Not in a git repository\n"
    printf "    Run from the muthur-os-terminal directory\n"
    exit 1
fi

if [ ! -f "/usr/local/bin/muthur" ]; then
    printf "  ${YELLOW}!${RESET} MUTHUR not installed. Running full install...\n\n"
    chmod +x install-auto.sh
    ./install-auto.sh
    exit 0
fi

# --- Phase 1: Reset & Pull ---
printf "  ${BOLD}[1/4]${RESET} ${CYAN}Syncing to latest version${RESET}\n"

CURRENT_VERSION=$(grep '"version"' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2 2>/dev/null || echo "unknown")
printf "        ${DIM}Current: v%s${RESET}\n" "$CURRENT_VERSION"

progress_bar 1 5 "Discarding local changes..."
git checkout -- . > /dev/null 2>&1
git clean -fd > /dev/null 2>&1

progress_bar 2 5 "Fetching remote..."
git fetch origin --quiet

progress_bar 3 5 "Resetting to origin/main..."
git reset --hard origin/main > /dev/null 2>&1

progress_bar 5 5 "Synced"
echo ""

NEW_VERSION=$(grep '"version"' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2 2>/dev/null || echo "unknown")
if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
    printf "        ${GREEN}Updated: v%s → v%s${RESET}\n" "$CURRENT_VERSION" "$NEW_VERSION"
else
    printf "        ${DIM}Version: v%s (rebuilding)${RESET}\n" "$NEW_VERSION"
fi
echo ""

# --- Phase 2: Dependencies ---
printf "  ${BOLD}[2/4]${RESET} ${CYAN}Resolving dependencies${RESET}\n"

# Ensure Rust
if ! command -v rustc &> /dev/null; then
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    else
        spin_task "Installing Rust toolchain" bash -c 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --quiet'
        source "$HOME/.cargo/env"
    fi
fi

# Ensure Node
if ! command -v node &> /dev/null; then
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        export NVM_DIR="$HOME/.nvm"
        . "$NVM_DIR/nvm.sh"
    else
        spin_task "Installing Node.js" bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash > /dev/null 2>&1 && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm install 20 --silent'
        export NVM_DIR="$HOME/.nvm"
        . "$NVM_DIR/nvm.sh"
    fi
fi

# NPM install
if [ -f "package-lock.json" ]; then
    spin_task "Installing npm packages" npm ci --quiet
else
    spin_task "Installing npm packages" npm install --quiet
fi
echo ""

# --- Phase 3: Build ---
printf "  ${BOLD}[3/4]${RESET} ${CYAN}Building MUTHUR${RESET}\n"
printf "        ${DIM}This may take 5-10 minutes on first build${RESET}\n"

# Kill running instances
if pgrep -x "muthur-os-terminal" > /dev/null 2>&1; then
    pkill -x "muthur-os-terminal" || true
    sleep 1
fi

# Clean stale bundles (keep cargo cache)
rm -rf dist/ dist-ssr/ src-tauri/target/release/bundle/ 2>/dev/null || true

# Build with live progress tracking
BUILD_LOG="/tmp/muthur_build.log"
npm run tauri build > "$BUILD_LOG" 2>&1 &
BUILD_PID=$!

STEPS=("Preparing" "Compiling frontend" "Bundling assets" "Compiling Rust" "Linking" "Packaging")
step_idx=0
chars=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
spin_i=0

while kill -0 "$BUILD_PID" 2>/dev/null; do
    # Detect build phase from log
    if [ -f "$BUILD_LOG" ]; then
        if grep -q "Compiling muthur" "$BUILD_LOG" 2>/dev/null; then
            step_idx=4
        elif grep -q "Compiling " "$BUILD_LOG" 2>/dev/null; then
            step_idx=3
        elif grep -q "built in" "$BUILD_LOG" 2>/dev/null; then
            step_idx=2
        elif grep -q "building for production" "$BUILD_LOG" 2>/dev/null; then
            step_idx=1
        fi
    fi

    local_step="${STEPS[$step_idx]}"
    printf "\r${CLEAR_LINE}  ${CYAN}%s${RESET} %s ${DIM}(%s)${RESET}" "${chars[$((spin_i % ${#chars[@]}))]}" "Building..." "$local_step"
    ((spin_i++))
    sleep 0.1
done

wait "$BUILD_PID"
BUILD_EXIT=$?

if [[ $BUILD_EXIT -eq 0 ]]; then
    printf "\r${CLEAR_LINE}  ${GREEN}✓${RESET} Build successful\n"
else
    printf "\r${CLEAR_LINE}  ${RED}✗${RESET} Build failed\n"
    printf "        ${DIM}Full log: %s${RESET}\n" "$BUILD_LOG"
    echo ""
    printf "  ${BOLD}Last 15 lines:${RESET}\n"
    tail -15 "$BUILD_LOG" | sed 's/^/    /'
    echo ""
    exit 1
fi
echo ""

# --- Phase 4: Install ---
printf "  ${BOLD}[4/4]${RESET} ${CYAN}Installing${RESET}\n"

BINARY="src-tauri/target/release/muthur-os-terminal"

if [ ! -f "$BINARY" ]; then
    printf "  ${RED}✗${RESET} Binary not found at %s\n" "$BINARY"
    printf "    Build produced no output. Check: %s\n" "$BUILD_LOG"
    exit 1
fi

progress_bar 1 3 "Copying binary..."
sudo cp "$BINARY" /usr/local/bin/muthur
sudo chmod +x /usr/local/bin/muthur

progress_bar 2 3 "Verifying..."
if [ ! -x "/usr/local/bin/muthur" ]; then
    printf "\n  ${RED}✗${RESET} Verification failed\n"
    exit 1
fi

progress_bar 3 3 "Done"
echo ""

SIZE=$(du -h /usr/local/bin/muthur | cut -f1)
printf "        ${DIM}Binary: /usr/local/bin/muthur (%s)${RESET}\n" "$SIZE"
echo ""

# --- Summary ---
printf "  ${BOLD}╔══════════════════════════════════════════╗${RESET}\n"
printf "  ${BOLD}║${RESET}  ${GREEN}✓ UPGRADE COMPLETE${RESET}                     ${BOLD}║${RESET}\n"
printf "  ${BOLD}╚══════════════════════════════════════════╝${RESET}\n"
echo ""

if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
    printf "  ${DIM}Upgraded:${RESET} v%s ${DIM}→${RESET} v%s\n" "$CURRENT_VERSION" "$NEW_VERSION"
else
    printf "  ${DIM}Rebuilt:${RESET}  v%s\n" "$NEW_VERSION"
fi
printf "  ${DIM}Binary:${RESET}   %s\n" "$SIZE"
printf "  ${DIM}Path:${RESET}     /usr/local/bin/muthur\n"
echo ""
printf "  Run ${BOLD}muthur${RESET} to launch.\n"
echo ""
