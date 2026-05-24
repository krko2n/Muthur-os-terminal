#!/bin/bash

# MUTHUR OS Terminal - Setup Verification Script
# Checks if all dependencies are correctly installed

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================"
echo "MUTHUR SETUP VERIFICATION"
echo "================================"
echo ""

ERRORS=0

# Check function
check() {
    if command -v "$1" &> /dev/null; then
        VERSION=$($1 --version 2>&1 | head -n1)
        echo -e "${GREEN}[OK]${NC} $2: $VERSION"
    else
        echo -e "${RED}[MISSING]${NC} $2: NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
}

# Check with custom command
check_custom() {
    if eval "$1" &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} $2"
    else
        echo -e "${RED}[MISSING]${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "System Tools:"
check "git" "Git"
check "curl" "cURL"
check "wget" "wget"
echo ""

echo "Build Tools:"
check "gcc" "GCC"
check "make" "Make"
check_custom "pkg-config --version" "pkg-config"
echo ""

echo "Rust Toolchain:"
check "rustc" "Rust Compiler"
check "cargo" "Cargo"
check "rustup" "Rustup"
echo ""

echo "Node.js Toolchain:"
check "node" "Node.js"
check "npm" "NPM"
echo ""

echo "System Libraries:"
check_custom "pkg-config --exists gtk+-3.0" "GTK3"
check_custom "pkg-config --exists webkit2gtk-4.1 || pkg-config --exists webkit2gtk-4.0" "WebKit2GTK"
check_custom "pkg-config --exists openssl" "OpenSSL"
check_custom "pkg-config --exists librsvg-2.0" "librsvg"
echo ""

echo "Optional:"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Ollama: $(ollama --version 2>&1)"

    # Check if ollama is running
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Ollama service: RUNNING"

        # List available models
        MODELS=$(ollama list 2>&1 | grep -v "NAME" | awk '{print $1}')
        if [ -z "$MODELS" ]; then
            echo -e "${YELLOW}[WARNING]${NC} Ollama models: NONE (run 'ollama pull llama3.2')"
        else
            echo -e "${GREEN}[OK]${NC} Ollama models: $MODELS"
        fi
    else
        echo -e "${YELLOW}[WARNING]${NC} Ollama service: NOT RUNNING (run 'ollama serve')"
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} Ollama: NOT INSTALLED (AI features disabled)"
fi
echo ""

echo "Graphics:"
if command -v glxinfo &> /dev/null; then
    GL_VERSION=$(glxinfo | grep "OpenGL version" | head -n1)
    echo -e "${GREEN}[OK]${NC} $GL_VERSION"
else
    echo -e "${YELLOW}[WARNING]${NC} glxinfo not found (install mesa-utils)"
fi
echo ""

echo "Project Files:"
if [ -f "Cargo.toml" ]; then
    echo -e "${GREEN}[OK]${NC} Cargo.toml"
else
    echo -e "${RED}[MISSING]${NC} Cargo.toml"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "package.json" ]; then
    echo -e "${GREEN}[OK]${NC} package.json"
else
    echo -e "${RED}[MISSING]${NC} package.json"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "src-tauri/tauri.conf.json" ]; then
    echo -e "${GREEN}[OK]${NC} tauri.conf.json"
else
    echo -e "${RED}[MISSING]${NC} tauri.conf.json"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check node_modules
if [ -d "node_modules" ]; then
    echo -e "${GREEN}[OK]${NC} NPM dependencies installed"
else
    echo -e "${YELLOW}[WARNING]${NC} NPM dependencies not installed (run 'npm install')"
fi
echo ""

echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}ALL CHECKS PASSED!${NC}"
    echo ""
    echo "You're ready to build MUTHUR!"
    echo "Run: npm run tauri dev"
else
    echo -e "${RED}FOUND $ERRORS ERRORS${NC}"
    echo ""
    echo "Please install missing dependencies:"
    echo ""
    echo "Arch Linux:"
    echo "  sudo pacman -S base-devel gtk3 webkit2gtk librsvg openssl"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt install build-essential libgtk-3-dev libwebkit2gtk-4.1-dev librsvg2-dev libssl-dev"
    echo ""
    echo "Fedora:"
    echo "  sudo dnf install gcc gtk3-devel webkit2gtk4.1-devel librsvg2-devel openssl-devel"
    echo ""
    echo "Then run this script again."
fi
echo "================================"

exit $ERRORS
