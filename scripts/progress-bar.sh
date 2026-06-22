#!/bin/bash

# MUTHUR OS Terminal - CLI Progress Bar
# Pure bash, no external dependencies

# ANSI escape codes
GREEN='\033[32m'
DIM='\033[2m'
BOLD='\033[1m'
RST='\033[0m'
HIDE_CURSOR='\033[?25l'
SHOW_CURSOR='\033[?25h'
CLEAR_LINE='\033[2K'
MOVE_UP='\033[1A'

# Bar configuration
BAR_WIDTH=40

# Status messages mapped to progress ranges
get_status() {
    local pct=$1
    if   [ $pct -lt 5  ]; then echo "Initializing setup..."
    elif [ $pct -lt 12 ]; then echo "Checking system requirements..."
    elif [ $pct -lt 20 ]; then echo "Resolving dependency tree..."
    elif [ $pct -lt 30 ]; then echo "Downloading dependencies..."
    elif [ $pct -lt 38 ]; then echo "Verifying checksums..."
    elif [ $pct -lt 45 ]; then echo "Extracting files..."
    elif [ $pct -lt 55 ]; then echo "Compiling frontend assets..."
    elif [ $pct -lt 65 ]; then echo "Building Rust backend..."
    elif [ $pct -lt 75 ]; then echo "Linking binaries..."
    elif [ $pct -lt 82 ]; then echo "Configuring project..."
    elif [ $pct -lt 90 ]; then echo "Running post-install hooks..."
    elif [ $pct -lt 96 ]; then echo "Cleaning up temp files..."
    else                       echo "Finalizing installation..."
    fi
}

# Render the progress bar
draw() {
    local pct=$1
    local status=$2

    # Calculate fill
    local filled=$(( pct * BAR_WIDTH / 100 ))
    local empty=$(( BAR_WIDTH - filled ))

    # Build bar string
    local bar=""
    if [ $filled -gt 0 ]; then
        if [ $filled -gt 1 ]; then
            bar=$(printf '%*s' "$((filled - 1))" | tr ' ' '=')
            bar="${bar}>"
        else
            bar=">"
        fi
    fi
    local remaining=$(printf '%*s' "$empty" | tr ' ' '.')

    # Handle 100% (all filled, no arrow)
    if [ $pct -ge 100 ]; then
        bar=$(printf '%*s' "$BAR_WIDTH" | tr ' ' '=')
        remaining=""
    fi

    # Print bar line (carriage return + clear + content)
    printf "\r${CLEAR_LINE}  ${GREEN}${BOLD}[${bar}${DIM}${remaining}${RST}${GREEN}${BOLD}]${RST} ${GREEN}%3d%%${RST}" "$pct"
    # Print status line below
    printf "\n${CLEAR_LINE}  ${DIM}%s${RST}" "$status"
    # Move cursor back up so next iteration overwrites from bar line
    printf "${MOVE_UP}"
}

# Restore terminal on exit
cleanup() {
    printf "${SHOW_CURSOR}\n\n"
}
trap cleanup EXIT INT TERM

# --- Main ---
printf "${HIDE_CURSOR}"
printf "\n"  # Reserve space for the two lines

for pct in $(seq 0 100); do
    status=$(get_status $pct)
    draw $pct "$status"
    sleep 1
done

# Final state
printf "\r${CLEAR_LINE}  ${GREEN}${BOLD}[$(printf '%*s' "$BAR_WIDTH" | tr ' ' '=')]${RST} ${GREEN}100%%${RST}"
printf "\n${CLEAR_LINE}  ${GREEN}${BOLD}Done.${RST}\n"
