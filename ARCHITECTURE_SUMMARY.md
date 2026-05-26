# Architecture Summary - MUTHUR OS Terminal

**Date**: 2026-05-26  
**Type**: Production Architecture Design  
**Status**: Ready for Implementation

---

## WHAT CHANGED

MUTHUR OS Terminal is transforming from a **desktop application** into a **production-grade immersive Linux shell session** - a custom fullscreen environment similar to SteamOS Big Picture, eDEX-UI, or kiosk systems.

---

## THE VISION

```
User boots computer
→ Login screen shows "MUTHUR OS" option
→ User selects MUTHUR
→ System launches fullscreen immersive terminal UI
→ Futuristic interface with AI integration
→ User works in this environment
→ Optional: auto-restart on crash
→ Optional: kiosk lockdown mode
```

---

## ARCHITECTURE STACK

```
┌─────────────────────────────────┐
│      Arch Linux (base)          │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│    Login Manager (greetd/SDDM)  │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│  Cage Compositor (Wayland kiosk)│
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│    MUTHUR Tauri App (fullscreen)│
│  - Terminal (PTY)               │
│  - File Explorer                │
│  - System Monitor               │
│  - AI Assistant (Ollama)        │
│  - 3D Background (WebGL)        │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│  systemd Watchdog (auto-restart)│
└─────────────────────────────────┘
```

---

## PHASED ROLLOUT

### Phase 0: Foundation (COMPLETE ✓)
**What**: Working desktop application  
**Status**: v0.1.1 released  
**Usage**: Run manually as normal app

---

### Phase 1: CI/CD (COMPLETE ✓)
**What**: Fixed critical build failures  
**Status**: Completed 2026-05-26  
**Impact**: Reproducible builds, no hidden errors

---

### Phase 2: Autostart (NEXT 🎯)
**What**: Auto-launch fullscreen on login  
**Target**: v0.2.0 (1-2 weeks)  
**Usage**: 
```bash
# Installs with autostart enabled
pacman -S muthur-os-terminal

# Launches automatically on login
# User can still Alt+Tab to desktop
```

---

### Phase 3: Session Mode (MEDIUM TERM 📅)
**What**: Boot directly into MUTHUR session  
**Target**: v0.3.0 (6-8 weeks)  
**Usage**:
```
Login screen → Select "MUTHUR OS"
→ Boots into fullscreen MUTHUR
→ No desktop environment loaded
→ Lightweight and fast
```

---

### Phase 4: Kiosk Mode (LONG TERM 🚀)
**What**: Production-ready with crash recovery  
**Target**: v1.0.0 (6-12 months)  
**Usage**:
```
Production kiosk deployment
- Auto-restart on crash
- Health monitoring
- Optional autologin
- Optional lockdown
```

---

## KEY DESIGN DECISIONS

### Why Cage Compositor?
- **Purpose-built** for kiosk/fullscreen apps
- **Minimal** - zero configuration needed
- **Fast** - sub-200ms startup
- **Stable** - production-tested
- **Simple** - just works

Alternative: Gamescope (for advanced features)

---

### Why Wayland?
- **Modern** protocol
- **Better security** than X11
- **Lower latency** rendering
- **Native buffer sharing** (DMA-BUF)
- **Required** by Cage/Gamescope

X11 supported via XWayland for compatibility.

---

### Why systemd Watchdog?
- **Auto-restart** on crash
- **Health monitoring** (heartbeat check)
- **Graceful fallback** to TTY after repeated failures
- **Standard** Linux service management
- **Production-tested** pattern

---

### Why Progressive Enhancement?
**Philosophy**: Never break existing usage

- Phase 2: Desktop app still works
- Phase 3: Desktop app still works
- Phase 4: All previous modes still work

Users choose their mode:
1. Desktop app (manual launch)
2. Autostart (automatic launch)
3. Session (dedicated session)
4. Kiosk (production lockdown)

---

## TECHNICAL HIGHLIGHTS

### Session Integration
```bash
# /usr/share/wayland-sessions/muthur.desktop
[Desktop Entry]
Name=MUTHUR OS
Exec=/usr/bin/muthur-session

# /usr/bin/muthur-session
#!/bin/bash
exec cage -- /usr/bin/muthur-os-terminal --fullscreen-force
```

---

### Watchdog Service
```ini
# /usr/lib/systemd/user/muthur-watchdog.service
[Service]
Type=notify
ExecStart=/usr/bin/muthur-os-terminal --watchdog
Restart=on-failure
RestartSec=3s
StartLimitBurst=5
WatchdogSec=30s
```

---

### CLI Arguments (New)
```bash
# Force fullscreen (for autostart/session)
muthur-os-terminal --fullscreen-force

# Enable systemd watchdog
muthur-os-terminal --watchdog

# Session mode (full integration)
muthur-os-terminal --fullscreen-force --session-mode
```

---

## DISTRIBUTION STRATEGY

### 1. AppImage (PRIMARY)
- **Universal** Linux compatibility
- **Portable** - download and run
- **No installation** required
- **Perfect** for testing

---

### 2. Arch Package (NATIVE)
- **System integration** (session files, services)
- **AUR** submission for community
- **pacman** updates
- **Recommended** for Arch users

---

### 3. Deb Package (SECONDARY)
- **Ubuntu/Debian** support
- **Less focus** (Arch primary target)

---

### 4. ISO (FUTURE)
- **Bootable** USB
- **Live demo** environment
- **Pre-configured** kiosk
- **v2.0+** timeline

---

## ARCH LINUX INTEGRATION

### Package Structure
```
/usr/bin/muthur-os-terminal                    # Binary
/usr/share/applications/muthur.desktop         # App menu
/etc/xdg/autostart/muthur-autostart.desktop    # Autostart
/usr/share/wayland-sessions/muthur.desktop     # Session
/usr/bin/muthur-session                        # Session wrapper
/usr/lib/systemd/user/muthur-watchdog.service  # Watchdog
/etc/muthur/config.toml.example                # Config
```

### Installation Modes
```bash
# Mode 1: Desktop app only (default)
pacman -S muthur-os-terminal
muthur-os-terminal

# Mode 2: Autostart (Phase 2)
# Enabled by default, disable with:
rm ~/.config/autostart/muthur-autostart.desktop

# Mode 3: Session mode (Phase 3)
# Select "MUTHUR OS" at login screen

# Mode 4: Kiosk mode (Phase 4)
systemctl --user enable muthur-watchdog.service
# Configure autologin in greetd/SDDM
```

---

## CRASH RECOVERY

### Scenario 1: Application Crash
```
MUTHUR crashes
→ systemd detects failure
→ Waits 3 seconds
→ Restarts MUTHUR
→ Max 5 restarts in 5 minutes
→ After limit: fallback to TTY
```

### Scenario 2: GPU Hang
```
GPU hangs (WebGL issue)
→ No watchdog heartbeat for 30s
→ systemd kills process
→ Restarts MUTHUR
```

### Scenario 3: Repeated Failures
```
5 crashes in 5 minutes
→ systemd gives up
→ Stops graphical session
→ User drops to TTY
→ Can SSH in for debugging
```

---

## PERFORMANCE TARGETS

### Current (v0.1.x)
- Startup: ~1 second
- Memory: ~150 MB
- CPU idle: ~5-10%
- 60 FPS rendering

### Target (v1.0)
- Startup: <500ms
- Memory: <200 MB
- CPU idle: <5%
- 60 FPS solid

---

## GPU ACCELERATION

### Stack
```
Three.js (WebGL)
    ↓
WebKitGTK (OpenGL ES 2.0)
    ↓
Mesa (GPU drivers)
    ↓
DRM/KMS (kernel)
    ↓
GPU Hardware
```

### Compatibility
- **AMD**: Excellent (RADV open-source)
- **Intel**: Excellent (ANV open-source)
- **Nvidia**: Good (proprietary driver, needs GBM)

### Known Issues
- WebGL context loss (upstream bug #6559)
- Some systems may need fallback
- Document workarounds

---

## SECURITY

### Normal Mode (Recommended)
- User has full control
- Alt+Tab works
- TTY access (Ctrl+Alt+F2)
- Can exit to desktop
- Standard Linux security

### Kiosk Mode (Optional)
- Disable TTY switching
- Disable escape keys
- Autologin to session
- Single-app lockdown
- **Only for dedicated hardware**
- **User needs emergency access (SSH)**

---

## DOCUMENTATION CREATED

### Production Architecture
- ✓ **docs/PRODUCTION_ARCHITECTURE.md** (22 KB) - Complete architecture guide
- ✓ **PRODUCTION_ROADMAP.md** (15 KB) - Phased rollout plan
- ✓ **docs/PHASE2_IMPLEMENTATION.md** (12 KB) - Autostart mode guide
- ✓ **ARCHITECTURE_SUMMARY.md** (this file) - Executive summary

### Packaging Files
- ✓ **packaging/arch/PKGBUILD** - Arch package build script
- ✓ **packaging/muthur.desktop** - Application menu entry
- ✓ **packaging/muthur-autostart.desktop** - Autostart configuration
- ✓ **packaging/muthur-session.desktop** - Session file
- ✓ **packaging/muthur-session** - Session wrapper script
- ✓ **packaging/systemd/muthur-watchdog.service** - Watchdog service

### Updated Files
- ✓ **TODO.md** - Added production architecture tasks

---

## NEXT ACTIONS

### Immediate (This Week)
1. Review all documentation
2. Start Phase 2 implementation
3. Add CLI argument parsing (clap crate)
4. Test autostart on local machine

### Short Term (2 Weeks)
1. Complete Phase 2
2. Test on KDE, GNOME, XFCE
3. Release v0.2.0
4. Gather user feedback

### Medium Term (2 Months)
1. Research Cage integration
2. Plan Phase 3 implementation
3. Test session mode locally
4. Begin development

---

## RESEARCH FINDINGS

### Compositor Research
- **Cage**: Best for kiosk (recommended)
- **Gamescope**: Best for performance (advanced)
- **Sway/Hyprland**: Best for power users (flexible)

### Session Research
- **greetd**: Minimal login manager (recommended)
- **SDDM**: Full-featured (KDE default)
- **GDM**: GNOME default
- Session files: `/usr/share/wayland-sessions/`

### Crash Recovery Research
- systemd Type=notify with watchdog
- sd_notify() for health checks
- Restart policies: on-failure
- StartLimitBurst for fallback

### Performance Research
- Cage: sub-200ms startup
- DRM/KMS: direct rendering
- Mesa 21.2+: required for stability
- WebKitGTK GPU acceleration

---

## COMPARISON TO SIMILAR PROJECTS

### SteamOS Big Picture
- **Similar**: Fullscreen session, compositor-based
- **Different**: Gaming focus vs terminal focus

### eDEX-UI
- **Similar**: Futuristic terminal UI
- **Different**: Electron vs Tauri, no session mode

### Kiosk Systems
- **Similar**: Cage integration, single-app mode
- **Different**: General terminal vs specific kiosk app

---

## RISK MITIGATION

### Technical Risks
**WebGL instability**  
→ Document known issues, provide fallback

**Compositor incompatibility**  
→ Test multiple compositors, provide alternatives

**GPU driver issues**  
→ Test AMD/Intel/Nvidia, clear requirements

### Project Risks
**Maintenance burden**  
→ Keep architecture simple, avoid overengineering

**User confusion**  
→ Clear docs, progressive enhancement

**Breaking workflows**  
→ Maintain backwards compatibility

---

## WHY THIS ARCHITECTURE?

### Build ON Linux, Don't Replace It
- Use proven technologies
- Don't rewrite the world
- Leverage existing infrastructure
- Focus on the shell layer

### Progressive Enhancement
- Start simple (desktop app)
- Add features gradually
- Never break existing usage
- User chooses their mode

### Production-Ready
- Crash recovery
- Health monitoring
- Graceful fallback
- Comprehensive testing

### Maintainable
- Simple architecture
- Clear dependencies
- Well-documented
- Community-friendly

---

## CONCLUSION

MUTHUR OS Terminal has a clear path from desktop app to production immersive session:

**Current**: Working desktop application (v0.1.x)  
**Next**: Autostart mode (v0.2.0 in 2 weeks)  
**Medium**: Custom session (v0.3.0 in 2 months)  
**Long**: Production kiosk (v1.0.0 in 6-12 months)

**Stack**: Arch Linux + Cage + Tauri + systemd  
**Philosophy**: Build on Linux, progressive enhancement  
**Goal**: Futuristic immersive Linux shell experience

All documentation complete. Ready for implementation.

---

**See Also**:
- `PRODUCTION_ROADMAP.md` - Complete roadmap
- `docs/PRODUCTION_ARCHITECTURE.md` - Technical deep dive
- `docs/PHASE2_IMPLEMENTATION.md` - Next phase guide
- `TODO.md` - Action items

**Last Updated**: 2026-05-26
