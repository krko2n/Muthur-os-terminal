# MUTHUR OS Terminal - Quick Start Guide

## Fast Installation (5 minutes)

### Prerequisites Check

```bash
# Check if you have git
git --version

# Check if you have a shell
echo $SHELL
```

### One-Command Install

```bash
git clone https://github.com/krko2n/Muthur-os-terminal.git && \
cd muthur-os-terminal && \
chmod +x install.sh && \
./install.sh
```

---

## First Launch

### 1. Start the Application

```bash
muthur
```

### 2. Initial Setup

On first launch:
- The application opens in fullscreen
- A terminal session starts automatically
- System monitoring begins immediately
- AI panel shows "OFFLINE" if Ollama isn't running

---

## Enable AI Features (Optional)

### Quick Ollama Setup

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download model (this takes a few minutes)
ollama pull llama3.2

# Start Ollama service
ollama serve
```

Leave `ollama serve` running in a separate terminal, then restart MUTHUR.

### Test AI Assistant

1. Click in the AI panel (right side)
2. Type: `#list files in home directory`
3. Press Enter
4. AI will suggest a command and auto-execute it

---

## UI Overview

```
┌─────────────────────────────────────────────────────────────┐
│  MUTHUR://CORE              SYSTEM: ONLINE    12:34:56      │
├─────────┬───────────────────────────────┬───────────────────┤
│         │                               │                   │
│ SYSTEM  │        TERMINAL TABS          │   ORBITAL         │
│  STATS  │   ┌────┬────┬────┐ [+ NEW]   │   [3D GLOBE]      │
│         │   │T1  │T2  │T3  │            │                   │
│ CPU ▓▓░ │   └────────────────┘          │   STATUS: OK      │
│ STORAGE │                               │   SIGNALS: OK     │
│         │   $ command prompt here_      │                   │
│ TOP     │                               │ ─────────────────│
│ PROCS   │                               │                   │
│         │                               │   AI ASSISTANT    │
│ VOLUMES │                               │                   │
│ READY   │   [Terminal output area]      │   > Ask MUTHUR   │
│         │                               │                   │
├─────────┴───────────────────────────────┤                   │
│  CONTROL DECK                           │                   │
│  THEMES / LAYOUT / SIM                  │                   │
│  [SIM] SIGNAL LOCK                      │                   │
│  [FONT] ORBITRON / RAJDHANI             │                   │
└─────────────────────────────────────────┴───────────────────┘
```

---

## Essential Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | New terminal tab |
| `Ctrl+Shift+W` | Close current tab |
| `Ctrl+Tab` | Switch to next tab |
| `Ctrl+Shift+Tab` | Switch to previous tab |
| `Esc` | Exit fullscreen |

---

## Quick Tips

### Terminal Features
- **Multi-tab**: Click "+ NEW" or press `Ctrl+Shift+T`
- **Copy/Paste**: Select text to copy, right-click to paste
- **Clickable links**: Click any URL in terminal output
- **Scrollback**: Scroll up to see 10,000 lines of history

### System Monitor
- Updates every 2 seconds
- Shows top 8 CPU-intensive processes
- Storage volumes are shown instead of memory panels
- The orbital display uses local fallback signals when remote data is unavailable

### Control Deck
- Change themes, fonts, audio, and layout from the bottom-left deck
- Use the layout presets for command, focus, wide, and simulation modes
- Open the SIM tab for the built-in Signal Lock micro-game

### AI Assistant
- **Command suggestions**: Type `#<what you want to do>`
  - Example: `#find all Python files`
  - AI suggests command and auto-executes
- **General chat**: Type normally for Q&A
- **Error debugging**: Paste error messages for fixes

---

## Configuration

### Config Directory

```bash
~/.config/xKOR_3RR0R/
├── crash_reports/    # Automatic crash logs
└── logs/            # Application logs
```

### Change AI Model

Edit `src-tauri/src/ai.rs` line 18:

```rust
model: "llama3.2".to_string(),  // Change to any Ollama model
```

Rebuild:
```bash
npm run tauri build
```

---

## Common Issues

### "Session closed" immediately after opening terminal
**Fix**: Check your shell path
```bash
echo $SHELL
# Should show /bin/bash or /bin/zsh
```

### AI shows "ERROR: AI service unavailable"
**Fix**: Ensure Ollama is running
```bash
# In another terminal:
ollama serve
```

### High CPU usage
**Fix**: Close unused terminal tabs, they each run a shell process

### Globe not rendering
**Fix**: Check GPU support
```bash
glxinfo | grep "OpenGL version"
# Should show 3.0 or higher
```

---

## Next Steps

1. **Customize**: Use the Control Deck to change colors, fonts, audio, and layout
2. **Extend**: Add new widgets in `src/components/`
3. **Theme**: Modify `src/index.css` for different CRT effects
4. **AI Model**: Try different Ollama models (llama3.1, mixtral, etc.)

---

## Full Documentation

See [README.md](README.md) for complete documentation.

---

## Getting Help

- **Issues**: https://github.com/krko2n/Muthur-os-terminal/issues
- **Discord**: [Coming soon]
- **Wiki**: [Coming soon]

---

**You're ready! Launch MUTHUR and enjoy your new terminal experience!**

`muthur`
