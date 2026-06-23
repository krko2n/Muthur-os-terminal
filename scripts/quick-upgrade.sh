#!/bin/bash

# MUTHUR OS Terminal - Quick Upgrade
# Fast upgrade with minimal output. User data is always preserved.
# (Settings, game saves, scores live in webview localStorage and ~/.config/muthur)

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Upgrading MUTHUR..."

# Pull latest (user data lives outside the repo, never touched)
git fetch origin -q
if ! git pull --ff-only origin main -q 2>/dev/null; then
    git reset --hard origin/main -q
fi

# Load toolchains
[ -s "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"
[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ] && . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"

# Build
npm ci --quiet 2>/dev/null || npm install --quiet 2>/dev/null
npm run build --silent 2>&1 | grep -v "vite" || true
(cd src-tauri && cargo build --release 2>&1 | grep -v "Compiling" | grep -v "Finished" || true)

# Install
BINARY="src-tauri/target/release/muthur-os-terminal"
if [ -f "$BINARY" ]; then
    sudo install -Dm755 "$BINARY" /usr/local/bin/muthur-bin
    VERSION=$(grep '^version' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2)
    echo "[OK] Upgraded to v$VERSION"
    echo "     Settings, scores, and saves preserved."
else
    echo "[FAIL] Build failed"
    exit 1
fi
