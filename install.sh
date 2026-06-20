#!/bin/bash
#
# MUTHUR OS Terminal - Unified Installer & Upgrader
#
# This script handles BOTH fresh installation and upgrades through a single
# idempotent execution path. Every operation is safe to re-run.
#
# Usage:
#   ./install.sh          Full install/upgrade (interactive)
#   ./install.sh --quiet  Suppress non-essential prompts
#
# Supports: Arch Linux, Ubuntu/Debian, Fedora
#
# Portability: All source paths are resolved relative to script location.
# This script can be run from any directory on any target device.
#

set -euo pipefail

# ─── Script Location (portable, follows symlinks) ──────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")")" && pwd)"

# ─── Configuration ──────────────────────────────────────────────────────────

VERSION="0.1.1"
INSTALL_DIR="/usr/local/bin"
SYSTEM_BIN="/usr/bin"
CONFIG_DIR="$HOME/.config/muthur"
DATA_DIR="$HOME/.config/xKOR_3RR0R"
SESSION_DIR="/usr/share/wayland-sessions"
DESKTOP_DIR="$HOME/.local/share/applications"

QUIET="${1:-}"

# ─── Colors ─────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Helpers ────────────────────────────────────────────────────────────────

info()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!!]${NC} $*"; }
err()     { echo -e "${RED}[ERR]${NC} $*"; }
step()    { echo -e "${BLUE}[>>]${NC} $*"; }
dimtext() { echo -e "${DIM}$*${NC}"; }

# ─── Pre-flight Checks ─────────────────────────────────────────────────────

preflight() {
    echo ""
    echo "================================================================"
    echo -e "${BOLD} MUTHUR OS TERMINAL - INSTALLER${NC}"
    echo "================================================================"
    echo ""

    # Architecture check
    ARCH=$(uname -m)
    if [ "$ARCH" != "x86_64" ]; then
        err "Unsupported architecture: $ARCH (requires x86_64)"
        exit 1
    fi

    # Root check
    if [ "$EUID" -eq 0 ]; then
        err "Do not run as root/sudo. The script elevates when needed."
        exit 1
    fi

    # Detect existing installation
    EXISTING=""
    if [ -x "$INSTALL_DIR/muthur" ] || [ -x "$SYSTEM_BIN/muthur-os-terminal" ]; then
        EXISTING="true"
        echo -e " ${BOLD}Mode:${NC} UPGRADE (existing installation detected)"
    else
        echo -e " ${BOLD}Mode:${NC} FRESH INSTALL"
    fi

    # Detect OS
    detect_os

    # Show preflight summary
    echo ""
    echo -e " ${BOLD}Source:${NC}   $SCRIPT_DIR"
    echo -e " ${BOLD}Target:${NC}   $OS ($ARCH)"
    echo -e " ${BOLD}Version:${NC}  $VERSION"
    echo -e " ${BOLD}Binary:${NC}   $INSTALL_DIR/muthur"
    echo -e " ${BOLD}Config:${NC}   $CONFIG_DIR"
    echo ""

    # Advisory checks (non-fatal)
    check_optional_deps
}

detect_os() {
    if [ -f /etc/arch-release ]; then
        OS="arch"
    elif [ -f /etc/debian_version ]; then
        OS="debian"
    elif [ -f /etc/fedora-release ]; then
        OS="fedora"
    else
        err "Unsupported OS. Supports: Arch, Debian/Ubuntu, Fedora."
        exit 1
    fi
}

check_optional_deps() {
    dimtext "  Optional dependencies:"
    if command -v cage &>/dev/null; then
        dimtext "    native session host: installed"
    else
        dimtext "    native session host: not found (needed for boot-to-MUTHUR startup)"
    fi
    if command -v greetd &>/dev/null || systemctl is-active --quiet greetd 2>/dev/null; then
        dimtext "    greetd:  installed (session login available)"
    else
        dimtext "    greetd:  not found (install for auto-login: pacman -S greetd)"
    fi
    if command -v ollama &>/dev/null; then
        dimtext "    ollama:  installed (AI features available)"
    else
        dimtext "    ollama:  not found (install for AI: curl -fsSL https://ollama.com/install.sh | sh)"
    fi
    echo ""
}

# ─── System Dependencies ───────────────────────────────────────────────────

install_deps() {
    step "Installing system dependencies..."

    case $OS in
        arch)
            sudo pacman -Sy --noconfirm --needed \
                base-devel curl wget file openssl \
                gtk3 libappindicator-gtk3 librsvg webkit2gtk-4.1
            ;;
        debian)
            sudo apt-get update -qq
            sudo apt-get install -y -qq \
                build-essential curl wget file \
                libssl-dev libgtk-3-dev libayatana-appindicator3-dev \
                librsvg2-dev libwebkit2gtk-4.1-dev
            ;;
        fedora)
            sudo dnf install -y -q \
                gcc gcc-c++ make curl wget file \
                openssl-devel gtk3-devel libappindicator-gtk3-devel \
                librsvg2-devel webkit2gtk4.1-devel
            ;;
    esac

    info "System dependencies satisfied"
}

# ─── Toolchain ─────────────────────────────────────────────────────────────

install_rust() {
    if command -v rustc &>/dev/null; then
        info "Rust $(rustc --version | cut -d' ' -f2)"
    else
        step "Installing Rust toolchain..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        info "Rust installed"
    fi
}

install_node() {
    if command -v node &>/dev/null; then
        info "Node.js $(node --version)"
    else
        step "Installing Node.js via nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 24
        nvm use 24
        info "Node.js installed"
    fi
}

install_ollama() {
    if command -v ollama &>/dev/null; then
        info "Ollama available"
    else
        step "Installing Ollama for AI features..."
        curl -fsSL https://ollama.com/install.sh | sh 2>/dev/null || {
            warn "Ollama install failed (non-fatal). Install manually: https://ollama.com"
            return 0
        }
        info "Ollama installed"
    fi

    # Pull model if ollama is available and running
    if command -v ollama &>/dev/null; then
        if ! pgrep -x "ollama" >/dev/null 2>&1; then
            ollama serve >/dev/null 2>&1 &
            sleep 2
        fi
        step "Pulling AI model (llama3.2)..."
        ollama pull llama3.2 2>/dev/null || warn "Model pull failed - retry with: ollama pull llama3.2"
    fi
}

# ─── Build ─────────────────────────────────────────────────────────────────

build_app() {
    echo ""
    step "Building MUTHUR OS Terminal (5-10 minutes)..."

    cd "$SCRIPT_DIR"

    step "[1/2] Installing frontend dependencies..."
    npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps
    info "Dependencies installed"

    step "[2/2] Compiling application (frontend + backend)..."
    npm run tauri build
    info "Build complete"
}

# ─── Install / Upgrade Assets ──────────────────────────────────────────────

install_assets() {
    echo ""
    step "Deploying MUTHUR assets..."

    # ── Core Binary ──
    # Find the built binary (try multiple known locations)
    local binary=""
    for candidate in \
        "$SCRIPT_DIR/src-tauri/target/release/muthur-os-terminal" \
        "$SCRIPT_DIR/src-tauri/target/release/bundle/appimage/"*".AppImage"; do
        if [ -f "$candidate" ]; then
            binary="$candidate"
            break
        fi
    done

    if [ -z "$binary" ]; then
        err "Build artifact not found. Build may have failed."
        exit 1
    fi

    sudo install -Dm755 "$binary" "$INSTALL_DIR/muthur"
    # Symlink to standard system path
    sudo ln -sf "$INSTALL_DIR/muthur" "$SYSTEM_BIN/muthur-os-terminal"
    info "Binary: $INSTALL_DIR/muthur"

    # ── CLI Utilities ──
    if [ -f "$SCRIPT_DIR/packaging/bin/kys" ]; then
        sudo install -Dm755 "$SCRIPT_DIR/packaging/bin/kys" "$INSTALL_DIR/kys"
        sudo chmod 755 "$INSTALL_DIR/kys"
        info "Command: $INSTALL_DIR/kys"
    fi

    if [ -f "$SCRIPT_DIR/packaging/bin/mother-ui" ]; then
        sudo install -Dm755 "$SCRIPT_DIR/packaging/bin/mother-ui" "$INSTALL_DIR/mother-ui"
        sudo chmod 755 "$INSTALL_DIR/mother-ui"
        info "Command: $INSTALL_DIR/mother-ui"
    fi

    # ── Session Infrastructure ──
    if [ -f "$SCRIPT_DIR/packaging/muthur-session" ]; then
        sudo install -Dm755 "$SCRIPT_DIR/packaging/muthur-session" "$SYSTEM_BIN/muthur-session"
        sudo chmod 755 "$SYSTEM_BIN/muthur-session"
        info "Session: $SYSTEM_BIN/muthur-session"
    fi

    if [ -f "$SCRIPT_DIR/packaging/muthur-session.desktop" ]; then
        sudo mkdir -p "$SESSION_DIR"
        sudo install -Dm644 "$SCRIPT_DIR/packaging/muthur-session.desktop" "$SESSION_DIR/muthur.desktop"
        info "Session entry: $SESSION_DIR/muthur.desktop"
    fi

    # ── Desktop Entry ──
    mkdir -p "$DESKTOP_DIR"
    if [ -f "$SCRIPT_DIR/packaging/muthur.desktop" ]; then
        install -Dm644 "$SCRIPT_DIR/packaging/muthur.desktop" "$DESKTOP_DIR/muthur.desktop"
    else
        cat > "$DESKTOP_DIR/muthur.desktop" << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=MUTHUR OS Terminal
Comment=Cinematic terminal interface with AI integration
Exec=muthur-os-terminal
Icon=utilities-terminal
Terminal=false
Categories=System;TerminalEmulator;
Keywords=terminal;shell;muthur;ai;
EOF
    fi
    if command -v update-desktop-database &>/dev/null; then
        update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
    fi
    info "Desktop entry: $DESKTOP_DIR/muthur.desktop"

    # ── User Configuration (preserve existing) ──
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$DATA_DIR/crash_reports"
    mkdir -p "$DATA_DIR/logs"

    if [ -f "$SCRIPT_DIR/examples/config.toml.example" ] && [ ! -f "$CONFIG_DIR/config.toml" ]; then
        cp "$SCRIPT_DIR/examples/config.toml.example" "$CONFIG_DIR/config.toml"
        info "Config template: $CONFIG_DIR/config.toml"
    else
        dimtext "  Config preserved: $CONFIG_DIR/config.toml"
    fi

    # ── Compositor Profiles (reference copies, always refreshed) ──
    # ── Session hardening blueprints (reference copies, never auto-applied) ──
    mkdir -p "$CONFIG_DIR/kiosk"
    if [ -d "$SCRIPT_DIR/packaging/kiosk" ]; then
        cp -f "$SCRIPT_DIR/packaging/kiosk/"* "$CONFIG_DIR/kiosk/" 2>/dev/null || true
        dimtext "  Session hardening blueprints: $CONFIG_DIR/kiosk/"
    fi
}

# ─── Verification ──────────────────────────────────────────────────────────

verify_installation() {
    echo ""
    step "Verifying installation..."

    local errors=0

    # Binary check
    if [ -x "$INSTALL_DIR/muthur" ]; then
        local size
        size=$(du -h "$INSTALL_DIR/muthur" | cut -f1)
        info "Binary OK ($size)"
    else
        err "Binary missing: $INSTALL_DIR/muthur"
        errors=$((errors + 1))
    fi

    # Symlink check
    if [ -L "$SYSTEM_BIN/muthur-os-terminal" ]; then
        info "Symlink OK: $SYSTEM_BIN/muthur-os-terminal"
    else
        warn "Symlink missing (non-fatal)"
    fi

    # CLI utilities
    [ -x "$INSTALL_DIR/mother-ui" ] && info "mother-ui OK" || warn "mother-ui missing"
    [ -x "$INSTALL_DIR/kys" ] && info "kys OK" || warn "kys missing"

    # Config directories
    [ -d "$CONFIG_DIR" ] && info "Config dir OK" || warn "Config dir missing"
    [ -d "$DATA_DIR" ] && info "Data dir OK" || warn "Data dir missing"

    if [ $errors -gt 0 ]; then
        err "Installation verification failed ($errors errors)"
        exit 1
    fi
}

# ─── Summary ───────────────────────────────────────────────────────────────

print_summary() {
    echo ""
    echo "================================================================"
    if [ -n "$EXISTING" ]; then
        echo -e "${GREEN} UPGRADE COMPLETE${NC} - MUTHUR OS Terminal v$VERSION"
    else
        echo -e "${GREEN} INSTALLATION COMPLETE${NC} - MUTHUR OS Terminal v$VERSION"
    fi
    echo "================================================================"
    echo ""
    echo "  Commands:"
    echo "    muthur               Launch MUTHUR OS Terminal"
    echo "    mother-ui enable     Enable fullscreen autostart"
    echo "    mother-ui disable    Disable autostart"
    echo "    mother-ui status     Show current configuration"
    echo "    kys                  System shutdown (10s countdown)"
    echo ""
    echo "  Configuration:"
    echo "    $CONFIG_DIR/config.toml"
    echo ""
    echo "  Native Session (advanced):"
    echo "    See: $CONFIG_DIR/kiosk/README-KIOSK.md"
    echo ""
    if command -v ollama &>/dev/null; then
        echo "  AI Features:"
        echo "    Ensure 'ollama serve' is running"
        echo "    Model: ollama pull llama3.2"
        echo ""
    fi
    echo "  Documentation:"
    echo "    https://github.com/krko2n/Muthur-os-terminal"
    echo ""
}

# ─── Error Handler ─────────────────────────────────────────────────────────

handle_error() {
    echo ""
    err "================================================================"
    err " INSTALLATION FAILED"
    err "================================================================"
    echo ""
    echo "  Log: /tmp/muthur-install.log"
    echo "  Report: https://github.com/krko2n/Muthur-os-terminal/issues/new"
    echo ""
    exit 1
}

trap 'handle_error' ERR

# ─── Main ──────────────────────────────────────────────────────────────────

main() {
    exec > >(tee /tmp/muthur-install.log)
    exec 2>&1

    preflight
    install_deps
    install_rust
    install_node
    install_ollama
    build_app
    install_assets
    verify_installation
    print_summary
}

main
