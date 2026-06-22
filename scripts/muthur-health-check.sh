#!/bin/bash
#
# MUTHUR OS Terminal - installer health check.

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

errors=0
warnings=0

ok() { echo -e "${GREEN}[OK]${RESET} $*"; }
warn() { echo -e "${YELLOW}[!!]${RESET} $*"; warnings=$((warnings + 1)); }
bad() { echo -e "${RED}[ERR]${RESET} $*"; errors=$((errors + 1)); }

check_cmd() {
    local cmd="$1"
    local label="$2"
    if command -v "$cmd" >/dev/null 2>&1; then
        ok "$label: $(command -v "$cmd")"
    else
        bad "$label: missing"
    fi
}

echo ""
echo -e "${BOLD}MUTHUR HEALTH CHECK${RESET}"
echo ""

[ -d "$ROOT_DIR" ] && ok "source: $ROOT_DIR" || bad "source directory missing"

arch="$(uname -m 2>/dev/null || echo unknown)"
[ "$arch" = "x86_64" ] && ok "architecture: $arch" || bad "architecture: $arch (x86_64 required)"

check_cmd node "node"
check_cmd npm "npm"
check_cmd cargo "cargo"
check_cmd rustc "rustc"

if command -v git >/dev/null 2>&1; then
    ok "git: $(git --version)"
else
    warn "git missing (updates need it)"
fi

if command -v cage >/dev/null 2>&1; then
    ok "native session host: cage"
else
    warn "native session host not found (boot-to-MUTHUR sessions need one)"
fi

if command -v ollama >/dev/null 2>&1; then
    ok "offline AI runtime: ollama"
else
    warn "offline AI runtime not installed (optional pack can install it)"
fi

free_kb="$(df -Pk "$ROOT_DIR" | awk 'NR==2 {print $4}')"
if [ -n "$free_kb" ] && [ "$free_kb" -gt 1048576 ]; then
    ok "workspace free disk: $((free_kb / 1024)) MB"
else
    warn "workspace free disk may be low"
fi

echo ""
if [ "$errors" -gt 0 ]; then
    echo -e "${RED}${BOLD}HEALTH CHECK FAILED${RESET} ${DIM}errors=$errors warnings=$warnings${RESET}"
    exit 1
fi

echo -e "${GREEN}${BOLD}HEALTH CHECK PASSED${RESET} ${DIM}warnings=$warnings${RESET}"
exit 0
