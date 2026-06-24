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

SUDO_KEEPER_PID=""
cleanup() {
    [ -n "$SUDO_KEEPER_PID" ] && kill "$SUDO_KEEPER_PID" 2>/dev/null || true
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

# Acquire sudo credentials up front (before progress display hides the prompt)
if [ "$EUID" -ne 0 ]; then
    printf "%b" "$SHOW"
    echo "  Sudo access is required to install the update."
    sudo -v || { echo "Sudo authentication failed."; exit 1; }
    printf "%b" "$HIDE"
    # Keep sudo alive in background during the build
    (while true; do sudo -n true 2>/dev/null; sleep 50; done) &
    SUDO_KEEPER_PID=$!
fi

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

# Create launcher wrapper (self-healing: installs missing deps, configures seat)
cat > /tmp/muthur-launcher << 'WRAPPER'
#!/bin/bash
# MUTHUR OS Terminal launcher
# Auto-detects and fixes missing dependencies before starting.

if [ -n "${DISPLAY:-}" ] || [ -n "${WAYLAND_DISPLAY:-}" ]; then
    exec muthur-bin "$@"
fi

# --- Auto-install missing packages ---
install_missing() {
    local missing=()
    command -v cage &>/dev/null || missing+=(cage)
    command -v seatd &>/dev/null || missing+=(seatd)
    # mesa provides llvmpipe (software GL) needed for VM rendering
    if ! ls /usr/lib/dri/swrast_dri.so &>/dev/null 2>&1 && \
       ! ls /usr/lib64/dri/swrast_dri.so &>/dev/null 2>&1; then
        missing+=(mesa)
    fi
    [ ${#missing[@]} -eq 0 ] && return 0

    echo "Installing missing dependencies: ${missing[*]}"
    if command -v pacman &>/dev/null; then
        sudo pacman -S --noconfirm --needed "${missing[@]}"
    elif command -v apt-get &>/dev/null; then
        sudo apt-get install -y "${missing[@]}"
    elif command -v dnf &>/dev/null; then
        sudo dnf install -y "${missing[@]}"
    else
        echo "Cannot auto-install: ${missing[*]}. Install manually." >&2
        exit 1
    fi
}
install_missing

# --- Ensure seatd service is enabled and running ---
if ! systemctl is-active --quiet seatd 2>/dev/null; then
    sudo systemctl enable seatd 2>/dev/null || true
    sudo systemctl start seatd 2>/dev/null || true
    sleep 0.3
fi

# --- Ensure user is in seat group (apply immediately) ---
if ! id -nG | grep -qw seat; then
    sudo usermod -aG seat "$USER"
    exec sg seat -c "$0 $*"
fi

# --- GPU renderer: fallback to software rendering if no usable GPU ---
needs_software_renderer() {
    # No render nodes at all
    ls /dev/dri/renderD* &>/dev/null 2>&1 || return 0
    # Virtual machine (GPU drivers often broken/missing)
    if command -v systemd-detect-virt &>/dev/null; then
        local vtype
        vtype="$(systemd-detect-virt 2>/dev/null || true)"
        [ "$vtype" != "none" ] && [ -n "$vtype" ] && return 0
    fi
    return 1
}
if needs_software_renderer; then
    export LIBGL_ALWAYS_SOFTWARE=1
    export GALLIUM_DRIVER=llvmpipe
    export WEBKIT_DISABLE_DMABUF_RENDERER=1
    export WEBKIT_DISABLE_COMPOSITING_MODE=1
fi

exec cage -d -- muthur-bin "$@"
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

# Configure seat management (so muthur works immediately after update)
if [ "$EUID" -eq 0 ]; then
    # Ensure seatd is installed
    if ! command -v seatd &>/dev/null; then
        pacman -S --noconfirm --needed seatd >> "$BUILD_LOG" 2>&1 || \
        apt-get install -y seatd >> "$BUILD_LOG" 2>&1 || \
        dnf install -y seatd >> "$BUILD_LOG" 2>&1 || true
    fi
    systemctl enable seatd >> "$BUILD_LOG" 2>&1 || true
    systemctl start seatd >> "$BUILD_LOG" 2>&1 || true
    usermod -aG seat "${SUDO_USER:-$USER}" >> "$BUILD_LOG" 2>&1 || true
else
    # Ensure seatd is installed
    if ! command -v seatd &>/dev/null; then
        sudo pacman -S --noconfirm --needed seatd >> "$BUILD_LOG" 2>&1 || \
        sudo apt-get install -y seatd >> "$BUILD_LOG" 2>&1 || \
        sudo dnf install -y seatd >> "$BUILD_LOG" 2>&1 || true
    fi
    # Ensure cage is installed
    if ! command -v cage &>/dev/null; then
        sudo pacman -S --noconfirm --needed cage >> "$BUILD_LOG" 2>&1 || \
        sudo apt-get install -y cage >> "$BUILD_LOG" 2>&1 || \
        sudo dnf install -y cage >> "$BUILD_LOG" 2>&1 || true
    fi
    sudo systemctl enable seatd >> "$BUILD_LOG" 2>&1 || true
    sudo systemctl start seatd >> "$BUILD_LOG" 2>&1 || true
    sudo usermod -aG seat "$USER" >> "$BUILD_LOG" 2>&1 || true
fi

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
