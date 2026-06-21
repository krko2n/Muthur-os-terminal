#!/bin/bash

# MUTHUR OS Terminal - Error Reporter
# Automatically creates GitHub issues for errors

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================"
echo "MUTHUR ERROR REPORTER"
echo "================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  Arch:   sudo pacman -S github-cli"
    echo "  Ubuntu: sudo apt install gh"
    echo "  Fedora: sudo dnf install gh"
    echo ""
    echo "Then authenticate: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub${NC}"
    echo "Run: gh auth login"
    exit 1
fi

ERROR_TYPE="$1"
ERROR_LOG="$2"

if [ -z "$ERROR_TYPE" ]; then
    echo "Usage: ./report-error.sh <type> [log-file]"
    echo ""
    echo "Types:"
    echo "  install    - Installation error"
    echo "  build      - Build error"
    echo "  runtime    - Runtime crash"
    echo "  upgrade    - Upgrade error"
    echo ""
    exit 1
fi

# Get system info
OS_INFO=$(cat /etc/os-release | grep "PRETTY_NAME" | cut -d'"' -f2)
KERNEL=$(uname -r)
VERSION=$(grep "version" Cargo.toml | head -1 | cut -d'"' -f2 || echo "unknown")

# Generate issue title
case $ERROR_TYPE in
    install)
        TITLE="Installation failed on $OS_INFO"
        LABEL="bug,installation"
        ;;
    build)
        TITLE="Build failed on $OS_INFO"
        LABEL="bug,build"
        ;;
    runtime)
        TITLE="Runtime crash on $OS_INFO"
        LABEL="bug,crash"
        ;;
    upgrade)
        TITLE="Upgrade failed on $OS_INFO"
        LABEL="bug,upgrade"
        ;;
    *)
        TITLE="Error: $ERROR_TYPE on $OS_INFO"
        LABEL="bug"
        ;;
esac

# Create issue body
BODY="## Error Report

**Automatically generated error report**

### System Information
- **OS**: $OS_INFO
- **Kernel**: $KERNEL
- **MUTHUR Version**: v$VERSION
- **Date**: $(date)
- **Error Type**: $ERROR_TYPE

### Error Details

"

if [ -n "$ERROR_LOG" ] && [ -f "$ERROR_LOG" ]; then
    BODY+="
\`\`\`
$(tail -100 "$ERROR_LOG")
\`\`\`
"
else
    BODY+="
No log file provided. Manual description needed.
"
fi

BODY+="

### Steps Attempted
1. Cloned repository
2. Ran installation command
3. Encountered error

### Expected Behavior
Installation should complete successfully.

---
*This issue was automatically created by the error reporting system.*
*Please add any additional information that might help diagnose the problem.*
"

# Create the issue
echo -e "${YELLOW}Creating GitHub issue...${NC}"
echo ""
echo "Title: $TITLE"
echo ""

ISSUE_URL=$(gh issue create \
    --repo krko2n/Muthur-os-terminal \
    --title "$TITLE" \
    --body "$BODY" \
    --label "$LABEL")

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}[OK]${NC} Error report created!"
    echo ""
    echo "Issue URL: $ISSUE_URL"
    echo ""
    echo "The maintainers will be notified automatically."
else
    echo ""
    echo -e "${RED}[FAIL]${NC} Could not create issue"
    echo ""
    echo "Manual reporting:"
    echo "  https://github.com/krko2n/Muthur-os-terminal/issues/new"
fi
