#!/bin/bash
# Generate package-lock.json for deterministic CI builds
echo "Generating package-lock.json..."
npm install --legacy-peer-deps --package-lock-only
if [ -f package-lock.json ]; then
    echo "[OK] package-lock.json created"
else
    echo "[FAIL] Failed to create lockfile"
    exit 1
fi
