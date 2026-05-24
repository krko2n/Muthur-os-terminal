# MUTHUR OS Terminal - Development Guide

## Architecture Overview

### Technology Stack

**Backend (Rust)**
- **Tauri 2.0**: Window management, IPC
- **portable-pty**: Cross-platform PTY handling
- **sysinfo**: System metrics collection
- **reqwest**: HTTP client for Ollama API
- **tokio**: Async runtime

**Frontend (React 19 + TypeScript)**
- **React 19**: UI framework with concurrent features
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first styling
- **xterm.js**: Terminal emulator
- **Three.js + React Three Fiber**: 3D globe visualization

---

## Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/muthur-os-terminal.git
cd muthur-os-terminal
npm install
```

### 2. Run in Development Mode

```bash
npm run tauri dev
```

This starts:
- Vite dev server on `http://localhost:5173`
- Tauri window with hot-reload
- Rust backend compilation

### 3. Development Workflow

**Frontend changes**: Auto-reload via Vite HMR

**Backend changes**: Requires manual restart:
- Stop dev server (Ctrl+C)
- Run `npm run tauri dev` again

---

## Project Structure

```
muthur-os-terminal/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Tauri setup, command handlers
│   │   ├── pty.rs          # PTY session management
│   │   ├── system.rs       # System monitoring
│   │   ├── ai.rs           # Ollama API client
│   │   └── crash.rs        # Panic handler & crash logging
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri configuration
│   └── build.rs            # Build script
│
├── src/                    # React frontend
│   ├── components/         # React components
│   │   ├── Header.tsx      # Top bar with clock
│   │   ├── LeftPanel.tsx   # System stats sidebar
│   │   ├── CenterPanel.tsx # Main content area
│   │   ├── RightPanel.tsx  # Network & AI sidebar
│   │   ├── Terminal.tsx    # xterm.js integration
│   │   ├── FileExplorer.tsx# Filesystem browser
│   │   ├── Globe.tsx       # 3D WebGL globe
│   │   ├── AIPanel.tsx     # Ollama chat interface
│   │   └── CustomCursor.tsx# Sci-fi cursor effect
│   ├── App.tsx             # Root component
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles + Tailwind
│
├── package.json            # NPM dependencies & scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind theme customization
└── install.sh              # Installation script
```

---

## IPC Communication

### Rust → React (Events)

**PTY Output**:
```rust
// In pty.rs
window_clone.emit(
    &format!("terminal-output-{}", session_id),
    data
);
```

**React listens**:
```typescript
await event.listen(`terminal-output-${sessionId}`, (e) => {
    terminal.write(e.payload);
});
```

### React → Rust (Commands)

**Create terminal session**:
```typescript
const sessionId = await invoke('create_terminal_session');
```

**Write to terminal**:
```typescript
await invoke('write_to_terminal', { sessionId, data });
```

**All Commands**:
- `create_terminal_session() -> String`
- `write_to_terminal(session_id, data)`
- `resize_terminal(session_id, cols, rows)`
- `close_terminal_session(session_id)`
- `get_system_stats() -> SystemStats`
- `list_directory(path) -> Vec<FileEntry>`
- `ai_suggest_command(context, error?) -> String`
- `ai_chat(message) -> String`

---

## Styling Guide

### Color Palette

Defined in `tailwind.config.js`:

```javascript
'muthur-bg': '#000000',        // Background
'muthur-primary': '#00ff41',   // Matrix green
'muthur-secondary': '#00d4ff', // Cyan accent
'muthur-accent': '#ff006e',    // Magenta/pink
'muthur-border': '#0a3622',    // Dark green borders
'muthur-panel': '#0a1612',     // Panel backgrounds
```

### CRT Effects

**Scanline animation**:
```css
.scanline {
    animation: scanline 8s linear infinite;
}
```

**Flicker effect**:
```css
.crt-flicker {
    animation: flicker 0.15s infinite;
}
```

**Text glow**:
```css
.text-glow {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
}
```

---

## Adding New Features

### Example: Add a New Widget

**1. Create Component**:
```typescript
// src/components/NetworkGraph.tsx
export default function NetworkGraph() {
    return (
        <div className="panel">
            <div className="panel-header">NETWORK ACTIVITY</div>
            <div className="p-4">
                {/* Your widget content */}
            </div>
        </div>
    );
}
```

**2. Import in Panel**:
```typescript
// src/components/RightPanel.tsx
import NetworkGraph from './NetworkGraph';

export default function RightPanel() {
    return (
        <div className="w-1/4 flex flex-col gap-2">
            <NetworkGraph />
            {/* other widgets */}
        </div>
    );
}
```

### Example: Add Rust Backend Function

**1. Add Command**:
```rust
// src-tauri/src/main.rs
#[tauri::command]
async fn my_new_command(param: String) -> Result<String, String> {
    Ok(format!("Processed: {}", param))
}
```

**2. Register Handler**:
```rust
.invoke_handler(tauri::generate_handler![
    create_terminal_session,
    // ... existing commands
    my_new_command,  // Add here
])
```

**3. Call from React**:
```typescript
const result = await invoke('my_new_command', { param: 'test' });
```

---

## Testing

### Rust Tests

```bash
cd src-tauri
cargo test
```

### Frontend Tests

```bash
npm test
```

### Integration Tests

```bash
npm run tauri build
# Test the built AppImage/binary
./src-tauri/target/release/muthur-os-terminal
```

---

## Debugging

### Rust Backend

**Enable debug logging**:
```bash
RUST_LOG=debug npm run tauri dev
```

**View crash reports**:
```bash
cat ~/.config/xKOR_3RR0R/crash_reports/crash_*.log
```

### Frontend

**Browser DevTools**:
- Right-click in app → "Inspect Element"
- Or add to `tauri.conf.json`:
```json
"app": {
    "windows": [{
        "devtools": true
    }]
}
```

**Console logging**:
```typescript
console.log('Debug:', data);
```

---

## Building for Distribution

### Development Build

```bash
npm run tauri build
```

Outputs:
- `src-tauri/target/release/muthur-os-terminal` - Binary
- `src-tauri/target/release/bundle/appimage/*.AppImage`
- `src-tauri/target/release/bundle/deb/*.deb`

### Optimized Release Build

```bash
npm run build
cd src-tauri
cargo build --release
```

### Package Sizes

Target sizes:
- Binary: ~15-20 MB
- AppImage: ~25-30 MB
- Deb package: ~20-25 MB

---

## Performance Optimization

### Current Optimizations

1. **Terminal output batching**: 16ms frame budget
2. **System stats throttling**: Updates every 2s
3. **React memo**: Prevents unnecessary rerenders
4. **Cargo release profile**: LTO + size optimization
5. **Lazy component loading**: Globe only renders when visible

### Profiling

**Frontend**:
```bash
# React DevTools Profiler
npm run dev
# Open browser devtools → Profiler tab
```

**Backend**:
```bash
# CPU profiling
cargo install flamegraph
sudo flamegraph -- ./target/release/muthur-os-terminal
```

**Memory**:
```bash
# Valgrind
valgrind --tool=massif ./target/release/muthur-os-terminal
```

---

## Security Considerations

### Current Security Measures

1. **No eval()**: No dynamic code execution
2. **Sandboxed file access**: Rust validates all paths
3. **Controlled IPC**: Only registered commands callable
4. **Crash isolation**: Child processes cleaned on exit

### Future Enhancements

- [ ] Command whitelist/blacklist for AI execution
- [ ] User confirmation before dangerous commands
- [ ] Encrypted credentials storage
- [ ] Audit logging for all filesystem operations

---

## Roadmap

### v0.2.0 (Next Release)
- [ ] Plugin system for custom widgets
- [ ] Themes (light mode, different color schemes)
- [ ] Configurable keybindings
- [ ] Session persistence (save/restore tabs)

### v0.3.0
- [ ] SSH client integration
- [ ] Split panes within tabs
- [ ] Browser panel implementation
- [ ] Custom terminal themes

### v1.0.0
- [ ] Stable API
- [ ] Windows support
- [ ] macOS support
- [ ] Plugin marketplace

---

## Coding Standards

### Rust

- Use `rustfmt`: `cargo fmt`
- Use `clippy`: `cargo clippy`
- Follow Rust API guidelines
- Document public APIs with `///` comments

### TypeScript

- Use Prettier: `npm run format`
- Use ESLint: `npm run lint`
- Prefer functional components
- Use TypeScript strict mode

### Git Commits

Follow conventional commits:
```
feat: add network graph widget
fix: terminal scrollback overflow
docs: update README with AI setup
perf: batch terminal output
refactor: extract system monitor logic
```

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/new-widget`
3. Make changes
4. Test thoroughly
5. Commit with conventional commit message
6. Push and create pull request

---

## Resources

- **Tauri Docs**: https://tauri.app/v2/
- **xterm.js Docs**: https://xtermjs.org/docs/
- **React 19**: https://react.dev/
- **Three.js**: https://threejs.org/docs/
- **Ollama API**: https://github.com/ollama/ollama/blob/main/docs/api.md

---

## Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community chat
- **Discord**: [Coming soon]

---

**Happy coding! Build something awesome with MUTHUR!**
