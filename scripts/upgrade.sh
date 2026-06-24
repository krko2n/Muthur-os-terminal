#!/bin/bash

# MUTHUR OS Terminal - Full Upgrade Script
# Pulls latest from git, rebuilds, installs. Preserves all user data.

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# --- User data locations (all outside repo, safe by default) ---
# ~/.config/muthur/config.toml        - AI model settings
# ~/.config/muthur/kiosk/              - Kiosk mode configs
# ~/.config/xKOR_3RR0R/crash_reports/  - Crash logs
# Tauri webview localStorage:          - Interface settings, game saves, scores
#   ~/.local/share/muthur-os-terminal/ (Linux)
#   ~/Library/WebKit/muthur-os-terminal/ (macOS)

BACKUP_DIR="/tmp/muthur-upgrade-backup-$$"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/muthur"

ESC=$'\033'
HIDE="${ESC}[?25l"
SHOW="${ESC}[?25h"
GREEN="${ESC}[32m"
RED="${ESC}[31m"
DIM="${ESC}[2m"
BOLD="${ESC}[1m"
RESET="${ESC}[0m"

cleanup() { printf "%b" "$SHOW"; }
trap cleanup EXIT INT TERM
printf "%b" "$HIDE"

echo ""
printf "  ${BOLD}+------------------------------------------+${RESET}\n"
printf "  ${BOLD}|${RESET}  ${GREEN}MUTHUR OS TERMINAL${RESET}  ${DIM}// UPGRADE${RESET}        ${BOLD}|${RESET}\n"
printf "  ${BOLD}+------------------------------------------+${RESET}\n"
echo ""

# --- [1/6] Backup user data ---
printf "  ${DIM}[1/6]${RESET} Backing up user data...\n"

mkdir -p "$BACKUP_DIR"

if [ -d "$CONFIG_DIR" ]; then
    cp -r "$CONFIG_DIR" "$BACKUP_DIR/config"
fi

# Back up any user-created files in the repo root (custom scripts, notes)
for f in "$ROOT_DIR"/*.local "$ROOT_DIR"/*.user; do
    [ -f "$f" ] && cp "$f" "$BACKUP_DIR/"
done

printf "  ${GREEN}[OK]${RESET} User data saved to ${DIM}%s${RESET}\n" "$BACKUP_DIR"

# --- [2/6] Pull latest ---
printf "  ${DIM}[2/6]${RESET} Fetching latest version...\n"

if [ ! -d ".git" ]; then
    printf "  ${RED}[FAIL]${RESET} Not a git repository\n"
    exit 1
fi

git fetch origin --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    printf "  ${GREEN}[OK]${RESET} Already up to date\n"
    VERSION=$(grep '^version' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2 2>/dev/null || echo "unknown")
    printf "\n  ${DIM}Current version: v%s${RESET}\n\n" "$VERSION"
    rm -rf "$BACKUP_DIR"
    exit 0
fi

# Try fast-forward first, fall back to hard reset
if ! git pull --ff-only origin main --quiet 2>/dev/null; then
    printf "  ${DIM}  Diverged history - resetting to upstream...${RESET}\n"
    git reset --hard origin/main --quiet
fi

VERSION=$(grep '^version' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2 2>/dev/null || echo "unknown")
printf "  ${GREEN}[OK]${RESET} Updated to v%s\n" "$VERSION"

# --- [3/6] Load toolchains ---
printf "  ${DIM}[3/6]${RESET} Loading toolchains...\n"

[ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env" 2>/dev/null || true
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || true

if ! command -v npm &>/dev/null; then
    for p in /usr/local/bin /usr/bin "$HOME/.local/bin" "$HOME/.nvm/versions/node"/*/bin; do
        [ -x "$p/npm" ] && export PATH="$p:$PATH" && break
    done
fi

command -v npm &>/dev/null || { printf "  ${RED}[FAIL]${RESET} npm not found\n"; exit 1; }
command -v cargo &>/dev/null || { printf "  ${RED}[FAIL]${RESET} cargo not found\n"; exit 1; }
printf "  ${GREEN}[OK]${RESET} Toolchains ready\n"

# --- [4/6] Install dependencies ---
printf "  ${DIM}[4/6]${RESET} Installing dependencies...\n"

npm ci --quiet 2>/dev/null || npm install --quiet 2>/dev/null
printf "  ${GREEN}[OK]${RESET} Dependencies installed\n"

# --- [5/6] Build ---
printf "  ${DIM}[5/6]${RESET} Building (this takes a few minutes)...\n"

BUILD_LOG="/tmp/muthur-upgrade-build.log"

if pgrep -x "muthur-os-terminal" >/dev/null 2>&1; then
    pkill -x "muthur-os-terminal" || true
    sleep 1
fi

rm -rf dist/ src-tauri/target/release/bundle/ 2>/dev/null || true

npm run build >"$BUILD_LOG" 2>&1 || { printf "  ${RED}[FAIL]${RESET} Frontend build failed. See: %s\n" "$BUILD_LOG"; exit 1; }
(cd src-tauri && cargo build --release) >>"$BUILD_LOG" 2>&1 || { printf "  ${RED}[FAIL]${RESET} Rust build failed. See: %s\n" "$BUILD_LOG"; exit 1; }

printf "  ${GREEN}[OK]${RESET} Build complete\n"

# --- [6/6] Install ---
printf "  ${DIM}[6/6]${RESET} Installing binary...\n"

BINARY="src-tauri/target/release/muthur-os-terminal"
[ -f "$BINARY" ] || { printf "  ${RED}[FAIL]${RESET} Binary not found\n"; exit 1; }

sudo install -Dm755 "$BINARY" /usr/local/bin/muthur-bin
sudo ln -sf /usr/local/bin/muthur-bin /usr/bin/muthur-os-terminal 2>/dev/null || true

# Install launcher wrapper (self-healing: installs missing deps, configures seat)
cat > /tmp/muthur-launcher << 'WRAPPER'
#!/bin/bash
if [ -n "${DISPLAY:-}" ] || [ -n "${WAYLAND_DISPLAY:-}" ]; then
    exec muthur-bin "$@"
fi
install_missing() {
    local missing=()
    command -v cage &>/dev/null || missing+=(cage)
    command -v seatd &>/dev/null || missing+=(seatd)
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
if ! systemctl is-active --quiet seatd 2>/dev/null; then
    sudo systemctl enable seatd 2>/dev/null || true
    sudo systemctl start seatd 2>/dev/null || true
    sleep 0.3
fi
if ! id -nG | grep -qw seat; then
    sudo usermod -aG seat "$USER"
    exec sg seat -c "$0 $*"
fi
needs_software_renderer() {
    ls /dev/dri/renderD* &>/dev/null 2>&1 || return 0
    if command -v systemd-detect-virt &>/dev/null; then
        local vtype
        vtype="$(systemd-detect-virt 2>/dev/null || true)"
        [ "$vtype" != "none" ] && [ -n "$vtype" ] && return 0
    fi
    return 1
}
if needs_software_renderer; then
    export WLR_RENDERER=pixman
    export LIBGL_ALWAYS_SOFTWARE=1
    export GALLIUM_DRIVER=llvmpipe
    export WEBKIT_DISABLE_DMABUF_RENDERER=1
fi
exec cage -d -- muthur-bin "$@"
WRAPPER
sudo install -Dm755 /tmp/muthur-launcher /usr/local/bin/muthur
rm -f /tmp/muthur-launcher

# Pre-configure seat management during install
sudo systemctl enable seatd 2>/dev/null || true
sudo systemctl start seatd 2>/dev/null || true
sudo usermod -aG seat "$USER" 2>/dev/null || true

# --- Restore user data ---
if [ -d "$BACKUP_DIR/config" ]; then
    mkdir -p "$CONFIG_DIR"
    cp -rn "$BACKUP_DIR/config/"* "$CONFIG_DIR/" 2>/dev/null || true
fi

for f in "$BACKUP_DIR"/*.local "$BACKUP_DIR"/*.user; do
    [ -f "$f" ] && cp "$f" "$ROOT_DIR/"
done

rm -rf "$BACKUP_DIR"

printf "  ${GREEN}[OK]${RESET} Installed\n"

# --- Done ---
SIZE=$(du -h /usr/local/bin/muthur | cut -f1)
echo ""
printf "  ${BOLD}${GREEN}UPGRADE COMPLETE${RESET}\n"
printf "  ${DIM}Version:${RESET}  v%s\n" "$VERSION"
printf "  ${DIM}Binary:${RESET}   %s\n" "$SIZE"
printf "  ${DIM}Path:${RESET}     /usr/local/bin/muthur\n"
echo ""
printf "  ${DIM}User data preserved:${RESET}\n"
printf "    ${DIM}Settings, game saves, scores -- intact (webview storage)${RESET}\n"
printf "    ${DIM}AI config -- intact (%s)${RESET}\n" "$CONFIG_DIR"
echo ""
printf "  Run ${BOLD}muthur${RESET} to launch.\n"
echo ""
