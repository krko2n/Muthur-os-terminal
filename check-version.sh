#!/bin/bash

# MUTHUR OS Terminal - Version Checker
# Quick script to check current version

echo "================================"
echo "MUTHUR OS TERMINAL VERSION CHECK"
echo "================================"
echo ""

CARGO_VERSION=$(grep "version" Cargo.toml | head -1 | cut -d'"' -f2)
PACKAGE_VERSION=$(grep "version" package.json | head -1 | cut -d'"' -f2 | tr -d ' ",')
TAURI_VERSION=$(grep "version" src-tauri/tauri.conf.json | head -1 | cut -d'"' -f2)

echo "Version in files:"
echo "  Cargo.toml:              $CARGO_VERSION"
echo "  package.json:            $PACKAGE_VERSION"
echo "  src-tauri/tauri.conf.json: $TAURI_VERSION"
echo ""

if [ "$CARGO_VERSION" = "$PACKAGE_VERSION" ] && [ "$PACKAGE_VERSION" = "$TAURI_VERSION" ]; then
    echo "[OK] All versions match: v$CARGO_VERSION"
else
    echo "[WARNING] Version mismatch detected!"
    exit 1
fi

echo ""
echo "Git tags:"
git tag -l | tail -5
echo ""

LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "No tags")
echo "Latest tag: $LATEST_TAG"
echo ""

if [ "$LATEST_TAG" = "v$CARGO_VERSION" ]; then
    echo "[OK] Current version matches latest tag"
else
    echo "[INFO] Current version (v$CARGO_VERSION) differs from latest tag ($LATEST_TAG)"
    echo "      Run ./version-bump.sh to create a new release"
fi
