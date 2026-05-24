#!/bin/bash

# MUTHUR OS Terminal - Version Bump Script
# Automatically increments version and updates all files

set -e

CURRENT_VERSION=$(grep "version" Cargo.toml | head -1 | cut -d'"' -f2)

echo "Current version: $CURRENT_VERSION"
echo ""
echo "Bump type:"
echo "  1) Patch (0.1.0 -> 0.1.1) - Bug fixes"
echo "  2) Minor (0.1.0 -> 0.2.0) - New features"
echo "  3) Major (0.1.0 -> 1.0.0) - Breaking changes"
echo ""
read -p "Select (1-3): " choice

IFS='.' read -ra VERSION <<< "$CURRENT_VERSION"
MAJOR="${VERSION[0]}"
MINOR="${VERSION[1]}"
PATCH="${VERSION[2]}"

case $choice in
    1)
        PATCH=$((PATCH + 1))
        TYPE="patch"
        ;;
    2)
        MINOR=$((MINOR + 1))
        PATCH=0
        TYPE="minor"
        ;;
    3)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        TYPE="major"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

echo ""
echo "Bumping version: $CURRENT_VERSION -> $NEW_VERSION"
echo ""

# Update Cargo.toml
sed -i "s/version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" Cargo.toml

# Update package.json
sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update tauri.conf.json
sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json

# Update CHANGELOG.md
DATE=$(date +%Y-%m-%d)
cat > CHANGELOG.tmp << EOF
# Changelog

All notable changes to MUTHUR OS Terminal will be documented in this file.

## [${NEW_VERSION}] - ${DATE}

### Changes
- Version bump: ${CURRENT_VERSION} -> ${NEW_VERSION}

$(tail -n +5 CHANGELOG.md)
EOF

mv CHANGELOG.tmp CHANGELOG.md

echo "Updated files:"
echo "  - Cargo.toml"
echo "  - package.json"
echo "  - src-tauri/tauri.conf.json"
echo "  - CHANGELOG.md"
echo ""

read -p "Commit changes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add Cargo.toml package.json src-tauri/tauri.conf.json CHANGELOG.md
    git commit -m "chore: bump version to v${NEW_VERSION}"
    git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
    echo ""
    echo "Version bumped to v${NEW_VERSION}"
    echo ""
    echo "To push: git push && git push --tags"
fi
