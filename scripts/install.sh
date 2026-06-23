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
#   ./install.sh --dry-run  Show detected actions, then exit before changes
#   ./install.sh --no-deps  Skip system/Rust/Node dependency installation
#   ./install.sh --no-ollama  Skip optional Ollama/offline-AI steps
#   ./install.sh --prefix ~/.local  Install user binaries under a custom prefix
#
# Supports: Arch Linux, Ubuntu/Debian, Fedora
#
# Portability: All source paths are resolved relative to script location.
# This script can be run from any directory on any target device.
#

set -euo pipefail

# ─── Script Location (portable, follows symlinks) ──────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")")/.." && pwd)"

# ─── Configuration ──────────────────────────────────────────────────────────

VERSION="0.1.1"
PREFIX="${MUTHUR_PREFIX:-/usr/local}"
INSTALL_DIR=""
SYSTEM_BIN="/usr/bin"
CONFIG_DIR="$HOME/.config/muthur"
DATA_DIR="$HOME/.config/xKOR_3RR0R"
SESSION_DIR="/usr/share/wayland-sessions"
DESKTOP_DIR="$HOME/.local/share/applications"

QUIET=""
DRY_RUN="false"
SKIP_DEPS="false"
SKIP_OLLAMA="false"

usage() {
    cat <<EOF
Usage: ./install.sh [options]

Options:
  --quiet              Suppress non-essential prompts
  --dry-run            Print detected install plan and exit before changes
  --no-deps            Skip system, Rust, and Node dependency installation
  --no-ollama          Skip optional Ollama/offline-AI steps
  --prefix <path>      Install user binaries under <path>/bin (default: /usr/local)
  --help, -h           Show this help
EOF
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --quiet)
            QUIET="--quiet"
            ;;
        --dry-run)
            DRY_RUN="true"
            ;;
        --no-deps)
            SKIP_DEPS="true"
            ;;
        --no-ollama)
            SKIP_OLLAMA="true"
            ;;
        --prefix)
            [ "${2:-}" ] || { echo "Missing value for --prefix" >&2; exit 2; }
            PREFIX="$2"
            shift
            ;;
        --prefix=*)
            PREFIX="${1#--prefix=}"
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
    shift
done

case "$PREFIX" in
    "~") PREFIX="$HOME" ;;
    "~/"*) PREFIX="$HOME/${PREFIX#"~/"}" ;;
esac

INSTALL_DIR="$PREFIX/bin"
SYSTEM_ASSETS="true"
case "$PREFIX" in
    /usr/local) SYSTEM_ASSETS="true" ;;
    *) SYSTEM_ASSETS="false" ;;
esac

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

is_disposable_env() {
    # Explicit override
    [ "${MUTHUR_ALLOW_ROOT:-}" = "1" ] && return 0
    # CI environments
    [ "${CI:-}" = "true" ] && return 0
    [ -n "${GITHUB_ACTIONS:-}" ] && return 0
    [ -n "${GITLAB_CI:-}" ] && return 0
    # Container (Docker, Podman, LXC, systemd-nspawn)
    [ -f /.dockerenv ] && return 0
    [ -f /run/.containerenv ] && return 0
    grep -qsw 'container' /proc/1/environ 2>/dev/null && return 0
    # Live ISO (no persistent root password, archiso marker, or tmpfs root)
    [ -d /run/archiso ] && return 0
    [ -f /etc/calamares ] && return 0
    findmnt -n -o FSTYPE / 2>/dev/null | grep -qs 'tmpfs\|squashfs\|overlay' && return 0
    # Virtual machine (optional, less strict)
    if command -v systemd-detect-virt &>/dev/null; then
        local vtype
        vtype="$(systemd-detect-virt 2>/dev/null || true)"
        [ "$vtype" != "none" ] && [ -n "$vtype" ] && return 0
    fi
    return 1
}

maybe_sudo() {
    if [ "$EUID" -eq 0 ]; then
        "$@"
    else
        sudo "$@"
    fi
}

needs_sudo_for_install_dir() {
    case "$INSTALL_DIR" in
        "$HOME"/*) return 1 ;;
        *) return 0 ;;
    esac
}

install_binary_file() {
    local source="$1"
    local target="$2"
    if needs_sudo_for_install_dir; then
        maybe_sudo mkdir -p "$(dirname "$target")"
        maybe_sudo install -Dm755 "$source" "$target"
        maybe_sudo chmod 755 "$target"
    else
        mkdir -p "$(dirname "$target")"
        install -Dm755 "$source" "$target"
        chmod 755 "$target"
    fi
}

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

    # Root check -- allow in disposable environments, block on installed systems
    if [ "$EUID" -eq 0 ]; then
        if is_disposable_env; then
            warn "Running as root in a disposable environment."
            warn "Config will be written to /root -- acceptable for ISO/container/CI use."
        else
            err "Do not run as root/sudo on an installed system."
            err "The script elevates with sudo when needed."
            err "Override: set MUTHUR_ALLOW_ROOT=1 if you know what you are doing."
            exit 1
        fi
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
    echo -e " ${BOLD}Options:${NC}  dry-run=$DRY_RUN no-deps=$SKIP_DEPS no-ollama=$SKIP_OLLAMA system-assets=$SYSTEM_ASSETS"
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
        dimtext "    ollama:  installed (optional offline AI available)"
    else
        dimtext "    ollama:  not found (optional offline pack can install it)"
    fi
    echo ""
}

# ─── System Dependencies ───────────────────────────────────────────────────

install_deps() {
    step "Installing system dependencies..."

    case $OS in
        arch)
            maybe_sudo pacman -Sy --noconfirm --needed \
                base-devel curl wget file openssl xdg-utils \
                gtk3 libappindicator-gtk3 librsvg webkit2gtk-4.1 \
                cage greetd
            ;;
        debian)
            maybe_sudo apt-get update -qq
            maybe_sudo apt-get install -y -qq \
                build-essential curl wget file xdg-utils \
                libssl-dev libgtk-3-dev libayatana-appindicator3-dev \
                librsvg2-dev libwebkit2gtk-4.1-dev \
                cage greetd
            ;;
        fedora)
            maybe_sudo dnf install -y -q \
                gcc gcc-c++ make curl wget file xdg-utils \
                openssl-devel gtk3-devel libappindicator-gtk3-devel \
                librsvg2-devel webkit2gtk4.1-devel \
                cage greetd
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

        # nvm refuses to run when PREFIX/NPM_CONFIG_PREFIX are set.
        # Our own PREFIX variable (install path) and any inherited npm prefix
        # must be cleared before nvm can operate.
        local _saved_prefix="${PREFIX:-}"
        unset PREFIX NPM_CONFIG_PREFIX npm_config_prefix

        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

        if ! command -v nvm &>/dev/null; then
            err "nvm failed to load. Check ~/.nvm/nvm.sh exists."
            PREFIX="$_saved_prefix"
            return 1
        fi

        nvm install 24
        nvm use 24

        # Restore installer PREFIX
        PREFIX="$_saved_prefix"
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

run_health_check() {
    if [ -f "$SCRIPT_DIR/scripts/muthur-health-check.sh" ]; then
        step "Running installer health check..."
        bash "$SCRIPT_DIR/scripts/muthur-health-check.sh" || warn "Health check reported warnings/errors; continuing installer path"
    fi
}

offer_offline_pack() {
    if [ "$QUIET" = "--quiet" ]; then
        dimtext "  Offline pack skipped in quiet mode"
        return 0
    fi

    if [ ! -f "$SCRIPT_DIR/scripts/muthur-offline-pack.sh" ]; then
        warn "Offline pack helper missing"
        return 0
    fi

    local pack_state
    pack_state="$(bash "$SCRIPT_DIR/scripts/muthur-offline-pack.sh" --status 2>/dev/null || true)"

    if [ "$pack_state" = "current" ]; then
        dimtext "  Offline pack current"
        return 0
    fi

    echo ""
    echo -e "${BOLD}Optional offline pack${NC}"
    if [ "$pack_state" = "stale" ]; then
        echo "  Your offline pack is installed but needs a refresh."
        echo "  If accepted, existing selected modules update automatically."
        read -r -p "  Update optional offline pack now? [y/N] " answer || answer=""
    else
        echo "  AI model, local docs, wiki archive, and map bundles can be added now."
        echo "  Large downloads are voluntary and can be skipped."
        read -r -p "  Install optional offline pack now? [y/N] " answer || answer=""
    fi
    case "$answer" in
        y|Y)
            if [ "$pack_state" = "stale" ]; then
                if [ "$SKIP_OLLAMA" = "true" ]; then
                    MUTHUR_OFFLINE_AI=0 bash "$SCRIPT_DIR/scripts/muthur-offline-pack.sh" --auto || warn "Offline pack update did not finish cleanly"
                else
                    bash "$SCRIPT_DIR/scripts/muthur-offline-pack.sh" --auto || warn "Offline pack update did not finish cleanly"
                fi
            else
                if [ "$SKIP_OLLAMA" = "true" ]; then
                    MUTHUR_OFFLINE_AI=0 bash "$SCRIPT_DIR/scripts/muthur-offline-pack.sh" --install || warn "Offline pack step did not finish cleanly"
                else
                    bash "$SCRIPT_DIR/scripts/muthur-offline-pack.sh" --install || warn "Offline pack step did not finish cleanly"
                fi
            fi
            ;;
        *)
            dimtext "  Offline pack skipped. Run later: scripts/muthur-offline-pack.sh"
            ;;
    esac
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
    npm run build
    cd "$SCRIPT_DIR/src-tauri"
    cargo build --release
    cd "$SCRIPT_DIR"
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

    install_binary_file "$binary" "$INSTALL_DIR/muthur"
    # Symlink to standard system path only for the default system install.
    if [ "$SYSTEM_ASSETS" = "true" ]; then
        maybe_sudo ln -sf "$INSTALL_DIR/muthur" "$SYSTEM_BIN/muthur-os-terminal"
    else
        dimtext "  System symlink skipped for custom prefix"
    fi
    info "Binary: $INSTALL_DIR/muthur"

    # ── CLI Utilities ──
    if [ -f "$SCRIPT_DIR/packaging/bin/kys" ]; then
        install_binary_file "$SCRIPT_DIR/packaging/bin/kys" "$INSTALL_DIR/kys"
        info "Command: $INSTALL_DIR/kys"
    fi

    if [ -f "$SCRIPT_DIR/packaging/bin/muthur-ui" ]; then
        install_binary_file "$SCRIPT_DIR/packaging/bin/muthur-ui" "$INSTALL_DIR/muthur-ui"
        info "Command: $INSTALL_DIR/muthur-ui"
    fi

    # ── Session Infrastructure ──
    if [ "$SYSTEM_ASSETS" = "true" ] && [ -f "$SCRIPT_DIR/packaging/muthur-session" ]; then
        maybe_sudo install -Dm755 "$SCRIPT_DIR/packaging/muthur-session" "$SYSTEM_BIN/muthur-session"
        maybe_sudo chmod 755 "$SYSTEM_BIN/muthur-session"
        info "Session: $SYSTEM_BIN/muthur-session"
    fi

    if [ "$SYSTEM_ASSETS" = "true" ] && [ -f "$SCRIPT_DIR/packaging/muthur-session.desktop" ]; then
        maybe_sudo mkdir -p "$SESSION_DIR"
        maybe_sudo install -Dm644 "$SCRIPT_DIR/packaging/muthur-session.desktop" "$SESSION_DIR/muthur.desktop"
        info "Session entry: $SESSION_DIR/muthur.desktop"
    elif [ "$SYSTEM_ASSETS" != "true" ]; then
        dimtext "  Native session files skipped for custom prefix"
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
    if [ "$SYSTEM_ASSETS" != "true" ]; then
        dimtext "  Symlink check skipped for custom prefix"
    elif [ -L "$SYSTEM_BIN/muthur-os-terminal" ]; then
        info "Symlink OK: $SYSTEM_BIN/muthur-os-terminal"
    else
        warn "Symlink missing (non-fatal)"
    fi

    # CLI utilities
    [ -x "$INSTALL_DIR/muthur-ui" ] && info "muthur-ui OK" || warn "muthur-ui missing"
    [ -x "$INSTALL_DIR/kys" ] && info "kys OK" || warn "kys missing"

    # Config directories
    [ -d "$CONFIG_DIR" ] && info "Config dir OK" || warn "Config dir missing"
    [ -d "$DATA_DIR" ] && info "Data dir OK" || warn "Data dir missing"

    if [ $errors -gt 0 ]; then
        err "Installation verification failed ($errors errors)"
        exit 1
    fi
}

# ─── Autostart Setup ──────────────────────────────────────────────────────

offer_display_setup() {
    # Skip in quiet mode
    [ "$QUIET" = "--quiet" ] && return 0

    # Enable greetd so the display server is ready on boot
    maybe_sudo systemctl enable greetd 2>/dev/null || true

    echo ""
    echo -e "${BOLD}MUTHUR session ready.${NC}"
    echo "  Display server (cage + greetd) is installed."
    echo ""
    echo "  Autostart options:"
    echo "    1) Enable  - MUTHUR launches fullscreen on boot (replaces login screen)"
    echo "    2) Disable - Launch manually with 'muthur' after login"
    echo ""

    local choice=""
    read -r -p "  Select [1/2]: " choice || choice="2"

    case "$choice" in
        1)
            if [ -x "$INSTALL_DIR/muthur-ui" ]; then
                "$INSTALL_DIR/muthur-ui" enable 2>/dev/null || true
            fi
            info "Autostart ENABLED. MUTHUR will launch on next boot."
            echo "  Disable later with: muthur-ui disable"
            ;;
        *)
            info "Autostart disabled. Launch manually with: muthur"
            echo "  Enable later with: muthur-ui enable"
            ;;
    esac
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
    echo "    muthur-ui enable     Enable fullscreen autostart"
    echo "    muthur-ui disable    Disable autostart"
    echo "    muthur-ui status     Show current configuration"
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
    if [ "$DRY_RUN" != "true" ]; then
        exec > >(tee /tmp/muthur-install.log)
        exec 2>&1
    fi

    preflight
    if [ "$DRY_RUN" = "true" ]; then
        info "Dry run complete. No files were changed."
        exit 0
    fi

    if [ "$SKIP_DEPS" = "true" ]; then
        warn "Skipping system, Rust, and Node dependency installation (--no-deps)"
    else
        install_deps
        install_rust
        install_node
    fi
    run_health_check
    build_app
    install_assets
    offer_offline_pack
    verify_installation
    offer_display_setup
    print_summary
}

main
