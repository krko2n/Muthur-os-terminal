# MUTHUR OS TERMINAL

<div align="center">

**Advanced Terminal Interface with AI Integration**

*Inspired by eDEX-UI · Built with Tauri v2 + Rust + React 19*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)

</div>

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/krko2n/Muthur-os-terminal.git
cd muthur-os-terminal

# Install (takes 5-10 minutes)
make install

# Launch
muthur
```

---

## Table of Contents

- [Installation](#installation)
- [Upgrade](#upgrade)
- [Uninstall](#uninstall)
- [Features](#features)
- [Usage](#usage)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

### Requirements

- **OS**: Linux (Arch, Ubuntu, Debian, Fedora)
- **RAM**: 2 GB minimum (4 GB recommended)
- **Storage**: 500 MB free space
- **GPU**: OpenGL 3.0+ support

### One-Command Install

```bash
git clone https://github.com/krko2n/Muthur-os-terminal.git
cd muthur-os-terminal
make install
```

**What happens during installation:**

1. Detects your Linux distribution automatically
2. Installs system dependencies (GTK3, WebKit, OpenSSL, etc.)
3. Installs Rust toolchain (if not present)
4. Installs Node.js 20 (if not present)
5. Optionally installs Ollama for AI features
6. Builds the application (~5-10 minutes)
7. Installs to `/usr/local/bin/muthur`
8. Creates desktop entry

**Alternative install methods:**

```bash
# Using the script directly
./install.sh

# Manual step-by-step (see DEVELOPMENT.md)
```

### First Launch

```bash
muthur
```

Or find **"MUTHUR OS Terminal"** in your application menu.

---

## Upgrade

Keep MUTHUR up to date with the latest features and fixes.

### One-Command Upgrade

```bash
cd muthur-os-terminal
make upgrade
```

**What happens during upgrade:**

1. Fetches latest changes from GitHub
2. Shows changelog of what's new
3. Rebuilds the application
4. Replaces the installed binary
5. Preserves your configuration and settings

**Alternative upgrade methods:**

```bash
# Using the script directly
./upgrade.sh

# Manual upgrade
git pull origin main
make build
sudo cp src-tauri/target/release/muthur-os-terminal /usr/local/bin/muthur
```

### Check for Updates

```bash
cd muthur-os-terminal
git fetch origin
git log HEAD..origin/main --oneline
```

---

## Uninstall

Clean removal with optional configuration preservation.

### One-Command Uninstall

```bash
cd muthur-os-terminal
make uninstall
```

**What gets removed:**

- Binary at `/usr/local/bin/muthur`
- Desktop entry at `~/.local/share/applications/muthur.desktop`
- Optionally: Config directory at `~/.config/xKOR_3RR0R/`

**Alternative uninstall methods:**

```bash
# Using the script directly
./uninstall.sh

# Manual removal
sudo rm /usr/local/bin/muthur
rm ~/.local/share/applications/muthur.desktop
rm -rf ~/.config/xKOR_3RR0R/  # Optional: removes config
```

The uninstall script will ask before removing your configuration directory, which contains crash reports and logs.

---

## Features

### Core Functionality

**Multi-Tab Terminal**
- Full xterm.js terminal emulator
- Multiple sessions in tabs
- 256 color support
- Clickable links
- 10,000 line scrollback buffer

**Real-Time System Monitoring**
- CPU usage with live graphs
- Memory statistics
- Top processes by CPU usage
- Network RX/TX statistics
- Disk usage information

**AI Assistant (Ollama Integration)**
- Command suggestions with `#` prefix
- Automatic command execution
- Error debugging and fixes
- General Q&A assistance

**File System Explorer**
- Full filesystem access
- Directory navigation
- File metadata display
- Quick path jumping

**3D Network Visualization**
- WebGL-powered rotating globe
- Real-time connection status
- Low-latency rendering

### Visual Design

- Fullscreen borderless window
- Custom cursor with glow effect
- CRT scanline effects
- Matrix green color scheme (`#00ff41`)
- Retro-futuristic sci-fi aesthetic
- Smooth animations

### Performance

- **Idle CPU**: Less than 10%
- **Memory**: ~150 MB
- **Startup**: 1-2 seconds
- **Binary size**: ~18 MB

---

## Usage

### Launching

```bash
# Command line
muthur

# Application menu
Search for "MUTHUR OS Terminal"
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | New terminal tab |
| `Ctrl+Shift+W` | Close current tab |
| `Ctrl+Tab` | Switch to next tab |
| `Ctrl+Shift+Tab` | Switch to previous tab |
| `Ctrl+C` | Copy selected text |
| `Ctrl+V` | Paste from clipboard |
| `Esc` | Exit fullscreen mode |

### AI Assistant

**Command Suggestions** (type in AI panel):
```
#list all Python files
#find large files over 100MB
#show disk usage
#list running docker containers
```

AI will suggest the appropriate command and execute it automatically.

**Error Debugging**:
```
command not found: docker
```

AI will analyze the error and provide installation instructions.

**General Chat**:
```
What is SSH?
How do I install nginx?
Explain git rebase
```

---

## Configuration

### AI Model Setup (Optional)

MUTHUR uses Ollama for AI features. To enable:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download AI model
ollama pull llama3.2

# Start Ollama service
ollama serve
```

Keep `ollama serve` running in a separate terminal, then restart MUTHUR.

### Change AI Model

Edit `src-tauri/src/ai.rs` line 18:

```rust
model: "llama3.2".to_string(),  // Change to: llama3.1, mixtral, etc.
```

Then rebuild:
```bash
make build
sudo cp src-tauri/target/release/muthur-os-terminal /usr/local/bin/muthur
```

### Customize Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  'muthur-primary': '#00ff41',    // Matrix green
  'muthur-secondary': '#00d4ff',  // Cyan
  'muthur-accent': '#ff006e',     // Magenta
  // Change to your preferred colors
}
```

Then rebuild:
```bash
make build
```

### Config Files

```
~/.config/xKOR_3RR0R/
├── crash_reports/    # Automatic crash logs
└── logs/            # Application logs
```

---

## Troubleshooting

### Terminal Not Opening

**Symptom**: "Session closed" immediately after opening

**Fix**:
```bash
# Check your shell
echo $SHELL
# Should show /bin/bash or /bin/zsh

# If empty or wrong, install bash
sudo apt install bash  # Ubuntu/Debian
sudo pacman -S bash    # Arch
```

### AI Shows "ERROR"

**Symptom**: "AI service unavailable"

**Fix**:
```bash
# Check if Ollama is running
curl http://localhost:11434

# If error, start Ollama
ollama serve
```

### High CPU Usage

**Symptom**: Fans running loud, system slow

**Fix**:
- Close unused terminal tabs (each tab runs a shell process)
- Check for runaway processes in system monitor panel
- Reduce terminal scrollback in settings

### Graphics Issues

**Symptom**: Black screen, missing UI elements, or poor performance

**Fix**:
```bash
# Check OpenGL version
glxinfo | grep "OpenGL version"
# Should show 3.0 or higher

# Update GPU drivers
sudo apt update && sudo apt upgrade  # Ubuntu/Debian
sudo pacman -Syu                     # Arch

# If still issues, disable hardware acceleration
LIBGL_ALWAYS_SOFTWARE=1 muthur
```

### Build Failures

**Symptom**: Errors during `make install`

**Fix**:
```bash
# Verify all dependencies
make verify

# Install missing dependencies manually
# Ubuntu/Debian:
sudo apt install build-essential libgtk-3-dev libwebkit2gtk-4.1-dev librsvg2-dev libssl-dev

# Arch:
sudo pacman -S base-devel gtk3 webkit2gtk-4.1 libappindicator-gtk3 librsvg openssl

# Try again
make install
```

### View Crash Reports

```bash
cat ~/.config/xKOR_3RR0R/crash_reports/crash_*.log
```

---

## Development

### Development Mode

```bash
make dev
```

This starts the application with hot-reload enabled.

### Build Production Binary

```bash
make build
```

Output: `src-tauri/target/release/muthur-os-terminal`

### Run Tests

```bash
make test
```

### Clean Build Artifacts

```bash
make clean
```

### All Make Commands

```bash
make help
```

**Available commands:**
- `make install` - Install MUTHUR
- `make upgrade` - Upgrade to latest version
- `make uninstall` - Remove from system
- `make build` - Build production binary
- `make dev` - Run in development mode
- `make clean` - Clean build artifacts
- `make test` - Run test suite
- `make verify` - Verify setup

### Architecture

```
muthur-os-terminal/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Tauri setup & IPC
│   │   ├── pty.rs          # PTY session management
│   │   ├── system.rs       # System monitoring
│   │   ├── ai.rs           # Ollama API client
│   │   └── crash.rs        # Crash reporting
│   └── Cargo.toml
│
├── src/                    # React frontend
│   ├── components/
│   │   ├── Terminal.tsx    # Multi-tab terminal
│   │   ├── FileExplorer.tsx
│   │   ├── AIPanel.tsx
│   │   ├── Globe.tsx       # 3D visualization
│   │   └── ...
│   └── App.tsx
│
├── install.sh              # Installation script
├── upgrade.sh              # Upgrade script
├── uninstall.sh            # Uninstall script
└── Makefile                # Build automation
```

For detailed development documentation, see [DEVELOPMENT.md](DEVELOPMENT.md).

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

**Quick contribution guide:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Follow the [no-emoji policy](NO_EMOJI_POLICY.md)
5. Test thoroughly: `make test`
6. Commit with conventional commits: `feat: add feature`
7. Push and create a pull request

**Coding standards:**
- Rust: Follow `rustfmt` and `clippy` guidelines
- TypeScript: Use Prettier and ESLint
- No emojis in any files (see [NO_EMOJI_POLICY.md](NO_EMOJI_POLICY.md))

---

## Documentation

- [README.md](README.md) - This file
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command quick reference
- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup guide
- [DEVELOPMENT.md](DEVELOPMENT.md) - Developer documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](CHANGELOG.md) - Version history (curated)
- [VERSION_HISTORY.md](VERSION_HISTORY.md) - Complete commit history (auto-generated)
- [NO_EMOJI_POLICY.md](NO_EMOJI_POLICY.md) - Emoji usage policy

---

## Support

**Found a bug?**
- [Report an issue](https://github.com/krko2n/Muthur-os-terminal/issues)

**Have a question?**
- [Start a discussion](https://github.com/krko2n/Muthur-os-terminal/discussions)

**Need help?**
- Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- Read [Troubleshooting](#troubleshooting) section
- Search [existing issues](https://github.com/krko2n/Muthur-os-terminal/issues)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 MUTHUR Development

---

## Acknowledgments

**Inspired by:**
- [eDEX-UI](https://github.com/GitSquared/edex-ui) by GitSquared
- [xKOR_3RR0R](https://github.com/krko2n/xKOR_3RR0R) visual style

**Built with:**
- [Tauri](https://tauri.app/) - Application framework
- [React](https://react.dev/) - UI framework
- [xterm.js](https://xtermjs.org/) - Terminal emulator
- [Three.js](https://threejs.org/) - 3D graphics
- [Ollama](https://ollama.com/) - AI integration

---

<div align="center">

**MUTHUR://CORE**

*Built with love for the Linux community*

[Install](#installation) · [Upgrade](#upgrade) · [Docs](https://github.com/krko2n/Muthur-os-terminal) · [Report Bug](https://github.com/krko2n/Muthur-os-terminal/issues)

</div>
