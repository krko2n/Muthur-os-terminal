#!/bin/bash
#
# MUTHUR OS Terminal - Uninstall Script
#
# Usage:
#   ./uninstall.sh                    Remove a default /usr/local install
#   ./uninstall.sh --prefix ~/.local  Remove commands installed under a custom prefix
#
# When --prefix is not given, the prefix recorded by install.sh in
# ~/.config/muthur/install-prefix is used, then MUTHUR_PREFIX, then /usr/local.
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

DEFAULT_PREFIX="/usr/local"
SYSTEM_BIN="/usr/bin"
SESSION_DIR="/usr/share/wayland-sessions"
CONFIG_DIR="$HOME/.config/muthur"
PREFIX_RECORD="$CONFIG_DIR/install-prefix"
DATA_DIR="$HOME/.config/xKOR_3RR0R"
DESKTOP_FILE="$HOME/.local/share/applications/muthur.desktop"

# Commands install.sh places under <prefix>/bin.
COMMANDS="muthur muthur-bin muthur-cli muthur-ui kys"

usage() {
    cat <<USAGE
Usage: ./uninstall.sh [options]

Options:
  --prefix <path>      Remove commands installed under <path>/bin
                       (default: prefix recorded by install.sh, else /usr/local)
  --help, -h           Show this help

Environment:
  MUTHUR_PREFIX        Prefix to use when --prefix is not given and install.sh
                       recorded no prefix (same variable install.sh reads).
USAGE
}

PREFIX=""
PREFIX_SOURCE=""

while [ "$#" -gt 0 ]; do
    case "$1" in
        --prefix)
            [ "${2:-}" ] || { echo "Missing value for --prefix" >&2; exit 2; }
            PREFIX="$2"
            PREFIX_SOURCE="--prefix"
            shift
            ;;
        --prefix=*)
            PREFIX="${1#--prefix=}"
            [ -n "$PREFIX" ] || { echo "Missing value for --prefix" >&2; exit 2; }
            PREFIX_SOURCE="--prefix"
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
    shift
done

if [ -z "$PREFIX" ] && [ -f "$PREFIX_RECORD" ]; then
    PREFIX="$(head -n 1 "$PREFIX_RECORD")"
    PREFIX_SOURCE="$PREFIX_RECORD"
fi

if [ -z "$PREFIX" ] && [ -n "${MUTHUR_PREFIX:-}" ]; then
    PREFIX="$MUTHUR_PREFIX"
    PREFIX_SOURCE="MUTHUR_PREFIX"
fi

if [ -z "$PREFIX" ]; then
    PREFIX="$DEFAULT_PREFIX"
    PREFIX_SOURCE="default"
fi

case "$PREFIX" in
    "~") PREFIX="$HOME" ;;
    "~/"*) PREFIX="$HOME/${PREFIX#"~/"}" ;;
esac

INSTALL_DIR="$PREFIX/bin"
SYSTEM_ASSETS="false"
# Same rule as install.sh: only the exact default prefix gets system assets.
[ "$PREFIX" = "$DEFAULT_PREFIX" ] && SYSTEM_ASSETS="true"

echo "================================"
echo "MUTHUR OS TERMINAL - UNINSTALL"
echo "================================"
echo ""

# Check if running as root -- allow in disposable environments
is_disposable_env() {
    [ "${MUTHUR_ALLOW_ROOT:-}" = "1" ] && return 0
    [ "${CI:-}" = "true" ] && return 0
    [ -n "${GITHUB_ACTIONS:-}" ] && return 0
    [ -n "${GITLAB_CI:-}" ] && return 0
    [ -f /.dockerenv ] && return 0
    [ -f /run/.containerenv ] && return 0
    grep -qsw 'container' /proc/1/environ 2>/dev/null && return 0
    [ -d /run/archiso ] && return 0
    [ -f /etc/calamares ] && return 0
    findmnt -n -o FSTYPE / 2>/dev/null | grep -qs 'tmpfs\|squashfs\|overlay' && return 0
    if command -v systemd-detect-virt &>/dev/null; then
        local vtype
        vtype="$(systemd-detect-virt 2>/dev/null || true)"
        [ "$vtype" != "none" ] && [ -n "$vtype" ] && return 0
    fi
    return 1
}

maybe_sudo() {
    if [ "$EUID" -eq 0 ]; then
        "$@"
    else
        sudo "$@"
    fi
}

# Mirrors install.sh: paths under $HOME never need sudo.
needs_sudo_for_install_dir() {
    case "$INSTALL_DIR" in
        "$HOME"/*) return 1 ;;
        *) return 0 ;;
    esac
}

remove_install_file() {
    if needs_sudo_for_install_dir; then
        maybe_sudo rm -f "$1"
    else
        rm -f "$1"
    fi
}

if [ "$EUID" -eq 0 ]; then
    if is_disposable_env; then
        echo -e "${YELLOW}[!!]${NC} Running as root in a disposable environment."
    else
        echo -e "${RED}Error: Do not run this script as root/sudo on an installed system${NC}"
        echo "The script will ask for sudo password when needed."
        echo "Override: set MUTHUR_ALLOW_ROOT=1 if you know what you are doing."
        exit 1
    fi
fi

# Confirm uninstall
echo -e "${YELLOW}This will remove:${NC}"
echo "  - Commands in $INSTALL_DIR: $COMMANDS"
echo "    (prefix source: $PREFIX_SOURCE)"
if [ "$SYSTEM_ASSETS" = "true" ]; then
    echo "  - System link: $SYSTEM_BIN/muthur-os-terminal"
    echo "  - Session files: $SYSTEM_BIN/muthur-session, $SESSION_DIR/muthur.desktop"
fi
echo "  - Desktop entry: ~/.local/share/applications/muthur.desktop"
echo "  - Config directory (asked separately): ~/.config/xKOR_3RR0R/"
echo ""
read -p "Are you sure you want to uninstall? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstall cancelled"
    exit 0
fi

# Remove commands under the install prefix
removed_any="false"
for cmd in $COMMANDS; do
    target="$INSTALL_DIR/$cmd"
    if [ -e "$target" ] || [ -L "$target" ]; then
        remove_install_file "$target"
        echo -e "${GREEN}[OK]${NC} Removed $target"
        removed_any="true"
    fi
done
if [ "$removed_any" = "false" ]; then
    echo -e "${YELLOW}[SKIP]${NC} No MUTHUR commands found in $INSTALL_DIR"
fi

# System link and session files exist only for the default system install
if [ "$SYSTEM_ASSETS" = "true" ]; then
    if [ -L "$SYSTEM_BIN/muthur-os-terminal" ]; then
        maybe_sudo rm -f "$SYSTEM_BIN/muthur-os-terminal"
        echo -e "${GREEN}[OK]${NC} Removed $SYSTEM_BIN/muthur-os-terminal"
    else
        echo -e "${YELLOW}[SKIP]${NC} System link not found"
    fi
    for target in "$SYSTEM_BIN/muthur-session" "$SESSION_DIR/muthur.desktop"; do
        if [ -f "$target" ]; then
            maybe_sudo rm -f "$target"
            echo -e "${GREEN}[OK]${NC} Removed $target"
        fi
    done
fi

# Remove desktop entry
if [ -f "$DESKTOP_FILE" ]; then
    echo -e "${YELLOW}Removing desktop entry...${NC}"
    rm -f "$DESKTOP_FILE"
    echo -e "${GREEN}[OK]${NC} Desktop entry removed"
else
    echo -e "${YELLOW}[SKIP]${NC} Desktop entry not found"
fi

# The recorded prefix is no longer valid once its commands are gone
rm -f "$PREFIX_RECORD"

# Ask about config directory
if [ -d "$DATA_DIR" ]; then
    echo ""
    echo -e "${YELLOW}Config directory found:${NC} ~/.config/xKOR_3RR0R/"
    echo "This contains crash reports and logs."
    read -p "Remove config directory? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$DATA_DIR"
        echo -e "${GREEN}[OK]${NC} Config directory removed"
    else
        echo -e "${YELLOW}[KEEP]${NC} Config directory preserved"
    fi
else
    echo -e "${YELLOW}[SKIP]${NC} Config directory not found"
fi

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database ~/.local/share/applications 2>/dev/null || true
fi

echo ""
echo "================================"
echo -e "${GREEN}UNINSTALL COMPLETE${NC}"
echo "================================"
echo ""
echo "MUTHUR OS Terminal has been removed from your system."
echo ""
echo "To reinstall: ./install.sh"
echo ""
