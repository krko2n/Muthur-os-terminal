# MUTHUR OS TERMINAL

<div align="center">

**Advanced Terminal Interface with AI Integration**

*Inspired by eDEX-UI with modern architecture*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)

</div>

---

## Features

- **Multi-Tab Terminal**: Full-featured terminal emulator with multiple session support
- **Real-Time System Monitoring**: CPU, memory, network, and process tracking
- **AI Assistant Integration**: Command suggestions and error debugging via Ollama
- **File System Explorer**: Browse and navigate your entire filesystem
- **3D Network Visualization**: WebGL-powered rotating globe with real-time data
- **Sci-Fi CRT Aesthetic**: Custom cursor, scanline effects, and retro-futuristic UI
- **Low Resource Usage**: Optimized for laptops with <10% idle CPU usage
- **Modular Architecture**: Clean separation of concerns, easy to extend

---

## System Requirements

### Minimum
- **OS**: Linux (Arch, Ubuntu, Debian, Fedora)
- **CPU**: Dual-core 2.0 GHz
- **RAM**: 2 GB
- **GPU**: Integrated graphics with OpenGL 3.0+
- **Storage**: 500 MB free space

### Recommended
- **OS**: Arch Linux or Ubuntu 22.04+
- **CPU**: Quad-core 2.5 GHz
- **RAM**: 4 GB
- **GPU**: Dedicated GPU with OpenGL 4.0+
- **Storage**: 1 GB free space

---

## Installation

### Automated Installation (Recommended)

```bash
git clone https://github.com/yourusername/muthur-os-terminal.git
cd muthur-os-terminal
chmod +x install.sh
./install.sh
```

The installer will:
1. Detect your Linux distribution
2. Install system dependencies
3. Install Rust and Node.js (if needed)
4. Optionally install Ollama for AI features
5. Build and install the application

### Manual Installation

#### 1. Install Dependencies

**Arch Linux:**
```bash
sudo pacman -Sy base-devel curl wget file openssl gtk3 webkit2gtk librsvg
```

**Ubuntu/Debian:**
```bash
sudo apt install build-essential curl wget file libssl-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev
```

**Fedora:**
```bash
sudo dnf install gcc gcc-c++ make curl wget file openssl-devel gtk3-devel \
  libappindicator-gtk3-devel librsvg2-devel webkit2gtk4.1-devel
```

#### 2. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

#### 3. Install Node.js

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 20
nvm use 20
```

#### 4. Build the Application

```bash
npm install
npm run tauri build
```

#### 5. Install

```bash
# Copy binary
sudo cp src-tauri/target/release/muthur-os-terminal /usr/local/bin/muthur
sudo chmod +x /usr/local/bin/muthur

# Create config directory
mkdir -p ~/.config/xKOR_3RR0R/{crash_reports,logs}
```

---

## AI Assistant Setup (Optional)

MUTHUR includes AI-powered command suggestions and error debugging via Ollama.

### Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Download AI Model

```bash
ollama pull llama3.2
```

### Start Ollama Service

```bash
ollama serve
```

### Usage in MUTHUR

- Type `#<context>` in the AI panel for command suggestions
- AI will automatically execute suggested commands
- Chat normally for general assistance

---

## Usage

### Launch

```bash
muthur
```

Or find "MUTHUR OS Terminal" in your application menu.

### Keyboard Shortcuts

- **Ctrl+Shift+T**: New terminal tab
- **Ctrl+Shift+W**: Close current tab
- **Ctrl+Tab**: Next tab
- **Ctrl+Shift+Tab**: Previous tab
- **Ctrl+C**: Copy (in terminal)
- **Ctrl+V**: Paste (in terminal)
- **Esc**: Exit fullscreen

### Terminal Features

- Full xterm.js compatibility
- 256 color support
- Mouse support
- Clickable links
- Scrollback buffer (10,000 lines)

---

## Architecture

```
muthur-os-terminal/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs     # Entry point & Tauri commands
│   │   ├── pty.rs      # PTY manager (portable-pty)
│   │   ├── system.rs   # System monitoring (sysinfo)
│   │   ├── ai.rs       # Ollama client
│   │   └── crash.rs    # Crash reporter
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                # React frontend
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── LeftPanel.tsx
│   │   ├── CenterPanel.tsx
│   │   ├── RightPanel.tsx
│   │   ├── Terminal.tsx
│   │   ├── FileExplorer.tsx
│   │   ├── Globe.tsx
│   │   ├── AIPanel.tsx
│   │   └── CustomCursor.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── install.sh
└── README.md
```

---

## Development

### Run in Development Mode

```bash
npm install
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

### Run Tests

```bash
# Frontend tests
npm test

# Backend tests
cd src-tauri && cargo test
```

---

## Troubleshooting

### Terminal Not Opening

- Check if PTY is supported: `ls -la /dev/pts/`
- Verify shell exists: `echo $SHELL`

### AI Assistant Not Working

- Ensure Ollama is running: `systemctl status ollama` or `ollama serve`
- Check model is downloaded: `ollama list`
- Verify localhost connection: `curl http://localhost:11434`

### Graphics Issues

- Update GPU drivers
- Check OpenGL support: `glxinfo | grep "OpenGL version"`
- Try disabling WebGL: Set `LIBGL_ALWAYS_SOFTWARE=1`

### Crash Reports

All crash reports are saved to: `~/.config/xKOR_3RR0R/crash_reports/`

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) file

---

## Acknowledgments

- Inspired by [eDEX-UI](https://github.com/GitSquared/edex-ui)
- Visual style influenced by xKOR_3RR0R
- Built with [Tauri](https://tauri.app/), [React](https://react.dev/), and [xterm.js](https://xtermjs.org/)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/muthur-os-terminal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/muthur-os-terminal/discussions)

---

<div align="center">

**MUTHUR://CORE - Advanced Terminal Interface**

*Built with love for the Linux community*

</div>
