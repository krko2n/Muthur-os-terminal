#!/bin/bash
#
# MUTHUR OS Terminal - Native installer/updater path.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

INSTALL_DIR="/usr/local/bin"
SYSTEM_BIN="/usr/bin"
SESSION_DIR="/usr/share/wayland-sessions"
DESKTOP_DIR="$HOME/.local/share/applications"
CONFIG_DIR="$HOME/.config/muthur"

info() { echo -e "${GREEN}[OK]${RESET} $*"; }
step() { echo -e "${BOLD}==>${RESET} $*"; }
warn() { echo -e "${YELLOW}[!!]${RESET} $*"; }
fail() { echo -e "${RED}[ERR]${RESET} $*"; exit 1; }

load_toolchains() {
    [ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env" || true
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || true
}

write_session_entry() {
    local target="$1"
    sudo tee "$target" >/dev/null <<'DESKTOP'
[Desktop Entry]
Type=Application
Version=1.0
Name=MUTHUR OS
GenericName=Native Fullscreen Terminal Session
Comment=Boot directly into the MUTHUR fullscreen environment
Icon=muthur
Exec=/usr/bin/muthur-session
DesktopNames=MUTHUR
DESKTOP
}

echo ""
echo -e "${BOLD}MUTHUR OS TERMINAL // NATIVE INSTALL${RESET}"
echo ""

load_toolchains
command -v npm >/dev/null 2>&1 || fail "npm was not found. Install Node.js first."
command -v cargo >/dev/null 2>&1 || fail "cargo was not found. Install Rust first."

if [ -f "$ROOT_DIR/scripts/muthur-health-check.sh" ]; then
    step "Running health check"
    bash "$ROOT_DIR/scripts/muthur-health-check.sh" || warn "Health check reported warnings/errors; continuing native install"
fi

step "Installing frontend dependencies"
npm ci --quiet || npm install --quiet
info "Dependencies ready"

step "Building MUTHUR runtime"
npm run build
(cd src-tauri && cargo build --release)
info "Build complete"

BINARY="src-tauri/target/release/muthur-os-terminal"
[ -f "$BINARY" ] || fail "Build artifact not found: $BINARY"

step "Installing runtime"
sudo install -Dm755 "$BINARY" "$INSTALL_DIR/muthur"
sudo ln -sf "$INSTALL_DIR/muthur" "$SYSTEM_BIN/muthur-os-terminal"
info "Runtime: $INSTALL_DIR/muthur"

step "Installing native session"
sudo install -Dm755 "$ROOT_DIR/scripts/muthur-native-session.sh" "$SYSTEM_BIN/muthur-session"
sudo mkdir -p "$SESSION_DIR"
write_session_entry "$SESSION_DIR/muthur.desktop"
info "Session: $SESSION_DIR/muthur.desktop"

step "Installing utilities"
[ -f "$ROOT_DIR/packaging/bin/kys" ] && sudo install -Dm755 "$ROOT_DIR/packaging/bin/kys" "$INSTALL_DIR/kys" || warn "kys utility missing"
[ -f "$ROOT_DIR/scripts/muthur-ui-native.sh" ] && sudo install -Dm755 "$ROOT_DIR/scripts/muthur-ui-native.sh" "$INSTALL_DIR/muthur-ui" || warn "muthur-ui utility missing"
info "Utilities installed"

mkdir -p "$DESKTOP_DIR" "$CONFIG_DIR"
if [ -f "$ROOT_DIR/packaging/muthur.desktop" ]; then
    install -Dm644 "$ROOT_DIR/packaging/muthur.desktop" "$DESKTOP_DIR/muthur.desktop"
fi

if [ -f "$ROOT_DIR/examples/config.toml.example" ] && [ ! -f "$CONFIG_DIR/config.toml" ]; then
    cp "$ROOT_DIR/examples/config.toml.example" "$CONFIG_DIR/config.toml"
fi

if [ -t 0 ] && [ -f "$ROOT_DIR/scripts/muthur-offline-pack.sh" ]; then
    echo ""
    pack_state="$(bash "$ROOT_DIR/scripts/muthur-offline-pack.sh" --status 2>/dev/null || true)"
    offline_answer=""
    if [ "$pack_state" = "current" ]; then
        echo -e "${DIM}Offline pack current${RESET}"
        offline_answer="n"
    elif [ "$pack_state" = "stale" ]; then
        read -r -p "Update optional offline AI/wiki/maps pack now? [y/N] " offline_answer || offline_answer=""
    else
        read -r -p "Install optional offline AI/wiki/maps pack now? [y/N] " offline_answer || offline_answer=""
    fi
    case "$offline_answer" in
        y|Y)
            if [ "$pack_state" = "stale" ]; then
                bash "$ROOT_DIR/scripts/muthur-offline-pack.sh" --auto || warn "Offline pack update did not finish cleanly"
            else
                bash "$ROOT_DIR/scripts/muthur-offline-pack.sh" --install || warn "Offline pack step did not finish cleanly"
            fi
            ;;
        *)
            if [ "$pack_state" != "current" ]; then
                warn "Offline pack skipped. Run later: scripts/muthur-offline-pack.sh"
            fi
            ;;
    esac
fi

SIZE=$(du -h "$INSTALL_DIR/muthur" | cut -f1)
echo ""
echo -e "${GREEN}${BOLD}INSTALL COMPLETE${RESET}"
echo -e "  ${DIM}Binary:${RESET}  $SIZE"
echo -e "  ${DIM}Launch:${RESET}  muthur"
echo -e "  ${DIM}Session:${RESET} MUTHUR OS"
echo ""
