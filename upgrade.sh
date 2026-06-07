#!/bin/bash

# MUTHUR OS Terminal - Fully Autonomous Upgrade Script

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "================================"
echo "MUTHUR OS TERMINAL - UPGRADE"
echo "================================"
echo ""

# Ensure we're in the git repo
if [ ! -d ".git" ]; then
    echo -e "${RED}[FAIL]${NC} Not in a git repository"
    echo "Please run from the muthur-os-terminal directory"
    exit 1
fi

# If not installed at all, run full install
if [ ! -f "/usr/local/bin/muthur" ]; then
    echo -e "${YELLOW}MUTHUR is not installed. Running full install...${NC}"
    chmod +x install-auto.sh
    ./install-auto.sh
    exit 0
fi

# --- STEP 1: Pull latest version ---
echo -e "${BLUE}[1/4]${NC} Pulling latest version..."

CURRENT_VERSION=$(grep '"version"' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2)
echo "  Current: v$CURRENT_VERSION"

git fetch origin --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "  ${GREEN}Already up to date${NC}"
    echo ""
    echo "  Rebuilding anyway..."
else
    COMMITS_BEHIND=$(git rev-list --count HEAD..origin/main)
    echo "  $COMMITS_BEHIND new commit(s) available"
    git pull origin main --quiet
    echo -e "  ${GREEN}[OK]${NC} Repository updated"
fi

NEW_VERSION=$(grep '"version"' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2)
echo "  Version: v$NEW_VERSION"
echo ""

# --- STEP 2: Install/update dependencies ---
echo -e "${BLUE}[2/4]${NC} Installing dependencies..."

# Ensure Rust is available
if ! command -v rustc &> /dev/null; then
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    else
        echo "  Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --quiet
        source "$HOME/.cargo/env"
    fi
fi

# Ensure Node is available
if ! command -v node &> /dev/null; then
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        export NVM_DIR="$HOME/.nvm"
        . "$NVM_DIR/nvm.sh"
    else
        echo "  Installing Node.js..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash > /dev/null 2>&1
        export NVM_DIR="$HOME/.nvm"
        . "$NVM_DIR/nvm.sh"
        nvm install 20 --silent
    fi
fi

if [ -f "package-lock.json" ]; then
    npm ci --quiet 2>/dev/null || npm install --quiet
else
    npm install --quiet
fi
echo -e "  ${GREEN}[OK]${NC} Dependencies ready"
echo ""

# --- STEP 3: Build ---
echo -e "${BLUE}[3/4]${NC} Building MUTHUR (5-10 minutes)..."

# Kill running instances before build
if pgrep -x "muthur-os-terminal" > /dev/null 2>&1; then
    echo "  Stopping running instances..."
    pkill -x "muthur-os-terminal" || true
    sleep 1
fi

# Clean stale bundles only (keep cargo cache for faster rebuilds)
rm -rf dist/ dist-ssr/ src-tauri/target/release/bundle/

# Build frontend + backend together via Tauri CLI
npm run tauri build 2>&1 | tail -5
echo -e "  ${GREEN}[OK]${NC} Build complete"
echo ""

# --- STEP 4: Install ---
echo -e "${BLUE}[4/4]${NC} Installing..."

BINARY="src-tauri/target/release/muthur-os-terminal"

if [ ! -f "$BINARY" ]; then
    echo -e "  ${RED}[FAIL]${NC} Binary not found at $BINARY"
    echo "  Build may have failed. Check output above."
    exit 1
fi

sudo cp "$BINARY" /usr/local/bin/muthur
sudo chmod +x /usr/local/bin/muthur

SIZE=$(du -h /usr/local/bin/muthur | cut -f1)
echo -e "  ${GREEN}[OK]${NC} Installed to /usr/local/bin/muthur ($SIZE)"
echo ""

# --- Done ---
echo "================================"
echo -e "${GREEN}UPGRADE COMPLETE${NC}"
echo "================================"
echo ""
if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
    echo "  Upgraded: v$CURRENT_VERSION -> v$NEW_VERSION"
else
    echo "  Rebuilt: v$NEW_VERSION"
fi
echo ""
echo "  Run 'muthur' to launch"
echo ""
