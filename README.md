# Pick a banner - My top 12 from 100 variants

> Layout 2 confirmed. Just tell me the number below and I finalize the README.
> All 100 variants are in `banners/variants/` if you want to browse them all.

---

### 1 - Matrix Green (original, solid)

<img src="banners/variants/v01.svg" width="100%">

---

### 11 - Green to Cyan gradient

<img src="banners/variants/v11.svg" width="100%">

---

### 13 - Green to Aqua gradient

<img src="banners/variants/v13.svg" width="100%">

---

### 16 - Cyan to Green (reversed)

<img src="banners/variants/v16.svg" width="100%">

---

### 20 - Cyan to Purple gradient

<img src="banners/variants/v20.svg" width="100%">

---

### 27 - Deep Purple to Electric Cyan

<img src="banners/variants/v27.svg" width="100%">

---

### 40 - Hot Pink to Cyan (cyberpunk)

<img src="banners/variants/v40.svg" width="100%">

---

### 81 - Magenta to Cyan (neon cyberpunk)

<img src="banners/variants/v81.svg" width="100%">

---

### 84 - Coral Pink to Sky Blue

<img src="banners/variants/v84.svg" width="100%">

---

### 85 - Purple to Cyan (electric)

<img src="banners/variants/v85.svg" width="100%">

---

### 88 - Mint Green to Matrix Green

<img src="banners/variants/v88.svg" width="100%">

---

### 99 - Deep Orange to Neon Purple (sunset)

<img src="banners/variants/v99.svg" width="100%">

---
---

---

## What is MUTHUR?

MUTHUR is a desktop terminal application that wraps a fully functional Linux shell inside a science-fiction cockpit interface. It is not a theme or a skin -- it is a standalone native application built from the ground up with Tauri v2 and Rust.

Think of it as a spiritual successor to [eDEX-UI](https://github.com/GitSquared/edex-ui), rebuilt for 2026 with a modern stack:

| | eDEX-UI | MUTHUR |
|---|---|---|
| Framework | Electron | Tauri v2 (Rust) |
| Binary size | ~200 MB | ~18 MB |
| Idle CPU | 20-40% | <10% |
| RAM | 400+ MB | ~150 MB |
| AI | None | Ollama (local LLM) |
| Terminal tabs | No | Yes |
| Status | Archived | Active |

---

## Features

### Terminal Emulator
- Full xterm.js terminal with PTY integration
- Multiple tabs (`Ctrl+Shift+T` to open, `Ctrl+Shift+W` to close)
- 256-color support, clickable links, 10,000-line scrollback
- Sub-10ms input latency

### System Monitoring
- Live CPU usage graphs
- Memory and swap statistics
- Top processes by resource consumption
- Network RX/TX throughput
- Disk usage breakdown

### AI Assistant (Ollama)
- Prefix any prompt with `#` to get a shell command suggestion
- AI auto-executes safe commands in the terminal
- Debugs errors and explains fixes
- General Q&A for system administration
- Fully local -- no data leaves your machine

### 3D Network Globe
- WebGL-rendered rotating Earth via Three.js
- Real-time connection status visualization

### Visual Design
- Fullscreen borderless window with CRT scanline overlay
- Matrix green (`#00ff41`) color scheme
- Custom animated cursor with glow effect
- Retro-futuristic panel layout

---

## Installation

### Requirements

| Requirement | Details |
|---|---|
| OS | Linux (Arch, Ubuntu/Debian, Fedora) |
| RAM | 2 GB minimum, 4 GB recommended |
| Storage | 500 MB free |
| GPU | OpenGL 3.0+ |

### One-Command Install

```bash
git clone https://github.com/krko2n/Muthur-os-terminal.git
cd muthur-os-terminal
make install
```

This handles everything automatically: system dependencies, Rust, Node.js, Ollama, building, and desktop entry creation. Takes 5-10 minutes on first run.

For an interactive installer with prompts:

```bash
make install-interactive
```

### Launch

```bash
muthur
```

Or search for **MUTHUR OS Terminal** in your application menu.

---

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+T` | New tab |
| `Ctrl+Shift+W` | Close tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+C` | Copy selection |
| `Ctrl+V` | Paste |
| `Esc` | Exit fullscreen |

### AI Commands

Type in the AI panel:

```
#find all files larger than 100MB       -> generates and runs: find / -size +100M
#show listening ports                   -> generates and runs: ss -tlnp
#disk usage by directory                -> generates and runs: du -sh /* 2>/dev/null | sort -rh
What is a symlink?                      -> explains the concept
```

Commands prefixed with `#` are interpreted as requests for shell commands. Everything else is treated as a question.

---

## Configuration

### AI Model

Priority order:
1. `MUTHUR_AI_MODEL` environment variable
2. `~/.config/muthur/config.toml`
3. Default: `llama3.2`

```bash
# Use a different model
export MUTHUR_AI_MODEL=mixtral
muthur
```

Or create `~/.config/muthur/config.toml`:

```toml
[ai]
model = "llama3.1"
base_url = "http://localhost:11434"
```

See [`examples/config.toml.example`](examples/config.toml.example) for all options.

### Colors

Edit `tailwind.config.js` and rebuild with `make build`:

```javascript
colors: {
  'muthur-primary': '#00ff41',
  'muthur-secondary': '#00d4ff',
  'muthur-accent': '#ff006e',
}
```

---

## Upgrade / Uninstall

```bash
make upgrade     # pulls latest, rebuilds, reinstalls -- fully automatic
make uninstall   # removes binary, desktop entry, optionally config
```

---

## Development

```bash
make dev         # hot-reload development server
make build       # production binary
make test        # run tests
make clean       # remove build artifacts
make verify      # check dependencies
```

### Architecture

```
src-tauri/src/          Rust backend
  main.rs               Tauri bootstrap and IPC commands
  pty.rs                PTY session lifecycle
  system.rs             System metrics collection
  ai.rs                 Ollama HTTP client
  crash.rs              Crash report handler

src/components/         React frontend
  Terminal.tsx           Multi-tab xterm.js wrapper
  AIPanel.tsx           AI chat interface
  FileExplorer.tsx      Filesystem browser
  Globe.tsx             Three.js network globe
  Header.tsx            Top status bar
  LeftPanel.tsx         System monitoring
  RightPanel.tsx        File explorer container
  CenterPanel.tsx       Terminal container
  CustomCursor.tsx      Animated cursor overlay
```

Communication between frontend and backend uses Tauri's IPC invoke/emit pattern over a secure bridge -- no localhost HTTP server exposed.

---

## Performance

| Metric | Value |
|---|---|
| Startup | 1-2 seconds |
| Idle CPU | <10% |
| RAM | ~150 MB |
| Binary | ~18 MB |
| Input latency | <10ms |

Optimizations: terminal output batched at 60fps, system stats polled at 2s intervals, React components memoized, Rust binary compiled with LTO and size optimization.

---

## Troubleshooting

<details>
<summary><strong>Terminal shows "Session closed" immediately</strong></summary>

```bash
echo $SHELL
# If empty, install a shell:
sudo apt install bash    # Debian/Ubuntu
sudo pacman -S bash      # Arch
```
</details>

<details>
<summary><strong>AI panel shows "ERROR" or "unavailable"</strong></summary>

```bash
# Start Ollama if not running
ollama serve
# Verify it responds
curl http://localhost:11434
```
</details>

<details>
<summary><strong>Black screen or graphics glitches</strong></summary>

```bash
# Check OpenGL version (need 3.0+)
glxinfo | grep "OpenGL version"
# Force software rendering as fallback
LIBGL_ALWAYS_SOFTWARE=1 muthur
```
</details>

<details>
<summary><strong>Build failures</strong></summary>

```bash
# Install missing system libraries
# Ubuntu/Debian:
sudo apt install build-essential libgtk-3-dev libwebkit2gtk-4.1-dev librsvg2-dev libssl-dev
# Arch:
sudo pacman -S base-devel gtk3 webkit2gtk-4.1 libappindicator-gtk3 librsvg openssl

make verify   # check what's missing
make install  # retry
```
</details>

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

```bash
git clone https://github.com/krko2n/Muthur-os-terminal.git
cd muthur-os-terminal
npm install
make dev
```

Conventions:
- Conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- No emojis in code, commits, or documentation
- Rust: `rustfmt` + `clippy`
- TypeScript: Prettier + ESLint

---

## Roadmap

- **v0.2.0** -- Plugin system, themes, session persistence, configurable keybindings
- **v0.3.0** -- SSH client, split panes, browser panel
- **v1.0.0** -- Stable API, Windows/macOS support, plugin marketplace

---

## Acknowledgments

**Inspired by**: [eDEX-UI](https://github.com/GitSquared/edex-ui) by GitSquared

**Built with**: [Tauri](https://tauri.app/) | [React](https://react.dev/) | [xterm.js](https://xtermjs.org/) | [Three.js](https://threejs.org/) | [Ollama](https://ollama.com/)

---

## License

MIT -- see [LICENSE](LICENSE).

---

<div align="center">

**INTERFACE 2037 READY**

[Report Bug](https://github.com/krko2n/Muthur-os-terminal/issues) | [Request Feature](https://github.com/krko2n/Muthur-os-terminal/issues) | [Discussions](https://github.com/krko2n/Muthur-os-terminal/discussions)

</div>
