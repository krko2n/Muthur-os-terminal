#!/bin/bash

# MUTHUR OS Terminal - Uninstall Script

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================"
echo "MUTHUR OS TERMINAL - UNINSTALL"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Error: Do not run this script as root/sudo${NC}"
    echo "The script will ask for sudo password when needed"
    exit 1
fi

# Confirm uninstall
echo -e "${YELLOW}This will remove:${NC}"
echo "  - Binary: /usr/local/bin/muthur"
echo "  - Desktop entry: ~/.local/share/applications/muthur.desktop"
echo "  - Config directory: ~/.config/xKOR_3RR0R/"
echo ""
read -p "Are you sure you want to uninstall? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstall cancelled"
    exit 0
fi

# Remove binary
if [ -f "/usr/local/bin/muthur" ]; then
    echo -e "${YELLOW}Removing binary...${NC}"
    sudo rm -f /usr/local/bin/muthur
    echo -e "${GREEN}[OK]${NC} Binary removed"
else
    echo -e "${YELLOW}[SKIP]${NC} Binary not found"
fi

# Remove desktop entry
if [ -f "$HOME/.local/share/applications/muthur.desktop" ]; then
    echo -e "${YELLOW}Removing desktop entry...${NC}"
    rm -f "$HOME/.local/share/applications/muthur.desktop"
    echo -e "${GREEN}[OK]${NC} Desktop entry removed"
else
    echo -e "${YELLOW}[SKIP]${NC} Desktop entry not found"
fi

# Ask about config directory
if [ -d "$HOME/.config/xKOR_3RR0R" ]; then
    echo ""
    echo -e "${YELLOW}Config directory found:${NC} ~/.config/xKOR_3RR0R/"
    echo "This contains crash reports and logs."
    read -p "Remove config directory? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$HOME/.config/xKOR_3RR0R"
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
