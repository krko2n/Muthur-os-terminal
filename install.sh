#!/bin/bash

set -e

# MUTHUR OS Terminal Installation Script
# Supports: Arch Linux, Ubuntu/Debian, Fedora

echo "================================"
echo "MUTHUR OS TERMINAL INSTALLER"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Error: Do not run this script as root/sudo${NC}"
    echo "The script will ask for sudo password when needed"
    exit 1
fi

# Check if already installed
if [ -f "/usr/local/bin/muthur" ]; then
    echo -e "${YELLOW}MUTHUR is already installed${NC}"
    echo ""
    read -p "Reinstall? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled"
        echo "To upgrade, run: ./upgrade.sh"
        exit 0
    fi
    echo ""
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
        echo -e "${RED}Unsupported OS. This installer supports Arch, Debian/Ubuntu, and Fedora.${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK]${NC} Detected OS: $OS"
}

# Install system dependencies
install_deps() {
    echo ""
    echo "Installing system dependencies..."

    case $OS in
        arch)
            sudo pacman -Sy --noconfirm \
                base-devel \
                curl \
                wget \
                file \
                openssl \
                gtk3 \
                libappindicator-gtk3 \
                librsvg \
                webkit2gtk-4.1
            ;;
        debian)
            sudo apt update
            sudo apt install -y \
                build-essential \
                curl \
                wget \
                file \
                libssl-dev \
                libgtk-3-dev \
                libayatana-appindicator3-dev \
                librsvg2-dev \
                libwebkit2gtk-4.1-dev
            ;;
        fedora)
            sudo dnf install -y \
                gcc \
                gcc-c++ \
                make \
                curl \
                wget \
                file \
                openssl-devel \
                gtk3-devel \
                libappindicator-gtk3-devel \
                librsvg2-devel \
                webkit2gtk4.1-devel
            ;;
    esac

    echo -e "${GREEN}[OK]${NC} System dependencies installed"
}

# Install Rust
install_rust() {
    if command -v rustc &> /dev/null; then
        RUST_VERSION=$(rustc --version | cut -d' ' -f2)
        echo -e "${GREEN}[OK]${NC} Rust already installed: $RUST_VERSION"
    else
        echo ""
        echo -e "${YELLOW}Installing Rust...${NC}"
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        echo -e "${GREEN}[OK]${NC} Rust installed"
    fi
}

# Install Node.js
install_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}[OK]${NC} Node.js already installed: $NODE_VERSION"
    else
        echo ""
        echo -e "${YELLOW}Installing Node.js via nvm...${NC}"
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20
        nvm use 20
        echo -e "${GREEN}[OK]${NC} Node.js installed"
    fi
}

# Install Ollama (optional but recommended)
install_ollama() {
    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Ollama already installed"
    else
        echo ""
        read -p "Install Ollama for AI features? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo -e "${YELLOW}Installing Ollama...${NC}"
            curl -fsSL https://ollama.com/install.sh | sh
            echo -e "${GREEN}[OK]${NC} Ollama installed"
            echo -e "${BLUE}Tip: Run 'ollama pull llama3.2' to download the AI model${NC}"
        fi
    fi
}

# Build the application
build_app() {
    echo ""
    echo -e "${YELLOW}Building MUTHUR OS Terminal...${NC}"
    echo "This will take 5-10 minutes..."
    echo ""

    # Install npm dependencies
    echo -e "${YELLOW}[1/4]${NC} Installing frontend dependencies..."
    npm install --quiet
    echo -e "${GREEN}[OK]${NC} Dependencies installed"

    # Build frontend
    echo -e "${YELLOW}[2/4]${NC} Building frontend..."
    npm run build --quiet
    echo -e "${GREEN}[OK]${NC} Frontend built"

    # Build Rust backend
    echo -e "${YELLOW}[3/4]${NC} Building Rust backend (this takes longest)..."
    cd src-tauri
    cargo build --release --quiet
    cd ..
    echo -e "${GREEN}[OK]${NC} Backend built"

    # Build Tauri app bundles
    echo -e "${YELLOW}[4/4]${NC} Building application bundles..."
    npm run tauri build --quiet 2>/dev/null || true
    echo -e "${GREEN}[OK]${NC} Build complete"
}

# Install the application
install_app() {
    echo ""
    echo "Installing MUTHUR OS Terminal..."

    case $OS in
        arch|debian|fedora)
            if [ -f "src-tauri/target/release/bundle/appimage/muthur-os-terminal_0.1.0_amd64.AppImage" ]; then
                sudo cp "src-tauri/target/release/bundle/appimage/muthur-os-terminal_0.1.0_amd64.AppImage" /usr/local/bin/muthur
                sudo chmod +x /usr/local/bin/muthur
                echo -e "${GREEN}[OK]${NC} AppImage installed to /usr/local/bin/muthur"
            elif [ -f "src-tauri/target/release/bundle/deb/muthur-os-terminal_0.1.0_amd64.deb" ]; then
                sudo dpkg -i "src-tauri/target/release/bundle/deb/muthur-os-terminal_0.1.0_amd64.deb" 2>/dev/null
                echo -e "${GREEN}[OK]${NC} Deb package installed"
            else
                # Fallback: copy binary directly
                sudo cp "src-tauri/target/release/muthur-os-terminal" /usr/local/bin/muthur
                sudo chmod +x /usr/local/bin/muthur
                echo -e "${GREEN}[OK]${NC} Binary installed to /usr/local/bin/muthur"
            fi
            ;;
    esac

    # Create config directory
    mkdir -p ~/.config/xKOR_3RR0R/{crash_reports,logs}
    echo -e "${GREEN}[OK]${NC} Config directory created"
}

# Create desktop entry
create_desktop_entry() {
    echo ""
    echo "Creating desktop entry..."

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

    # Update desktop database
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database ~/.local/share/applications 2>/dev/null || true
    fi

    echo -e "${GREEN}[OK]${NC} Desktop entry created"
}

# Main installation flow
main() {
    detect_os
    install_deps
    install_rust
    install_node
    install_ollama
    build_app
    install_app
    create_desktop_entry

    echo ""
    echo "================================"
    echo -e "${GREEN}INSTALLATION COMPLETE${NC}"
    echo "================================"
    echo ""

    # Verify installation
    if [ -f "/usr/local/bin/muthur" ]; then
        SIZE=$(du -h /usr/local/bin/muthur | cut -f1)
        echo -e "${GREEN}[OK]${NC} Binary size: $SIZE"
        echo ""
    fi

    echo "Launch: muthur"
    echo "Or find 'MUTHUR OS Terminal' in your application menu"
    echo ""

    if command -v ollama &> /dev/null; then
        echo -e "${BLUE}AI Features Setup:${NC}"
        echo "  1. Start Ollama: ollama serve"
        echo "  2. Download model: ollama pull llama3.2"
        echo "  3. Restart MUTHUR"
        echo ""
    fi

    echo "Useful commands:"
    echo "  muthur         - Launch application"
    echo "  ./upgrade.sh   - Upgrade to latest version"
    echo "  ./uninstall.sh - Remove from system"
    echo ""
    echo "Documentation: https://github.com/krko2n/Muthur-os-terminal"
    echo ""
}

main
