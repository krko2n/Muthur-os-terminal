# Get Started with MUTHUR OS Terminal

Welcome! This guide will get you from zero to running MUTHUR in under 10 minutes.

---

## Quick Start (Experienced Users)

```bash
git clone https://github.com/yourusername/muthur-os-terminal.git
cd muthur-os-terminal
chmod +x install.sh
./install.sh
muthur
```

Done! Skip to [Usage](#usage) section.

---

## Detailed Installation (First-Time Users)

### Step 1: Check Requirements

**You need:**
- Linux (Arch, Ubuntu, Debian, or Fedora)
- 2 GB RAM minimum (4 GB recommended)
- 500 MB free disk space
- Internet connection

**Check your system:**
```bash
# Check OS
cat /etc/os-release

# Check disk space
df -h ~

# Check memory
free -h
```

### Step 2: Clone the Repository

```bash
# Install git if needed
sudo apt install git  # Ubuntu/Debian
sudo pacman -S git    # Arch
sudo dnf install git  # Fedora

# Clone
git clone https://github.com/yourusername/muthur-os-terminal.git
cd muthur-os-terminal
```

### Step 3: Verify Setup

```bash
# Make scripts executable
chmod +x install.sh verify-setup.sh

# Check what's missing
./verify-setup.sh
```

This will show you what dependencies are missing.

### Step 4: Install

```bash
# Run installer (takes 5-10 minutes)
./install.sh
```

The installer will:
1. Detect your OS
2. Install system dependencies
3. Install Rust (if needed)
4. Install Node.js (if needed)
5. Ask about Ollama (AI features)
6. Build the application
7. Install to `/usr/local/bin/muthur`
8. Create desktop entry

**Answer prompts:**
- "Install Ollama for AI features?" → **Yes** (recommended) or No
- It may ask for your password (sudo)

### Step 5: Launch

```bash
muthur
```

Or find "MUTHUR OS Terminal" in your application menu.

---

## Setting Up AI Features (Optional but Awesome)

If you installed Ollama:

### 1. Start Ollama Service

```bash
ollama serve
```

Leave this running in a separate terminal.

### 2. Download AI Model

```bash
# In another terminal
ollama pull llama3.2
```

This downloads ~2 GB. Takes a few minutes.

### 3. Restart MUTHUR

Close and reopen MUTHUR. The AI panel should now show "AI ONLINE".

### 4. Test AI

In the AI panel (right side), type:
```
#list all Python files
```

AI will suggest `find . -name "*.py"` and auto-execute it!

---

## First Steps in MUTHUR

### 1. Explore the Interface

**Left Panel** (System Stats):
- Real-time CPU and memory usage
- Top processes
- Network statistics

**Center Panel** (Terminal):
- Click "+ NEW" to create tabs
- Type commands like normal
- Use Ctrl+C to copy, right-click to paste

**Right Panel** (Network & AI):
- 3D rotating globe (just for looks)
- AI assistant below

### 2. Try Terminal Features

```bash
# Standard terminal
ls -la
cd ~
echo "Hello MUTHUR"

# Create multiple tabs
# Click "+ NEW" or press Ctrl+Shift+T
```

### 3. Use File Explorer

Bottom section shows your files:
- Click folders to navigate
- Type path and press Enter to jump
- Click "↑ UP" to go to parent directory

### 4. Try AI Assistant

**Command suggestions** (prefix with #):
```
#find large files
#show disk usage
#list running docker containers
```

**General chat**:
```
What is SSH?
How do I install nginx?
Explain git rebase
```

**Error debugging**:
```
User: I got "command not found: docker"
AI: Install Docker: sudo apt install docker.io
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | New terminal tab |
| `Ctrl+Shift+W` | Close current tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+C` | Copy (in terminal) |
| `Ctrl+V` | Paste (in terminal) |
| `Esc` | Exit fullscreen |

---

## Configuration

### Config Directory

```bash
~/.config/xKOR_3RR0R/
├── crash_reports/    # Automatic crash logs
└── logs/            # Application logs
```

### Change AI Model

Edit `src-tauri/src/ai.rs`:
```rust
model: "llama3.2".to_string(),  // Change to: llama3.1, mixtral, etc.
```

Then rebuild:
```bash
npm run tauri build
sudo cp target/release/muthur-os-terminal /usr/local/bin/muthur
```

### Customize Colors

Edit `tailwind.config.js`:
```javascript
colors: {
  'muthur-primary': '#00ff41',   // Change to your color
  'muthur-secondary': '#00d4ff',
  // ...
}
```

Then rebuild:
```bash
npm run build
npm run tauri build
```

---

## Troubleshooting

### Terminal doesn't open

**Problem**: "Session closed" immediately

**Fix**:
```bash
# Check your shell
echo $SHELL

# Should show /bin/bash or /bin/zsh
# If not, install bash:
sudo apt install bash
```

### AI shows "ERROR"

**Problem**: "AI service unavailable"

**Fix**:
```bash
# Check if Ollama is running
curl http://localhost:11434

# If not, start it:
ollama serve
```

### High CPU usage

**Problem**: Fans running loud

**Fix**:
- Close unused terminal tabs
- Check if another app is using CPU: `top`
- Globe uses GPU; if slow, it's normal

### Black screen

**Problem**: Window opens but shows nothing

**Fix**:
```bash
# Update GPU drivers
sudo apt update && sudo apt upgrade

# Check OpenGL
glxinfo | grep "OpenGL version"
```

If OpenGL < 3.0, WebGL globe might not work. Try:
```bash
LIBGL_ALWAYS_SOFTWARE=1 muthur
```

### Build fails

**Problem**: Errors during `./install.sh`

**Fix**:
```bash
# Verify setup
./verify-setup.sh

# Install missing deps manually (Ubuntu example)
sudo apt install build-essential libgtk-3-dev libwebkit2gtk-4.1-dev

# Try again
./install.sh
```

---

## Next Steps

### Learn More
- [README.md](README.md) - Full documentation
- [QUICKSTART.md](QUICKSTART.md) - 5-minute guide
- [DEVELOPMENT.md](DEVELOPMENT.md) - For developers
- [UI_REFERENCE.md](UI_REFERENCE.md) - Visual design guide

### Customize MUTHUR
- Change colors in `tailwind.config.js`
- Add new widgets in `src/components/`
- Modify terminal behavior in `src-tauri/src/pty.rs`

### Contribute
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- Fork on GitHub
- Report bugs or request features

---

## Getting Help

**Found a bug?**
→ [GitHub Issues](https://github.com/yourusername/muthur-os-terminal/issues)

**Have a question?**
→ [GitHub Discussions](https://github.com/yourusername/muthur-os-terminal/discussions)

**Want to chat?**
→ Discord (coming soon)

---

## You're All Set!

MUTHUR is now installed and ready to use. Enjoy your new terminal!

```
     ███╗   ███╗██╗   ██╗████████╗██╗  ██╗██╗   ██╗██████╗ 
     ████╗ ████║██║   ██║╚══██╔══╝██║  ██║██║   ██║██╔══██╗
     ██╔████╔██║██║   ██║   ██║   ███████║██║   ██║██████╔╝
     ██║╚██╔╝██║██║   ██║   ██║   ██╔══██║██║   ██║██╔══██╗
     ██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║╚██████╔╝██║  ██║
     ╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝
```

**Launch it:**
```bash
muthur
```

**Need help?** Open an issue on GitHub.

**Love it?** Star the repo and tell your friends!

---

*Happy hacking!*
