# MUTHUR OS TERMINAL

<div align="center">

![MUTHUR OS Terminal Banner](banner.png)

<p align="center">
  <strong>A cinematic terminal emulator inspired by the MU/TH/UR 6000 computer from Alien (1979)</strong>
</p>

<p align="center">
  <a href="https://github.com/krko2n/Muthur-os-terminal/stargazers">
    <img src="https://img.shields.io/github/stars/krko2n/Muthur-os-terminal?style=for-the-badge&logo=github&labelColor=181717&color=00ff41" alt="GitHub Stars">
  </a>
  <a href="https://github.com/krko2n/Muthur-os-terminal/network/members">
    <img src="https://img.shields.io/github/forks/krko2n/Muthur-os-terminal?style=for-the-badge&logo=github&labelColor=181717&color=00ff41" alt="GitHub Forks">
  </a>
  <a href="https://github.com/krko2n/Muthur-os-terminal/issues">
    <img src="https://img.shields.io/github/issues/krko2n/Muthur-os-terminal?style=for-the-badge&logo=github&labelColor=181717&color=00ff41" alt="GitHub Issues">
  </a>
  <a href="https://github.com/krko2n/Muthur-os-terminal/pulls">
    <img src="https://img.shields.io/github/issues-pr/krko2n/Muthur-os-terminal?style=for-the-badge&logo=github&labelColor=181717&color=00ff41" alt="GitHub Pull Requests">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/krko2n/Muthur-os-terminal?style=for-the-badge&labelColor=181717&color=00ff41" alt="License">
  </a>
</p>

<p align="center">
  <a href="https://github.com/krko2n/Muthur-os-terminal/releases">
    <img src="https://img.shields.io/github/v/release/krko2n/Muthur-os-terminal?style=for-the-badge&logo=github&labelColor=181717&color=00d4ff" alt="Latest Release">
  </a>
  <a href="https://tauri.app/">
    <img src="https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&labelColor=181717" alt="Tauri">
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&labelColor=181717" alt="React">
  </a>
  <a href="https://www.rust-lang.org/">
    <img src="https://img.shields.io/badge/Rust-1.95-orange?style=for-the-badge&logo=rust&labelColor=181717" alt="Rust">
  </a>
</p>

**Current Version: v0.1.1** | [Release Notes](CHANGELOG.md) | [Version History](VERSION_HISTORY.md)

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

### Fully Automatic Install (Recommended)

```bash
git clone https://github.com/krko2n/Muthur-os-terminal.git
cd muthur-os-terminal
make install
```

**Completely automatic - no prompts!**

Installs everything:
1. System dependencies (GTK3, WebKit, OpenSSL, etc.)
2. Rust toolchain (if not present)
3. Node.js 20 via nvm (if not present)
4. Ollama AI engine (automatically)
5. GitHub CLI for error reporting
6. Builds the application (~5-10 minutes)
7. Installs to `/usr/local/bin/muthur`
8. Creates desktop entry
9. Starts Ollama service
10. Downloads AI model in background

**Interactive install (with prompts):**

```bash
make install-interactive
# or
./install.sh
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

**Completely automatic - no prompts!**

What happens:
1. Auto-fetches latest changes from GitHub
2. Auto-pulls updates
3. Auto-installs missing dependencies
4. Auto-rebuilds application
5. Auto-replaces binary
6. Preserves configuration

No `git pull` needed - it does everything automatically!

**That's it!** The upgrade script handles everything:
- Checks for updates
- Pulls latest code automatically
- Installs missing dependencies
- Rebuilds and reinstalls

No manual steps required!

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
- ✓ Full xterm.js terminal emulator
- ✓ Multiple sessions in tabs
- ✓ 256 color support
- ✓ Clickable links
- ✓ 10,000 line scrollback buffer

**Real-Time System Monitoring**
- ✓ CPU usage with live graphs
- ✓ Memory statistics
- ✓ Top processes by CPU usage
- ✓ Network RX/TX statistics
- ✓ Disk usage information

**AI Assistant (Ollama Integration)**
- ✓ Command suggestions with `#` prefix
- ✓ Automatic command execution
- ✓ Error debugging and fixes
- ✓ General Q&A assistance

**File System Explorer**
- ✓ Full filesystem access
- ✓ Directory navigation
- ✓ File metadata display
- ✓ Quick path jumping

**3D Network Visualization**
- ✓ WebGL-powered rotating globe
- ✓ Real-time connection status
- ✓ Low-latency rendering

### Visual Design

- ✓ Fullscreen borderless window
- ✓ Custom cursor with glow effect
- ✓ CRT scanline effects
- ✓ Matrix green color scheme (`#00ff41`)
- ✓ Retro-futuristic sci-fi aesthetic
- ✓ Smooth animations

### Performance

- ✓ **Idle CPU**: Less than 10%
- ✓ **Memory**: ~150 MB
- ✓ **Startup**: 1-2 seconds
- ✓ **Binary size**: ~18 MB

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
# Install Ollama (secure method)
curl -fsSL https://ollama.com/install.sh -o ollama_install.sh
# IMPORTANT: Review the script before running
cat ollama_install.sh
# If satisfied, run it
sh ollama_install.sh

# Download AI model
ollama pull llama3.2

# Start Ollama service
ollama serve
```

Keep `ollama serve` running in a separate terminal, then restart MUTHUR.

**Security Note**: Always inspect installation scripts before executing them.

### Change AI Model

Set the `MUTHUR_AI_MODEL` environment variable:

```bash
# Temporary (current session only)
export MUTHUR_AI_MODEL=llama3.1
muthur

# Permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export MUTHUR_AI_MODEL=llama3.1' >> ~/.bashrc
```

Available models: `llama3.2` (default), `llama3.1`, `mixtral`, `codellama`, etc.

Alternatively, create a config file at `~/.config/muthur/config.toml`:

```toml
[ai]
model = "llama3.1"
base_url = "http://localhost:11434"
```

See `examples/config.toml.example` for a complete configuration template with all available options.

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

### Report Errors Automatically

```bash
# After an installation error
./report-error.sh install

# After a build error
./report-error.sh build

# After a crash
./report-error.sh runtime ~/.config/xKOR_3RR0R/crash_reports/crash_*.log
```

This automatically creates a GitHub issue with:
- Your system information
- Error log
- Version information

Requires [GitHub CLI](https://cli.github.com/) installed and authenticated.

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
- [SECURITY.md](SECURITY.md) - Security policy and best practices
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
