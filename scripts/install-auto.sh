#!/bin/bash

set -e

# MUTHUR OS Terminal - Fully Automatic Installer
# Installs everything automatically without prompts

echo "================================"
echo "MUTHUR AUTOMATIC INSTALLER"
echo "================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root -- allow in disposable environments
is_disposable_env() {
    [ "${MUTHUR_ALLOW_ROOT:-}" = "1" ] && return 0
    [ "${CI:-}" = "true" ] && return 0
    [ -n "${GITHUB_ACTIONS:-}" ] && return 0
    [ -n "${GITLAB_CI:-}" ] && return 0
    [ -f /.dockerenv ] && return 0
    [ -f /run/.containerenv ] && return 0
    grep -qsw 'container' /proc/1/environ 2>/dev/null && return 0
    [ -d /run/archiso ] && return 0
    [ -f /etc/calamares ] && return 0
    findmnt -n -o FSTYPE / 2>/dev/null | grep -qs 'tmpfs\|squashfs\|overlay' && return 0
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

if [ "$EUID" -eq 0 ]; then
    if is_disposable_env; then
        echo -e "${YELLOW}[!!]${NC} Running as root in a disposable environment."
    else
        echo -e "${RED}Error: Do not run as root on an installed system${NC}"
        echo "Override: set MUTHUR_ALLOW_ROOT=1 if you know what you are doing."
        exit 1
    fi
fi

# Detect OS
detect_os() {
    if [ -f /etc/arch-release ]; then
        OS="arch"
    elif [ -f /etc/debian_version ]; then
        OS="debian"
    elif [ -f /etc/fedora-release ]; then
        OS="fedora"
    else
        echo -e "${RED}Unsupported OS${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK]${NC} OS: $OS"
}

# Install all system dependencies
install_all_deps() {
    echo ""
    echo -e "${YELLOW}Installing system dependencies...${NC}"

    case $OS in
        arch)
            maybe_sudo pacman -Sy --noconfirm \
                base-devel curl wget file openssl gtk3 \
                libappindicator-gtk3 librsvg webkit2gtk-4.1 \
                github-cli git
            ;;
        debian)
            maybe_sudo apt update -qq
            maybe_sudo apt install -y -qq \
                build-essential curl wget file libssl-dev \
                libgtk-3-dev libayatana-appindicator3-dev \
                librsvg2-dev libwebkit2gtk-4.1-dev \
                git gh
            ;;
        fedora)
            maybe_sudo dnf install -y -q \
                gcc gcc-c++ make curl wget file openssl-devel \
                gtk3-devel libappindicator-gtk3-devel \
                librsvg2-devel webkit2gtk4.1-devel \
                gh git
            ;;
    esac
    echo -e "${GREEN}[OK]${NC} System dependencies installed"
}

# Auto-install Rust
install_rust() {
    if command -v rustc &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Rust: $(rustc --version | cut -d' ' -f2)"
    else
        echo ""
        echo -e "${YELLOW}Installing Rust...${NC}"
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --quiet
        source "$HOME/.cargo/env"
        echo -e "${GREEN}[OK]${NC} Rust installed"
    fi
}

# Auto-install Node.js
install_node() {
    if command -v node &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Node.js: $(node --version)"
    else
        echo ""
        echo -e "${YELLOW}Installing Node.js...${NC}"
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash > /dev/null 2>&1
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 24 --silent
        nvm use 24 --silent
        echo -e "${GREEN}[OK]${NC} Node.js installed"
    fi
}

# Auto-install and setup Ollama
install_ollama() {
    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Ollama: installed"
    else
        echo ""
        echo -e "${YELLOW}Installing Ollama (AI)...${NC}"
        curl -fsSL https://ollama.com/install.sh | sh > /dev/null 2>&1
        echo -e "${GREEN}[OK]${NC} Ollama installed"
    fi

    # Auto-download model in background
    if ! ollama list 2>/dev/null | grep -q "llama3.2"; then
        echo -e "${YELLOW}Downloading AI model (background)...${NC}"
        (ollama pull llama3.2 > /dev/null 2>&1 &)
        echo -e "${GREEN}[OK]${NC} AI model downloading in background"
    else
        echo -e "${GREEN}[OK]${NC} AI model: llama3.2"
    fi

    # Auto-start Ollama service
    if ! pgrep -x ollama > /dev/null; then
        echo -e "${YELLOW}Starting Ollama service...${NC}"
        (nohup ollama serve > /dev/null 2>&1 &)
        sleep 2
        echo -e "${GREEN}[OK]${NC} Ollama service started"
    else
        echo -e "${GREEN}[OK]${NC} Ollama service: running"
    fi
}

# Setup GitHub CLI
setup_gh() {
    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null; then
            echo -e "${GREEN}[OK]${NC} GitHub CLI: authenticated"
        else
            echo -e "${YELLOW}[INFO]${NC} GitHub CLI: not authenticated"
            echo "      Run 'gh auth login' later for error reporting"
        fi
    fi
}

# Build application
build_app() {
    echo ""
    echo -e "${YELLOW}Building MUTHUR (5-10 minutes)...${NC}"

    # Ensure we have the environment
    [ -s "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"
    [ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"

    echo -e "${YELLOW}[1/4]${NC} Installing dependencies..."
    npm install --legacy-peer-deps --silent 2>&1 | grep -v "^npm WARN" || true

    echo -e "${YELLOW}[2/4]${NC} Building frontend..."
    npm run build --silent 2>&1 | grep -v "^vite" || true

    echo -e "${YELLOW}[3/4]${NC} Building backend (longest step)..."
    cd src-tauri
    cargo build --release --quiet 2>&1 | grep -v "Compiling" | grep -v "Finished" || true
    cd ..

    echo -e "${YELLOW}[4/4]${NC} Creating bundles (optional)..."
    npm run tauri build --silent 2>&1 | grep -v "info" || echo -e "${DIM}  Bundling skipped (missing tools). Binary built successfully.${NC}"

    echo -e "${GREEN}[OK]${NC} Build complete"
}

# Install binary
install_binary() {
    echo ""
    echo -e "${YELLOW}Installing...${NC}"

    if [ -f "src-tauri/target/release/muthur-os-terminal" ]; then
        maybe_sudo cp src-tauri/target/release/muthur-os-terminal /usr/local/bin/muthur
        maybe_sudo chmod +x /usr/local/bin/muthur
        echo -e "${GREEN}[OK]${NC} Installed to /usr/local/bin/muthur"
    else
        echo -e "${RED}[FAIL]${NC} Binary not found"
        exit 1
    fi

    # Create config directory
    mkdir -p ~/.config/xKOR_3RR0R/{crash_reports,logs}

    # Create desktop entry
    mkdir -p ~/.local/share/applications
    cat > ~/.local/share/applications/muthur.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=MUTHUR OS Terminal
Comment=Advanced terminal interface with AI integration
Exec=/usr/local/bin/muthur
Icon=utilities-terminal
Terminal=false
Categories=System;TerminalEmulator;
Keywords=terminal;shell;prompt;command;
EOF

    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database ~/.local/share/applications 2>/dev/null || true
    fi

    echo -e "${GREEN}[OK]${NC} Desktop entry created"
}

# Error handler
handle_error() {
    echo ""
    echo -e "${RED}================================${NC}"
    echo -e "${RED}INSTALLATION FAILED${NC}"
    echo -e "${RED}================================${NC}"
    echo ""
    echo "Error log: /tmp/muthur-install-error.log"
    echo ""

    if command -v gh &> /dev/null && gh auth status &> /dev/null 2>&1; then
        echo "Creating error report..."
        ./report-error.sh install /tmp/muthur-install-error.log 2>/dev/null || \
            echo "Manual report: https://github.com/krko2n/Muthur-os-terminal/issues/new"
    else
        echo "Report: https://github.com/krko2n/Muthur-os-terminal/issues/new"
    fi
    exit 1
}

trap 'handle_error' ERR

# Main
main() {
    exec > >(tee /tmp/muthur-install-error.log)
    exec 2>&1

    detect_os
    install_all_deps
    install_rust
    install_node
    install_ollama
    setup_gh
    build_app
    install_binary

    echo ""
    echo "================================"
    echo -e "${GREEN}INSTALLATION COMPLETE${NC}"
    echo "================================"
    echo ""

    if [ -f "/usr/local/bin/muthur" ]; then
        SIZE=$(du -h /usr/local/bin/muthur | cut -f1)
        echo -e "${GREEN}[OK]${NC} Binary: $SIZE"
    fi

    echo ""
    echo "Launch: ${GREEN}muthur${NC}"
    echo ""
    echo "Commands:"
    echo "  muthur           - Launch"
    echo "  make upgrade     - Update"
    echo "  make uninstall   - Remove"
    echo ""

    if pgrep -x ollama > /dev/null; then
        echo -e "${GREEN}AI Ready:${NC} Ollama running"
    else
        echo -e "${YELLOW}AI Setup:${NC} Run 'ollama serve' for AI features"
    fi
    echo ""
}

main
