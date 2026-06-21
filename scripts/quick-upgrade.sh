#!/bin/bash

# MUTHUR OS Terminal - Quick Upgrade
# Ultra-fast upgrade with minimal output

set -e

cd "$(dirname "$0")"

echo "Upgrading MUTHUR..."

# Fetch and pull
git fetch origin -q
git pull origin main -q 2>&1 | grep -v "Already up to date" || true

# Ensure environment
[ -s "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"
[ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"

# Update and build
npm install --legacy-peer-deps --silent 2>&1 | grep -v "npm WARN" || true
npm run build --silent 2>&1 | grep -v "vite" || true

cd src-tauri
cargo build --release 2>&1 | grep -v "Compiling" | grep -v "Finished" || true
cd ..

# Install
sudo cp src-tauri/target/release/muthur-os-terminal /usr/local/bin/muthur 2>/dev/null

if [ -f "/usr/local/bin/muthur" ]; then
    VERSION=$(grep "version" Cargo.toml | head -1 | cut -d'"' -f2)
    echo "[OK] Upgraded to v$VERSION"
else
    echo "[FAIL] Upgrade failed"
    exit 1
fi
