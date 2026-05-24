#!/bin/bash

# MUTHUR OS Terminal - Upgrade Script

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

# Auto-install missing dependencies
ensure_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"

    MISSING=0

    # Check Rust
    if ! command -v rustc &> /dev/null; then
        echo "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --quiet
        source "$HOME/.cargo/env"
        MISSING=1
    fi

    # Check Node
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash > /dev/null 2>&1
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20 --silent
        MISSING=1
    fi

    if [ $MISSING -eq 0 ]; then
        echo -e "${GREEN}[OK]${NC} All dependencies present"
    else
        echo -e "${GREEN}[OK]${NC} Missing dependencies installed"
    fi
}

# Check if muthur is installed
if [ ! -f "/usr/local/bin/muthur" ]; then
    echo -e "${YELLOW}MUTHUR is not installed${NC}"
    echo "Running automatic installation..."
    echo ""
    chmod +x install-auto.sh
    ./install-auto.sh
    exit 0
fi

# Check if we're in the git repo
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    echo "Please run this script from the muthur-os-terminal directory"
    exit 1
fi

# Save current version
echo -e "${BLUE}Checking current version...${NC}"
CURRENT_VERSION=$(grep "version" Cargo.toml | head -1 | cut -d'"' -f2)
echo "Current version: $CURRENT_VERSION"

# Fetch latest changes
echo ""
echo -e "${YELLOW}Fetching latest changes...${NC}"
git fetch origin

# Check if there are updates
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}[OK]${NC} Already up to date"
    echo ""
    read -p "Rebuild anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Upgrade cancelled"
        exit 0
    fi
else
    echo -e "${GREEN}[OK]${NC} Updates available"

    # Show what will be updated
    echo ""
    echo -e "${BLUE}Changes since your version:${NC}"
    git log --oneline HEAD..origin/main | head -10
    echo ""

    read -p "Continue with upgrade? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Upgrade cancelled"
        exit 0
    fi

    # Pull changes
    echo ""
    echo -e "${YELLOW}Pulling changes...${NC}"
    git pull origin main
    echo -e "${GREEN}[OK]${NC} Repository updated"
fi

# Get new version
NEW_VERSION=$(grep "version" Cargo.toml | head -1 | cut -d'"' -f2)
echo ""
echo "New version: $NEW_VERSION"

# Kill running instances
if pgrep -x "muthur-os-terminal" > /dev/null; then
    echo ""
    echo -e "${YELLOW}Stopping running instances...${NC}"
    pkill -x "muthur-os-terminal" || true
    sleep 2
    echo -e "${GREEN}[OK]${NC} Stopped"
fi

# Clean previous builds
echo ""
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf dist/ dist-ssr/ src-tauri/target/release/bundle/
echo -e "${GREEN}[OK]${NC} Clean complete"

# Install/update dependencies
echo ""
echo -e "${YELLOW}Updating dependencies...${NC}"
if [ -f "package-lock.json" ]; then
    npm ci --quiet
else
    npm install --quiet
fi
echo -e "${GREEN}[OK]${NC} Dependencies updated"

# Build
echo ""
echo -e "${YELLOW}Building application...${NC}"
npm run build --quiet
echo -e "${GREEN}[OK]${NC} Frontend built"

echo ""
echo -e "${YELLOW}Building Rust backend...${NC}"
cd src-tauri
cargo build --release --quiet
cd ..
echo -e "${GREEN}[OK]${NC} Backend built"

# Install
echo ""
echo -e "${YELLOW}Installing...${NC}"
sudo cp src-tauri/target/release/muthur-os-terminal /usr/local/bin/muthur
sudo chmod +x /usr/local/bin/muthur
echo -e "${GREEN}[OK]${NC} Installed to /usr/local/bin/muthur"

# Verify installation
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"
if [ -f "/usr/local/bin/muthur" ]; then
    SIZE=$(du -h /usr/local/bin/muthur | cut -f1)
    echo -e "${GREEN}[OK]${NC} Binary: $SIZE"
else
    echo -e "${RED}[FAIL]${NC} Installation verification failed"
    exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}UPGRADE COMPLETE${NC}"
echo "================================"
echo ""
echo "MUTHUR OS Terminal upgraded successfully!"
echo ""
echo "Old version: $CURRENT_VERSION"
echo "New version: $NEW_VERSION"
echo ""
echo "Run 'muthur' to launch"
echo ""
