#!/bin/bash

# MUTHUR OS Terminal - Build Script
# Builds the application for production

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================"
echo "MUTHUR OS TERMINAL - BUILD"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf dist/ dist-ssr/ src-tauri/target/release/bundle/
echo -e "${GREEN}Clean complete${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing NPM dependencies...${NC}"
    npm install
    echo -e "${GREEN}NPM install complete${NC}"
    echo ""
fi

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build
echo -e "${GREEN}Frontend build complete${NC}"
echo ""

# Build Tauri app (try full bundle, fall back to binary-only if bundling fails)
echo -e "${YELLOW}Building Tauri application...${NC}"
if npm run tauri build 2>/dev/null; then
    echo -e "${GREEN}Tauri build complete (with bundles)${NC}"
else
    echo -e "${YELLOW}Bundling failed (missing linuxdeploy/dpkg), building binary only...${NC}"
    cd src-tauri && cargo build --release && cd ..
    echo -e "${GREEN}Binary build complete${NC}"
fi
echo ""

# Show build artifacts
echo "================================"
echo "BUILD ARTIFACTS:"
echo "================================"

if [ -f "src-tauri/target/release/muthur-os-terminal" ]; then
    SIZE=$(du -h "src-tauri/target/release/muthur-os-terminal" | cut -f1)
    echo "Binary: src-tauri/target/release/muthur-os-terminal ($SIZE)"
fi

if [ -d "src-tauri/target/release/bundle/appimage" ]; then
    for file in src-tauri/target/release/bundle/appimage/*.AppImage; do
        if [ -f "$file" ]; then
            SIZE=$(du -h "$file" | cut -f1)
            echo "AppImage: $file ($SIZE)"
        fi
    done
fi

if [ -d "src-tauri/target/release/bundle/deb" ]; then
    for file in src-tauri/target/release/bundle/deb/*.deb; do
        if [ -f "$file" ]; then
            SIZE=$(du -h "$file" | cut -f1)
            echo "Deb: $file ($SIZE)"
        fi
    done
fi

echo ""
echo -e "${GREEN}BUILD SUCCESSFUL!${NC}"
echo ""
echo "To test the binary:"
echo "  ./src-tauri/target/release/muthur-os-terminal"
echo ""
echo "To install:"
echo "  sudo cp src-tauri/target/release/muthur-os-terminal /usr/local/bin/muthur"
