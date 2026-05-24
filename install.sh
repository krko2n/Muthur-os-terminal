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
NC='\033[0m' # No Color

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
    echo -e "${GREEN}Detected OS: $OS${NC}"
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
                appmenu-gtk-module \
                gtk3 \
                libappindicator-gtk3 \
                librsvg \
                webkit2gtk
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

    echo -e "${GREEN}System dependencies installed!${NC}"
}

# Install Rust
install_rust() {
    if command -v rustc &> /dev/null; then
        echo -e "${GREEN}Rust already installed!${NC}"
    else
        echo ""
        echo "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        echo -e "${GREEN}Rust installed!${NC}"
    fi
}

# Install Node.js
install_node() {
    if command -v node &> /dev/null; then
        echo -e "${GREEN}Node.js already installed!${NC}"
    else
        echo ""
        echo "Installing Node.js via nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20
        nvm use 20
        echo -e "${GREEN}Node.js installed!${NC}"
    fi
}

# Install Ollama (optional but recommended)
install_ollama() {
    echo ""
    read -p "Install Ollama for AI features? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
        echo -e "${GREEN}Ollama installed!${NC}"
        echo -e "${YELLOW}Run 'ollama pull llama3.2' to download the AI model${NC}"
    fi
}

# Build the application
build_app() {
    echo ""
    echo "Building MUTHUR OS Terminal..."

    # Install npm dependencies
    echo "Installing frontend dependencies..."
    npm install

    # Install Rust dependencies and build
    echo "Building Rust backend..."
    cd src-tauri
    cargo build --release
    cd ..

    # Build frontend
    echo "Building frontend..."
    npm run build

    # Build Tauri app
    echo "Building Tauri application..."
    npm run tauri build

    echo -e "${GREEN}Build complete!${NC}"
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
                echo -e "${GREEN}AppImage installed to /usr/local/bin/muthur${NC}"
            elif [ -f "src-tauri/target/release/bundle/deb/muthur-os-terminal_0.1.0_amd64.deb" ]; then
                sudo dpkg -i "src-tauri/target/release/bundle/deb/muthur-os-terminal_0.1.0_amd64.deb"
                echo -e "${GREEN}Deb package installed!${NC}"
            else
                # Fallback: copy binary directly
                sudo cp "src-tauri/target/release/muthur-os-terminal" /usr/local/bin/muthur
                sudo chmod +x /usr/local/bin/muthur
                echo -e "${GREEN}Binary installed to /usr/local/bin/muthur${NC}"
            fi
            ;;
    esac

    # Create config directory
    mkdir -p ~/.config/xKOR_3RR0R/{crash_reports,logs}

    echo -e "${GREEN}Installation complete!${NC}"
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

    echo -e "${GREEN}Desktop entry created!${NC}"
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
    echo -e "${GREEN}INSTALLATION COMPLETE!${NC}"
    echo "================================"
    echo ""
    echo "Run 'muthur' to launch the application"
    echo "Or find it in your application menu"
    echo ""
    echo "For AI features, make sure Ollama is running:"
    echo "  ollama serve"
    echo "  ollama pull llama3.2"
    echo ""
    echo "Crash reports: ~/.config/xKOR_3RR0R/crash_reports/"
    echo ""
}

main
