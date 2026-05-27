#!/bin/bash
# Quick fix script for build issues on Linux

echo "Fixing MUTHUR OS Terminal build issues..."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Clean build artifacts
echo "Cleaning build artifacts..."
rm -rf dist/
rm -rf node_modules/.vite
rm -rf src-tauri/target/

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm ci --legacy-peer-deps

# Rebuild
echo "Building..."
npm run tauri build

echo "Build complete!"
echo "Binary: src-tauri/target/release/muthur-os-terminal"
echo "AppImage: src-tauri/target/release/bundle/appimage/*.AppImage"
