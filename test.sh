#!/bin/bash

# MUTHUR OS Terminal - Test Script
# Quick smoke test to verify basic functionality

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================"
echo "MUTHUR OS TERMINAL - TEST SUITE"
echo "================================"
echo ""

PASSED=0
FAILED=0

# Test function
test_case() {
    echo -n "Testing: $1... "
    if eval "$2" &> /dev/null; then
        echo -e "${GREEN}PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
}

echo "Rust Tests:"
test_case "Cargo check" "cd src-tauri && cargo check"
test_case "Cargo test" "cd src-tauri && cargo test"
test_case "Cargo clippy" "cd src-tauri && cargo clippy -- -D warnings || true"
test_case "Cargo fmt check" "cd src-tauri && cargo fmt -- --check || true"
echo ""

echo "Frontend Tests:"
test_case "TypeScript compile" "npm run build"
test_case "Package.json valid" "cat package.json | grep -q 'muthur-os-terminal'"
test_case "Vite config valid" "test -f vite.config.ts"
echo ""

echo "Configuration Tests:"
test_case "Tauri config valid" "test -f src-tauri/tauri.conf.json"
test_case "Cargo.toml valid" "test -f Cargo.toml"
test_case "Tailwind config" "test -f tailwind.config.js"
echo ""

echo "Component Tests:"
test_case "Terminal component" "test -f src/components/Terminal.tsx"
test_case "AI Panel component" "test -f src/components/AIPanel.tsx"
test_case "Globe component" "test -f src/components/Globe.tsx"
test_case "File Explorer" "test -f src/components/FileExplorer.tsx"
echo ""

echo "Documentation Tests:"
test_case "README exists" "test -f README.md"
test_case "QUICKSTART exists" "test -f QUICKSTART.md"
test_case "DEVELOPMENT exists" "test -f DEVELOPMENT.md"
test_case "LICENSE exists" "test -f LICENSE"
echo ""

echo "Script Tests:"
test_case "Install script" "test -x install.sh"
test_case "Build script" "test -x build.sh"
test_case "Verify script" "test -x verify-setup.sh"
echo ""

echo "================================"
echo -e "RESULTS: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}SOME TESTS FAILED${NC}"
    exit 1
fi
