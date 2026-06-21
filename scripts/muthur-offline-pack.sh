#!/bin/bash
#
# MUTHUR OS Terminal - voluntary offline pack installer.
#
# Modules:
#   AI   - Ollama runtime and a local model
#   WIKI - offline ZIM archive from a user-provided URL
#   MAPS - offline map bundle from a user-provided URL
#   DOCS - local MUTHUR manual starter files

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
PACK_DIR="${MUTHUR_OFFLINE_DIR:-$DATA_HOME/muthur/offline}"
PACK_VERSION="${MUTHUR_OFFLINE_PACK_VERSION:-2026.06.20.1}"
MANIFEST="$PACK_DIR/manifest.json"
MODEL="${MUTHUR_AI_MODEL:-llama3.2}"
WIKI_PACK="${MUTHUR_WIKI_PACK:-wikipedia_en_simple_all}"
MAP_REGION="${MUTHUR_MAP_REGION:-world-low}"
WIKI_URL="${MUTHUR_WIKI_ZIM_URL:-}"
MAPS_URL="${MUTHUR_MAPS_URL:-}"
AUTO=0
STATUS_ONLY=0

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

info() { echo -e "${GREEN}[OK]${RESET} $*"; }
warn() { echo -e "${YELLOW}[!!]${RESET} $*"; }
step() { echo -e "${BOLD}==>${RESET} $*"; }
fail() { echo -e "${RED}[ERR]${RESET} $*"; exit 1; }

for arg in "$@"; do
    case "$arg" in
        --auto|--update) AUTO=1 ;;
        --install) ;;
        --status) STATUS_ONLY=1 ;;
        --help|-h)
            echo "Usage: scripts/muthur-offline-pack.sh [--install] [--auto|--update] [--status]"
            exit 0
            ;;
        *) echo "Unknown option: $arg" >&2; exit 2 ;;
    esac
done

manifest_string() {
    local key="$1"
    [ -f "$MANIFEST" ] || return 1
    sed -nE "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"([^\"]*)\".*/\1/p" "$MANIFEST" | head -1
}

manifest_bool() {
    local key="$1"
    [ -f "$MANIFEST" ] || return 1
    sed -nE "s/.*\"$key\"[[:space:]]*:[[:space:]]*(true|false).*/\1/p" "$MANIFEST" | head -1
}

pack_status() {
    if [ ! -f "$MANIFEST" ]; then
        echo "missing"
        return 10
    fi

    local version
    version="$(manifest_string version || true)"
    if [ "$version" = "$PACK_VERSION" ]; then
        echo "current"
        return 0
    fi

    echo "stale"
    return 11
}

if [ "$STATUS_ONLY" = "1" ]; then
    pack_status
    exit $?
fi

ask_yes() {
    local prompt="$1"
    local default="${2:-n}"
    local suffix="[y/N]"
    [ "$default" = "y" ] && suffix="[Y/n]"
    if [ "$AUTO" = "1" ]; then
        return 0
    fi
    read -r -p "$prompt $suffix " answer || answer=""
    answer="${answer:-$default}"
    [[ "$answer" =~ ^[Yy]$ ]]
}

download_file() {
    local url="$1"
    local target="$2"
    [ -n "$url" ] || return 2
    mkdir -p "$(dirname "$target")"
    if command -v curl >/dev/null 2>&1; then
        curl -L --fail --continue-at - -o "$target" "$url"
    elif command -v wget >/dev/null 2>&1; then
        wget -c -O "$target" "$url"
    else
        fail "curl or wget is required for downloads"
    fi
}

module_from_manifest() {
    local key="$1"
    [ "$(manifest_bool "$key" || true)" = "true" ]
}

should_install_ai() {
    [ "${MUTHUR_OFFLINE_AI:-}" = "1" ] && return 0
    [ "${MUTHUR_OFFLINE_AI:-}" = "0" ] && return 1
    if [ "$AUTO" = "1" ]; then
        module_from_manifest ai
        return $?
    fi
    ask_yes "Download/install offline AI pack?" "n"
}

should_install_wiki() {
    [ "${MUTHUR_OFFLINE_WIKI:-}" = "1" ] && return 0
    [ "${MUTHUR_OFFLINE_WIKI:-}" = "0" ] && return 1
    if [ "$AUTO" = "1" ]; then
        module_from_manifest wiki
        return $?
    fi
    ask_yes "Download offline wiki pack?" "n"
}

should_install_maps() {
    [ "${MUTHUR_OFFLINE_MAPS:-}" = "1" ] && return 0
    [ "${MUTHUR_OFFLINE_MAPS:-}" = "0" ] && return 1
    if [ "$AUTO" = "1" ]; then
        module_from_manifest maps
        return $?
    fi
    ask_yes "Download offline map pack?" "n"
}

should_install_docs() {
    [ "${MUTHUR_OFFLINE_DOCS:-}" = "0" ] && return 1
    [ "${MUTHUR_OFFLINE_DOCS:-}" = "1" ] && return 0
    if [ "$AUTO" = "1" ]; then
        module_from_manifest docs
        return $?
    fi
    return 0
}

install_ai() {
    step "Offline AI"
    if ! command -v ollama >/dev/null 2>&1; then
        if ask_yes "Ollama is missing. Install it now?" "n"; then
            curl -fsSL https://ollama.com/install.sh | sh || warn "Ollama installer failed"
        else
            warn "AI runtime skipped"
            return 0
        fi
    fi

    if command -v ollama >/dev/null 2>&1; then
        pgrep -x ollama >/dev/null 2>&1 || (ollama serve >/dev/null 2>&1 & sleep 2)
        ollama pull "$MODEL" || warn "Model pull failed. Retry with: ollama pull $MODEL"
        info "AI model requested: $MODEL"
    fi
}

install_wiki() {
    step "Offline wiki"
    local target="$PACK_DIR/wiki/$WIKI_PACK.zim"
    if [ -f "$target" ]; then
        info "Wiki pack already present: $target"
        return 0
    fi
    if [ -z "$WIKI_URL" ]; then
        warn "Set MUTHUR_WIKI_ZIM_URL to download a ZIM archive."
        warn "Example: MUTHUR_WIKI_ZIM_URL=https://... scripts/muthur-offline-pack.sh"
        return 0
    fi
    download_file "$WIKI_URL" "$target" && info "Wiki pack: $target"
}

install_maps() {
    step "Offline maps"
    local target="$PACK_DIR/maps/$MAP_REGION.mbtiles"
    if [ -f "$target" ]; then
        info "Map pack already present: $target"
        return 0
    fi
    if [ -z "$MAPS_URL" ]; then
        warn "Set MUTHUR_MAPS_URL to download an MBTiles or map bundle."
        return 0
    fi
    download_file "$MAPS_URL" "$target" && info "Map pack: $target"
}

install_docs() {
    step "Offline docs"
    mkdir -p "$PACK_DIR/docs"
    cat > "$PACK_DIR/docs/README.md" <<'DOCS'
# MUTHUR Offline Pack

This folder can hold local AI models, wiki ZIM archives, map bundles, and MUTHUR docs.

Useful commands:

- `scripts/muthur-health-check.sh`
- `scripts/muthur-offline-pack.sh --status`
- `scripts/muthur-offline-pack.sh --update`
- `make update`
- `kys`
DOCS
    info "Docs: $PACK_DIR/docs/README.md"
}

json_bool() {
    [ "$1" = "1" ] && echo "true" || echo "false"
}

write_manifest() {
    mkdir -p "$PACK_DIR"
    local ai="${1:-0}"
    local wiki="${2:-0}"
    local maps="${3:-0}"
    local docs="${4:-0}"
    cat > "$MANIFEST" <<JSON
{
  "version": "$PACK_VERSION",
  "updatedAt": "$(date -Iseconds)",
  "ai": $(json_bool "$ai"),
  "wiki": $(json_bool "$wiki"),
  "maps": $(json_bool "$maps"),
  "docs": $(json_bool "$docs"),
  "aiModel": "$MODEL",
  "wikiPack": "$WIKI_PACK",
  "mapRegion": "$MAP_REGION",
  "path": "$PACK_DIR",
  "source": "$ROOT_DIR"
}
JSON
    info "Manifest: $MANIFEST"
}

echo ""
echo -e "${BOLD}MUTHUR OPTIONAL OFFLINE PACK${RESET}"
echo -e "${DIM}Target: $PACK_DIR${RESET}"
echo -e "${DIM}Pack version: $PACK_VERSION${RESET}"
echo -e "${DIM}No download starts until an offline module is accepted.${RESET}"
echo ""

mkdir -p "$PACK_DIR"

AI_ENABLED=0
WIKI_ENABLED=0
MAPS_ENABLED=0
DOCS_ENABLED=0

if should_install_ai; then
    AI_ENABLED=1
    install_ai
fi

if should_install_wiki; then
    WIKI_ENABLED=1
    install_wiki
fi

if should_install_maps; then
    MAPS_ENABLED=1
    install_maps
fi

if should_install_docs; then
    DOCS_ENABLED=1
    install_docs
fi

write_manifest "$AI_ENABLED" "$WIKI_ENABLED" "$MAPS_ENABLED" "$DOCS_ENABLED"

echo ""
echo -e "${GREEN}${BOLD}OFFLINE PACK STEP COMPLETE${RESET}"
echo ""
