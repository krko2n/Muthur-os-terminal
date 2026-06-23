#!/bin/bash
#
# muthur-ui - MUTHUR native session manager

set -euo pipefail

AUTOSTART_DIR="$HOME/.config/autostart"
AUTOSTART_FILE="$AUTOSTART_DIR/muthur-autostart.desktop"
GREETD_CONFIG="/etc/greetd/config.toml"
GREETD_BACKUP="/etc/greetd/config.toml.muthur-backup"

RED='\033[1;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

usage() {
    echo ""
    echo -e "${BOLD}muthur-ui${RESET} - MUTHUR Session Manager"
    echo ""
    echo "Usage:"
    echo "  muthur-ui enable    Enable MUTHUR fullscreen startup"
    echo "  muthur-ui disable   Disable MUTHUR startup"
    echo "  muthur-ui status    Show current configuration"
    echo ""
    exit 1
}

runtime_available() {
    command -v muthur-os-terminal >/dev/null 2>&1 || [ -x "/usr/bin/muthur-os-terminal" ] || [ -x "/usr/local/bin/muthur" ]
}

native_host_available() {
    [ -n "${MUTHUR_SESSION_HOST:-}" ] || command -v cage >/dev/null 2>&1
}

detect_login_system() {
    if systemctl is-active --quiet greetd 2>/dev/null; then
        echo "greetd"
    elif systemctl is-active --quiet gdm 2>/dev/null; then
        echo "gdm"
    elif systemctl is-active --quiet sddm 2>/dev/null; then
        echo "sddm"
    elif systemctl is-active --quiet lightdm 2>/dev/null; then
        echo "lightdm"
    else
        echo "xdg"
    fi
}

write_autostart() {
    mkdir -p "$AUTOSTART_DIR"
    cat > "$AUTOSTART_FILE" <<'DESKTOP'
[Desktop Entry]
Type=Application
Version=1.0
Name=MUTHUR OS
GenericName=Native Fullscreen Terminal Interface
Comment=Launch MUTHUR fullscreen on login
Icon=muthur
Exec=muthur-os-terminal --fullscreen-force
Terminal=false
StartupNotify=false
NoDisplay=true
X-GNOME-Autostart-enabled=true
X-KDE-autostart-after=panel
X-MATE-Autostart-enabled=true
Categories=System;TerminalEmulator;
DESKTOP
}

enable_greetd() {
    [ -f "$GREETD_CONFIG" ] || {
        echo -e "${RED}ERROR:${RESET} Login configuration not found at $GREETD_CONFIG"
        exit 1
    }

    if [ ! -f "$GREETD_BACKUP" ]; then
        sudo cp "$GREETD_CONFIG" "$GREETD_BACKUP"
        echo -e "  ${GREEN}Backup saved:${RESET} $GREETD_BACKUP"
    fi

    if grep -q '^\[initial_session\]' "$GREETD_CONFIG"; then
        sudo sed -i '/^\[initial_session\]/,/^\[/{
            /^\[initial_session\]/!{/^\[/!d}
        }' "$GREETD_CONFIG"
        sudo sed -i "/^\[initial_session\]/a\\
command = \"/usr/bin/muthur-session\"\\
user = \"$USER\"" "$GREETD_CONFIG"
    else
        printf '\n[initial_session]\ncommand = "/usr/bin/muthur-session"\nuser = "%s"\n' "$USER" | sudo tee -a "$GREETD_CONFIG" >/dev/null
    fi
}

enable() {
    local login_system
    login_system="$(detect_login_system)"

    echo -e "${BOLD}Detected login system:${RESET} $login_system"
    echo ""

    runtime_available || echo -e "${YELLOW}WARNING:${RESET} MUTHUR runtime was not found in PATH."
    native_host_available || echo -e "${YELLOW}WARNING:${RESET} Native fullscreen session host was not found."

    if [ "$login_system" = "greetd" ]; then
        enable_greetd
        echo -e "  ${GREEN}Native session enabled.${RESET}"
    fi

    write_autostart
    echo -e "  ${GREEN}Fullscreen startup enabled.${RESET}"
    echo -e "${DIM}Reboot or re-login to activate.${RESET}"
}

disable_greetd() {
    if [ -f "$GREETD_BACKUP" ]; then
        sudo cp "$GREETD_BACKUP" "$GREETD_CONFIG"
        sudo rm "$GREETD_BACKUP"
        echo -e "  ${GREEN}Login configuration restored.${RESET}"
    elif [ -f "$GREETD_CONFIG" ] && grep -q '^\[initial_session\]' "$GREETD_CONFIG"; then
        sudo sed -i '/^\[initial_session\]/,/^\[/{/^\[initial_session\]/d;/^\[/!d}' "$GREETD_CONFIG"
        echo -e "  ${GREEN}Native session entry removed.${RESET}"
    fi
}

disable() {
    disable_greetd
    if [ -f "$AUTOSTART_FILE" ]; then
        rm "$AUTOSTART_FILE"
        echo -e "  ${GREEN}Fullscreen startup disabled.${RESET}"
    else
        echo -e "  ${DIM}Fullscreen startup already disabled.${RESET}"
    fi
}

status() {
    local login_system
    login_system="$(detect_login_system)"
    echo -e "${BOLD}Login system:${RESET} $login_system"

    if [ -f "$GREETD_CONFIG" ] && grep -q '/usr/bin/muthur-session' "$GREETD_CONFIG" 2>/dev/null; then
        echo -e "${BOLD}Native session:${RESET} ${GREEN}ENABLED${RESET}"
    else
        echo -e "${BOLD}Native session:${RESET} ${DIM}not configured${RESET}"
    fi

    if [ -f "$AUTOSTART_FILE" ]; then
        echo -e "${BOLD}Fullscreen startup:${RESET} ${GREEN}ENABLED${RESET}"
    else
        echo -e "${BOLD}Fullscreen startup:${RESET} ${DIM}disabled${RESET}"
    fi

    runtime_available && echo -e "${BOLD}Runtime:${RESET} ${GREEN}available${RESET}" || echo -e "${BOLD}Runtime:${RESET} ${YELLOW}not found${RESET}"
    native_host_available && echo -e "${BOLD}Session host:${RESET} ${GREEN}available${RESET}" || echo -e "${BOLD}Session host:${RESET} ${YELLOW}not found${RESET}"
}

case "${1:-}" in
    enable) enable ;;
    disable) disable ;;
    status) status ;;
    -h|--help|help|"") usage ;;
    *)
        echo -e "${RED}Unknown command:${RESET} $1"
        usage
        ;;
esac
