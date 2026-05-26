# MUTHUR OS Terminal - Production Architecture

**Version**: 2.0  
**Date**: 2026-05-26  
**Status**: Production Redesign  
**Target**: Immersive Linux Shell Session (Arch Linux Primary)

---

## EXECUTIVE SUMMARY

MUTHUR OS Terminal is transforming from a desktop application into a **production-grade immersive Linux shell session** - a custom fullscreen environment running on top of Arch Linux, similar to SteamOS Big Picture, eDEX-UI, or kiosk systems.

**What This Is**:
- Custom shell/session layer on top of Linux
- Fullscreen immersive terminal workspace
- Bootable session environment
- Futuristic UI with AI integration

**What This Is NOT**:
- A Linux kernel replacement
- A desktop environment rewrite from scratch
- A graphics stack replacement
- A traditional desktop application

---

## ARCHITECTURE OVERVIEW

### Current State (v0.1.x)

```
User Desktop
└── MUTHUR (Tauri app, windowed)
    ├── Terminal (xterm.js)
    ├── File Explorer
    ├── System Monitor
    ├── AI Assistant (Ollama)
    └── 3D Background (Three.js)
```

**Limitations**:
- Runs as normal windowed app
- No session integration
- Manual startup required
- No crash recovery
- Not immersive

---

### Target Architecture (v1.0+)

```
┌─────────────────────────────────────────────────────────┐
│                    Arch Linux Base                       │
│  (kernel, systemd, Mesa, GPU drivers)                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Login Manager (greetd/SDDM)                │
│  - Custom MUTHUR session available                      │
│  - Optional autologin                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│          Kiosk Compositor (Cage/Gamescope)              │
│  - Launches MUTHUR fullscreen                           │
│  - Handles GPU/DRM/KMS                                  │
│  - Provides Wayland protocol                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              MUTHUR Tauri Application                   │
│  - Fullscreen immersive UI                              │
│  - Terminal sessions (PTY)                              │
│  - File explorer                                        │
│  - System monitor                                       │
│  - AI assistant (Ollama)                                │
│  - 3D background (WebGL)                                │
│  - Custom cursor                                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         systemd Watchdog Service (optional)             │
│  - Auto-restart on crash                                │
│  - Health monitoring                                    │
│  - Graceful fallback to TTY                             │
└─────────────────────────────────────────────────────────┘
```

---

## SESSION INTEGRATION STRATEGY

### Phase 1: Standalone Mode (Current - v0.1.x)
**Status**: Complete  
**Usage**: Run manually as desktop app

```bash
./muthur-os-terminal
# or
./muthur-os-terminal.AppImage
```

---

### Phase 2: Autostart Mode (v0.2.x) - NEXT PRIORITY
**Status**: Planned  
**Usage**: Auto-launch on desktop login

**Implementation**:
1. Install `.desktop` file to `~/.config/autostart/`
2. Launch fullscreen on startup
3. Optional: hide window decorations
4. User can still access normal desktop (Alt+Tab)

**Files**:
- `muthur-autostart.desktop`
- Update Arch PKGBUILD to install autostart file

---

### Phase 3: Custom Session Mode (v0.3.x) - MEDIUM TERM
**Status**: Planned  
**Usage**: Login directly into MUTHUR session

**Implementation**:
1. Wayland session file: `/usr/share/wayland-sessions/muthur.desktop`
2. Session script launches Cage + MUTHUR
3. Display manager shows "MUTHUR OS" as login option
4. No desktop environment loaded (lightweight)

**Files**:
- `/usr/share/wayland-sessions/muthur.desktop`
- `/usr/bin/muthur-session` (wrapper script)
- Arch PKGBUILD updated

**Session Flow**:
```
User selects MUTHUR OS at login
→ Display manager launches muthur-session script
→ Script starts Cage compositor
→ Cage launches MUTHUR fullscreen
→ User sees immersive UI immediately
```

---

### Phase 4: Production Kiosk Mode (v1.0+) - LONG TERM
**Status**: Future  
**Usage**: Production-ready immersive session with recovery

**Implementation**:
1. All Phase 3 features
2. systemd watchdog service
3. Crash recovery and auto-restart
4. Optional autologin
5. Optional disable TTY switching
6. Custom splash screen
7. Performance optimizations

**Files**:
- `/usr/lib/systemd/user/muthur-watchdog.service`
- `/usr/lib/systemd/user/muthur-watchdog.timer`
- `/etc/muthur/kiosk.conf`
- Improved PKGBUILD with post-install scripts

**Session Flow**:
```
Boot
→ systemd reaches graphical.target
→ greetd/SDDM autologs into MUTHUR session
→ muthur-session script starts
→ Cage compositor launches
→ MUTHUR Tauri app starts fullscreen
→ systemd watchdog monitors health
→ If crash: auto-restart (max 5 attempts)
→ If repeated crash: fallback to TTY
```

---

## COMPOSITOR SELECTION

### Recommended: Cage (Primary)

**Why Cage**:
- Purpose-built for kiosk/fullscreen apps
- Minimal configuration (zero config needed)
- Lightweight (~50 KB binary)
- Built on wlroots (stable Wayland base)
- Auto-maximizes applications
- Sub-200ms startup time
- Production-tested in kiosk deployments

**Usage**:
```bash
cage -- muthur-os-terminal
```

**Integration**:
```bash
# /usr/bin/muthur-session
#!/bin/bash
exec cage -- /usr/bin/muthur-os-terminal
```

---

### Alternative: Gamescope (Advanced)

**Why Gamescope**:
- Valve's Steam Deck compositor
- Best-in-class fullscreen performance
- DRM/KMS direct rendering (lowest latency)
- FSR upscaling support
- Nested compositor isolation
- Battle-tested in SteamOS

**When to Use**:
- High-performance mode
- Gaming-style experience
- Multi-monitor setups
- Resolution virtualization needed

**Usage**:
```bash
gamescope -f -W 1920 -H 1080 -- muthur-os-terminal
```

---

### Fallback: Sway/Hyprland (Power Users)

**For users who want**:
- Full desktop environment functionality
- Tiling window manager
- Keyboard-driven workflow
- More control

**Implementation**:
```bash
# ~/.config/hypr/hyprland.conf
exec-once = muthur-os-terminal
windowrule = fullscreen, muthur-os-terminal
```

---

## CRASH RECOVERY ARCHITECTURE

### systemd Watchdog Service

**Purpose**: Auto-restart MUTHUR if it crashes

**Service File**: `/usr/lib/systemd/user/muthur-watchdog.service`

```ini
[Unit]
Description=MUTHUR OS Terminal Watchdog
After=graphical-session.target
Wants=graphical-session.target

[Service]
Type=notify
ExecStart=/usr/bin/muthur-os-terminal --watchdog
Restart=on-failure
RestartSec=3s
StartLimitBurst=5
StartLimitIntervalSec=300
WatchdogSec=30s
NotifyAccess=main

[Install]
WantedBy=default.target
```

**Features**:
- Restarts on crash (max 5 times in 5 minutes)
- Health monitoring every 30 seconds
- Graceful fallback after repeated failures
- Logs crashes for debugging

**Implementation in Rust**:
```rust
// src-tauri/src/watchdog.rs
use std::time::Duration;

pub fn init_watchdog() {
    #[cfg(target_os = "linux")]
    {
        // Send sd_notify READY=1
        systemd::daemon::notify(false, [(systemd::daemon::STATE_READY, "1")].iter()).ok();
        
        // Start health check thread
        std::thread::spawn(|| {
            loop {
                std::thread::sleep(Duration::from_secs(15));
                // Send WATCHDOG=1
                systemd::daemon::notify(false, [(systemd::daemon::STATE_WATCHDOG, "1")].iter()).ok();
            }
        });
    }
}
```

---

## GPU ACCELERATION

### Current Status

**Stack**:
- Tauri v2 → WebKitGTK 4.1
- WebKitGTK → OpenGL ES 2.0
- Mesa → GPU drivers (RADV/ANV/NVK)
- Three.js → WebGL rendering

**Known Issues**:
- WebGL context loss on some configs (upstream WebKit bug #6559)
- Nvidia proprietary driver may need GBM backend
- AMD/Intel have best open-source support

---

### Optimization Strategy

**1. Compositor-Level**:
- Use DRM/KMS direct rendering (Cage supports this)
- Avoid nested compositing where possible
- Enable Wayland native buffer sharing

**2. WebKitGTK Level**:
- Ensure Mesa 21.2+ installed
- Enable GPU process separation
- Use DMA-BUF for buffer sharing

**3. Application Level**:
- Optimize Three.js scene (reduce polygons)
- Use requestAnimationFrame properly
- Debounce system stats updates
- Lazy-load heavy components

**4. System Level**:
- Use latest Mesa drivers
- Enable GPU acceleration in kernel
- Add user to `video` group
- Verify `/dev/dri/card0` permissions

---

## ARCH LINUX PACKAGING

### PKGBUILD Structure

**Package Name**: `muthur-os-terminal`  
**AUR Name**: `muthur-os-terminal-bin` (for binary releases)

**Dependencies**:
```bash
depends=(
  'webkit2gtk-4.1'    # Tauri webview
  'cage'              # Kiosk compositor
  'mesa'              # GPU drivers
  'systemd'           # Service management
)

optdepends=(
  'ollama: AI assistant integration'
  'gamescope: Advanced compositor option'
  'greetd: Minimal login manager'
  'sway: Alternative compositor'
  'hyprland: Modern Wayland compositor'
)
```

**Installation Locations**:
```
/usr/bin/muthur-os-terminal          # Main binary
/usr/share/applications/muthur.desktop   # Desktop entry
/usr/share/wayland-sessions/muthur.desktop  # Session file (optional)
/usr/lib/systemd/user/muthur-watchdog.service  # Watchdog (optional)
/usr/share/muthur/                   # Assets
/etc/muthur/config.toml.example      # Config template
```

---

### Installation Modes

**Mode 1: Desktop App Only** (Default)
```bash
pacman -S muthur-os-terminal
muthur-os-terminal  # Run manually
```

**Mode 2: Autostart** (Optional)
```bash
pacman -S muthur-os-terminal
systemctl --user enable muthur-autostart.service
# Launches on desktop login
```

**Mode 3: Custom Session** (Advanced)
```bash
pacman -S muthur-os-terminal
# Select "MUTHUR OS" at login screen
```

**Mode 4: Kiosk Mode** (Production)
```bash
pacman -S muthur-os-terminal
systemctl --user enable muthur-watchdog.service
# Configure autologin in greetd/SDDM
```

---

## RELEASE STRATEGY

### Primary Distribution: AppImage

**Why AppImage**:
- Universal Linux compatibility
- Portable (download and run)
- No installation required
- Bundles all dependencies
- Perfect for testing before installing

**User Experience**:
```bash
wget https://github.com/krko2n/Muthur-os-terminal/releases/download/v1.0.0/muthur-os-terminal_1.0.0_amd64.AppImage
chmod +x muthur-os-terminal_*.AppImage
./muthur-os-terminal_*.AppImage
```

**Limitations**:
- Large file size (~70 MB)
- No session integration (runs as desktop app)
- No auto-updates

---

### Secondary Distribution: Arch Package

**Why Arch Package**:
- Native integration for target audience
- Session file installation
- systemd service installation
- Auto-updates via pacman
- AUR community support

**User Experience**:
```bash
# From AUR
yay -S muthur-os-terminal-bin

# Run
muthur-os-terminal

# Or select at login
# (if session file installed)
```

**Advantages**:
- Proper system integration
- Session management
- Dependency handling
- Post-install scripts

---

### Tertiary Distribution: Deb Package

**Why Deb**:
- Ubuntu/Debian user base
- Package manager integration

**Limitations**:
- Less relevant for Arch-focused project
- Different systemd paths
- Different login manager configs

**Status**: Keep building, but deprioritize docs

---

### Future Distribution: ISO (Long Term)

**Why ISO**:
- Ultimate immersive experience
- Boot directly into MUTHUR
- Pre-configured session
- Demo/showcase distribution

**Implementation**:
- Base: Arch Linux
- Include: MUTHUR + Cage + greetd
- Configure: Autologin to MUTHUR session
- Optimize: Fast boot, minimal services

**Use Cases**:
- Live USB demos
- Dedicated kiosk hardware
- Cyberdeck installations
- Conference/showcase displays

**Status**: v2.0+ (after session mode stable)

---

## STARTUP PERFORMANCE

### Current Boot Time

**From Application Launch**:
- Tauri init: ~500ms
- WebKitGTK init: ~300ms
- Three.js scene: ~200ms
- Total: ~1 second

---

### Optimizations (Phase 2+)

**1. Frontend**:
- Code-split heavy components
- Lazy-load AI panel
- Optimize Three.js scene
- Minimize JS bundle
- Use production builds

**2. Backend**:
- Preload PTY manager
- Cache system stats
- Lazy-init Ollama client
- Use jemalloc allocator
- Profile with perf/flamegraph

**3. Compositor**:
- Use Cage (fastest startup)
- Preload DRM/KMS
- Optimize kernel modules

**4. systemd**:
- Parallel service startup
- Disable unnecessary services
- Use Type=notify for proper sequencing
- Profile with systemd-analyze

**Target**: <500ms from compositor to visible UI

---

## STABILITY & RECOVERY

### Crash Scenarios

**1. Application Crash**
- systemd restarts service (3s delay)
- Max 5 restarts in 5 minutes
- After limit: fallback to TTY

**2. Compositor Crash**
- Session terminates
- User returns to login screen
- systemd logs crash

**3. GPU Hang**
- Kernel driver recovers (DRM/KMS)
- Application may need restart
- Watchdog detects hang via timeout

**4. Out of Memory**
- OOM killer targets MUTHUR first (by design)
- systemd restarts service
- Consider adding MemoryMax= limit

---

### Debug Access

**TTY Access**:
```
Ctrl+Alt+F2  # Switch to TTY2
Ctrl+Alt+F3  # Switch to TTY3
Ctrl+Alt+F1  # Return to graphical (if alive)
```

**SSH Access**:
- Keep sshd enabled
- Access via network if GUI fails

**Emergency Mode**:
```bash
# At boot: add to kernel params
systemd.unit=multi-user.target

# Or
systemd.unit=rescue.target
```

---

## SECURITY CONSIDERATIONS

### Kiosk Mode Lockdown (Optional)

**For production kiosk deployments**:

1. Disable TTY switching:
```bash
# /etc/systemd/logind.conf
HandlePowerKey=ignore
NAutoVTs=1
ReserveVT=1
```

2. Disable Alt+Tab escape:
```bash
# Cage handles this automatically
# No window switching in single-app mode
```

3. Remove exit keys:
```rust
// Disable Ctrl+Q, Alt+F4 in Tauri
window.set_closable(false);
```

4. Auto-login:
```bash
# /etc/greetd/config.toml
[default_session]
command = "cage -- /usr/bin/muthur-os-terminal"
user = "muthur"
```

**WARNING**: Only for dedicated kiosk hardware. User needs emergency access method (SSH, physical access).

---

### Normal Session Mode (Recommended)

**Keep user in control**:
- Alt+Tab works (if using Sway/Hyprland)
- Ctrl+Alt+F2 for TTY access
- Standard Linux security model
- User can exit to desktop

---

## CONFIGURATION SYSTEM

### Current Config

**Location**: `~/.config/muthur/config.toml`

**Settings**:
```toml
[ai]
model = "llama3.2"
endpoint = "http://localhost:11434"

[terminal]
shell = "/bin/bash"
font_size = 14

[ui]
theme = "matrix-green"
enable_crt_effect = true
enable_scanlines = true
```

---

### Session Config (Future)

**Location**: `/etc/muthur/session.conf`

**Settings**:
```ini
[Compositor]
Backend=cage
# Options: cage, gamescope, sway, hyprland

[Kiosk]
Enabled=false
DisableTTY=false
DisableEscape=false

[Watchdog]
Enabled=true
RestartDelay=3
MaxRestarts=5

[Performance]
GPUAcceleration=true
VSync=true
```

---

## WAYLAND VS X11

### Wayland (Primary Target)

**Advantages**:
- Modern protocol
- Better security model
- Native buffer sharing (DMA-BUF)
- Lower latency
- Better GPU acceleration
- Required for Cage/Gamescope

**Status**: Primary target, works with Tauri v2

---

### X11 (Compatibility)

**Advantages**:
- Wider hardware support
- Older GPU compatibility
- Some older apps require X11

**Implementation**:
- XWayland for compatibility
- Fallback compositor: openbox-session

**Status**: Supported but not prioritized

---

## MULTI-MONITOR SUPPORT

### Current Status

**Single Monitor**: Fully supported (fullscreen)

**Multi-Monitor**: Planned for v1.0+

---

### Implementation Strategy

**Option 1: Primary Monitor Only** (Simple)
- MUTHUR runs on primary monitor
- Other monitors show desktop or blank

**Option 2: Span All Monitors** (Complex)
- Single window spans all monitors
- UI adapts to combined resolution
- Requires compositor support

**Option 3: Multi-Window** (Future)
- Separate panels on different monitors
- Requires significant UI refactor

**Recommended**: Option 1 for v1.0

---

## TESTING STRATEGY

### Testing Environments

**1. Desktop Mode** (Easy)
```bash
./muthur-os-terminal  # Run as normal app
```

**2. Nested Compositor** (Safe)
```bash
cage -- ./muthur-os-terminal  # Test in nested window
gamescope -- ./muthur-os-terminal
```

**3. TTY Mode** (Real)
```bash
# Switch to TTY2 (Ctrl+Alt+F2)
cage -- ./muthur-os-terminal  # Run on real TTY
```

**4. Session Mode** (Production)
```bash
# Select MUTHUR session at login
# Full session testing
```

---

### Test Checklist

**Basic Functionality**:
- [ ] Terminal sessions work
- [ ] File explorer works
- [ ] System monitor updates
- [ ] AI assistant responds
- [ ] 3D background renders
- [ ] No console errors

**Session Integration**:
- [ ] Launches fullscreen
- [ ] GPU acceleration works
- [ ] Input focus correct
- [ ] Keyboard shortcuts work
- [ ] Can exit gracefully

**Crash Recovery**:
- [ ] Kill process → auto-restart
- [ ] Repeated crashes → fallback
- [ ] Watchdog detects hangs
- [ ] TTY access works

**Performance**:
- [ ] <1s startup time
- [ ] 60 FPS rendering
- [ ] Low CPU idle (<5%)
- [ ] Low memory (<200 MB)

---

## MIGRATION PATH

### For Existing Users

**v0.1.x → v0.2.x** (Autostart)
- Update package/AppImage
- Optionally enable autostart
- No breaking changes

**v0.2.x → v0.3.x** (Session)
- Update package
- Session file automatically installed
- Choose session at login (optional)
- Desktop app still works

**v0.3.x → v1.0.x** (Kiosk)
- Update package
- Enable watchdog (optional)
- Configure kiosk mode (optional)
- All previous modes still work

**Philosophy**: Never break existing usage patterns

---

## FUTURE FEATURES

### v1.1+ Roadmap

**Planned**:
- Custom lock screen
- Startup animation
- Multi-monitor support
- Session profiles
- Remote desktop integration
- Voice commands (AI)
- Gesture support (touchscreen)
- Custom keyboard shortcuts
- Plugin system
- Theming engine

**Experimental**:
- VR/AR integration
- Hardware monitoring (sensors)
- Network visualization
- Container management UI
- System administration tools

---

## TECHNICAL DEBT

### Known Issues to Address

**High Priority**:
1. WebGL context loss (upstream bug - document workaround)
2. Banner text visibility (low priority UX issue)
3. Missing package-lock.json (fixed in CI/CD audit)
4. Missing Cargo.lock (fixed in CI/CD audit)

**Medium Priority**:
1. AI assistant timeout handling
2. PTY session cleanup
3. File explorer permission errors
4. System monitor error handling

**Low Priority**:
1. Custom cursor performance
2. Scanline effect optimization
3. CRT flicker subtlety
4. Three.js scene complexity

---

## RESOURCE REQUIREMENTS

### Minimum System

**Hardware**:
- CPU: Dual-core 2.0 GHz
- RAM: 2 GB
- GPU: OpenGL ES 2.0 support
- Disk: 200 MB

**Software**:
- Arch Linux (or compatible)
- Mesa 21.2+
- systemd
- Wayland compositor

---

### Recommended System

**Hardware**:
- CPU: Quad-core 3.0 GHz+
- RAM: 4 GB+
- GPU: Dedicated graphics
- Disk: 500 MB

**Software**:
- Arch Linux (latest)
- Mesa 23.0+
- Cage/Gamescope compositor
- Fast SSD

---

## SUMMARY

MUTHUR OS Terminal is evolving from a desktop app into a **production-grade immersive Linux shell session** using:

**Stack**:
- Arch Linux base
- Cage/Gamescope compositor
- Tauri v2 application
- WebKitGTK rendering
- Mesa GPU drivers
- systemd service management

**Deployment**:
- AppImage (universal)
- Arch package (native)
- Session integration (custom login)
- Watchdog recovery (production)

**Philosophy**:
- Build on Linux, don't replace it
- Use proven technologies
- Prioritize stability
- Maintain user control
- Progressive enhancement (desktop → session → kiosk)

**Next Steps**: See `docs/PHASE2_IMPLEMENTATION.md`
