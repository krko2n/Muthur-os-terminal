# MUTHUR OS Terminal - Quick Reference

## Installation Commands

### Install
```bash
git clone https://github.com/krko2n/Muthur-os-terminal.git
cd muthur-os-terminal
make install
```

### Upgrade
```bash
cd muthur-os-terminal
make upgrade
```

### Uninstall
```bash
cd muthur-os-terminal
make uninstall
```

---

## Usage Commands

### Launch Application
```bash
muthur
```

### Development Mode
```bash
cd muthur-os-terminal
make dev
```

### Build Production
```bash
make build
```

### Run Tests
```bash
make test
```

### Verify Setup
```bash
make verify
```

### Clean Build Files
```bash
make clean
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

## AI Assistant Commands

### Command Suggestions
Type in AI panel:
```
#list all Python files
#find large files
#show disk usage
```

AI will suggest the command and auto-execute it.

### Error Debugging
Paste error messages:
```
command not found: docker
```

AI will provide fix suggestions.

### General Chat
Ask questions normally:
```
What is SSH?
How do I install nginx?
```

---

## File Locations

### Binary
```
/usr/local/bin/muthur
```

### Config Directory
```
~/.config/xKOR_3RR0R/
├── crash_reports/
└── logs/
```

### Desktop Entry
```
~/.local/share/applications/muthur.desktop
```

---

## Ollama Setup (For AI Features)

### Install Ollama
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Download Model
```bash
ollama pull llama3.2
```

### Start Service
```bash
ollama serve
```

Leave this running in a separate terminal, then restart MUTHUR.

---

## Troubleshooting

### Terminal Not Opening
```bash
echo $SHELL
# Should show /bin/bash or /bin/zsh
```

### AI Not Working
```bash
# Check if Ollama is running
curl http://localhost:11434

# If not, start it
ollama serve
```

### High CPU Usage
Close unused terminal tabs.

### Check OpenGL Support
```bash
glxinfo | grep "OpenGL version"
# Should show 3.0 or higher
```

---

## Quick Links

- Repository: https://github.com/krko2n/Muthur-os-terminal
- Issues: https://github.com/krko2n/Muthur-os-terminal/issues
- Full Docs: [README.md](README.md)
- Developer Guide: [DEVELOPMENT.md](DEVELOPMENT.md)

---

## Common Workflows

### First Install
```bash
git clone https://github.com/krko2n/Muthur-os-terminal.git
cd muthur-os-terminal
make install
muthur
```

### Update to Latest
```bash
cd muthur-os-terminal
make upgrade
muthur
```

### Remove from System
```bash
cd muthur-os-terminal
make uninstall
```

### Development
```bash
cd muthur-os-terminal
make dev
# Make changes
make test
make build
```

---

**Last Updated**: 2026-05-24  
**Version**: 0.1.0
