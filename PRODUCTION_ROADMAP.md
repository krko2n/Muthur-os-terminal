# MUTHUR OS Terminal - Production Roadmap

**Current Version**: 0.1.1 (Desktop App)  
**Target Version**: 1.0.0 (Production Immersive Session)  
**Timeline**: 6-12 months

---

## VISION

Transform MUTHUR from a desktop application into a **production-grade immersive Linux shell environment** - a custom fullscreen session users can boot directly into, similar to SteamOS, eDEX-UI, or kiosk systems.

---

## PHASES

### Phase 0: Foundation (COMPLETE) ✓

**Version**: v0.1.x  
**Status**: Complete  
**Features**:
- Tauri v2 application
- Terminal sessions (PTY)
- File explorer
- System monitor
- AI assistant (Ollama)
- 3D background (Three.js)
- Custom cursor and CRT effects

**Deliverables**:
- ✓ Working desktop application
- ✓ AppImage distribution
- ✓ Deb package
- ✓ CI/CD pipeline (modernized)
- ✓ Documentation

---

### Phase 1: CI/CD Modernization (COMPLETE) ✓

**Version**: v0.1.2  
**Status**: Complete (2026-05-26)  
**Timeline**: 1 day

**Completed**:
- ✓ Fixed hidden build failures
- ✓ Fixed missing lockfiles
- ✓ Split CI and release workflows
- ✓ Added artifact verification
- ✓ Updated GitHub Actions to v5
- ✓ Generated SHA256 checksums
- ✓ Created comprehensive documentation

**Deliverables**:
- ✓ ci.yml workflow
- ✓ release.yml workflow
- ✓ AUDIT_REPORT.md
- ✓ CICD_ARCHITECTURE.md
- ✓ RELEASE.md

---

### Phase 2: Autostart Mode (NEXT) 🎯

**Version**: v0.2.0  
**Status**: Planned  
**Timeline**: 1-2 weeks  
**Complexity**: Low  
**Risk**: Low

**Goals**:
- Automatic fullscreen launch on desktop login
- XDG autostart integration
- CLI argument support
- Easy enable/disable
- User retains desktop access (Alt+Tab)

**Implementation**:
- [ ] Add `--fullscreen-force` CLI argument
- [ ] Create autostart desktop file
- [ ] Update Arch PKGBUILD
- [ ] Add autostart documentation
- [ ] Test on multiple desktop environments
- [ ] Release v0.2.0

**Deliverables**:
- muthur-autostart.desktop
- Updated PKGBUILD
- docs/AUTOSTART.md
- docs/PHASE2_IMPLEMENTATION.md (complete)

**Success Criteria**:
- MUTHUR launches automatically on login
- User can disable easily
- Works on KDE, GNOME, XFCE
- Alt+Tab functionality preserved

---

### Phase 3: Custom Session Mode (MEDIUM TERM) 📅

**Version**: v0.3.0  
**Status**: Planned  
**Timeline**: 4-6 weeks  
**Complexity**: Medium  
**Risk**: Medium

**Goals**:
- Boot directly into MUTHUR session
- Display manager integration
- Cage compositor integration
- Lightweight session (no desktop environment)
- Session selection at login screen

**Implementation**:
- [ ] Create Wayland session file
- [ ] Create session wrapper script
- [ ] Integrate Cage compositor
- [ ] Add session mode detection
- [ ] Update PKGBUILD for session files
- [ ] Test with SDDM and greetd
- [ ] Document session installation

**Deliverables**:
- /usr/share/wayland-sessions/muthur.desktop
- /usr/bin/muthur-session wrapper script
- docs/PHASE3_IMPLEMENTATION.md
- docs/SESSION_MODE.md
- Updated PKGBUILD

**Success Criteria**:
- "MUTHUR OS" appears in login manager
- Session launches fullscreen with Cage
- GPU acceleration works
- Graceful session termination
- User can switch to other sessions

---

### Phase 4: Production Kiosk Mode (LONG TERM) 🚀

**Version**: v1.0.0  
**Status**: Planned  
**Timeline**: 3-4 months after Phase 3  
**Complexity**: High  
**Risk**: Medium

**Goals**:
- Production-ready immersive session
- Crash recovery and watchdog
- Automatic restart on failure
- Optional autologin
- Optional kiosk lockdown
- Performance optimizations
- Comprehensive testing

**Implementation**:
- [ ] systemd watchdog service
- [ ] Crash recovery logic
- [ ] Health monitoring
- [ ] Graceful fallback to TTY
- [ ] Startup performance optimization
- [ ] Gamescope compositor option
- [ ] Multi-monitor support
- [ ] Kiosk configuration file
- [ ] Extensive testing

**Deliverables**:
- /usr/lib/systemd/user/muthur-watchdog.service
- /etc/muthur/kiosk.conf
- Watchdog implementation in Rust
- docs/PHASE4_IMPLEMENTATION.md
- docs/KIOSK_MODE.md
- Production PKGBUILD
- AUR submission

**Success Criteria**:
- Auto-restart on crash (max 5 attempts)
- TTY fallback after repeated crashes
- <500ms startup time
- 60 FPS rendering
- <5% CPU idle
- <200 MB memory usage
- Stable for 24+ hours continuous use

---

### Phase 5: Advanced Features (FUTURE) 🌟

**Version**: v1.1.0+  
**Status**: Future  
**Timeline**: TBD

**Potential Features**:
- Custom lock screen
- Startup animation
- Multi-monitor spanning
- Session profiles
- Remote desktop integration
- Voice commands (AI)
- Touchscreen gestures
- Custom keyboard shortcuts
- Plugin system
- Advanced theming
- ISO distribution (bootable USB)
- Waydroid integration (Android apps)
- Container management UI
- Network visualization
- Hardware sensor monitoring

---

## TECHNICAL MILESTONES

### Milestone 1: Lockfiles and CI/CD ✓
**Status**: Complete  
**Date**: 2026-05-26

- ✓ Generate package-lock.json
- ✓ Commit Cargo.lock
- ✓ Modernize workflows
- ✓ Fix hidden failures

---

### Milestone 2: Autostart Integration
**Status**: Planned  
**Target**: 2 weeks

- [ ] CLI arguments
- [ ] Autostart desktop file
- [ ] PKGBUILD update
- [ ] Multi-DE testing

---

### Milestone 3: Session Integration
**Status**: Planned  
**Target**: 6-8 weeks

- [ ] Wayland session file
- [ ] Cage integration
- [ ] Session wrapper script
- [ ] Display manager testing

---

### Milestone 4: Watchdog and Recovery
**Status**: Planned  
**Target**: 3-4 months

- [ ] systemd service
- [ ] Health monitoring
- [ ] Auto-restart logic
- [ ] Fallback mechanisms

---

### Milestone 5: Production Release
**Status**: Planned  
**Target**: 6-12 months

- [ ] v1.0.0 release
- [ ] AUR submission
- [ ] Comprehensive docs
- [ ] Community support

---

## TECHNICAL DEBT TO ADDRESS

### High Priority
- [ ] WebGL context loss workaround/documentation
- [ ] GPU acceleration verification script
- [ ] Comprehensive error handling
- [ ] Crash reporting system

### Medium Priority
- [ ] PTY session cleanup improvements
- [ ] AI assistant timeout handling
- [ ] File explorer permission errors
- [ ] System monitor error recovery

### Low Priority
- [ ] Custom cursor performance
- [ ] Three.js scene optimization
- [ ] CRT effect subtlety tuning
- [ ] Banner text visibility

---

## TESTING STRATEGY

### Phase 2 Testing (Autostart)
- Desktop environments: KDE, GNOME, XFCE, LXDE
- Window managers: i3, Openbox, Awesome
- Distros: Arch, Manjaro, EndeavourOS

### Phase 3 Testing (Session)
- Display managers: SDDM, greetd, GDM, LightDM
- Compositors: Cage, Gamescope
- GPUs: AMD (RADV), Intel (ANV), Nvidia (proprietary)

### Phase 4 Testing (Kiosk)
- Crash scenarios: SIGTERM, SIGKILL, OOM
- GPU hangs and recovery
- 24+ hour stability tests
- Resource leak detection
- Multi-boot scenarios

---

## DOCUMENTATION ROADMAP

### Core Documentation (Complete)
- ✓ README.md
- ✓ CONTRIBUTING.md
- ✓ SECURITY.md
- ✓ TODO.md
- ✓ CLAUDE.md

### CI/CD Documentation (Complete)
- ✓ AUDIT_REPORT.md
- ✓ CICD_QUICK_START.md
- ✓ RELEASE.md
- ✓ docs/CICD_ARCHITECTURE.md
- ✓ docs/CICD_CHANGES_SUMMARY.md

### Architecture Documentation (Complete)
- ✓ docs/PRODUCTION_ARCHITECTURE.md (this file)
- ✓ docs/PHASE2_IMPLEMENTATION.md
- ✓ PRODUCTION_ROADMAP.md (this file)

### Planned Documentation
- [ ] docs/AUTOSTART.md (Phase 2)
- [ ] docs/SESSION_MODE.md (Phase 3)
- [ ] docs/PHASE3_IMPLEMENTATION.md (Phase 3)
- [ ] docs/KIOSK_MODE.md (Phase 4)
- [ ] docs/PHASE4_IMPLEMENTATION.md (Phase 4)
- [ ] docs/TROUBLESHOOTING.md (Phase 4)
- [ ] docs/PERFORMANCE.md (Phase 4)
- [ ] docs/GPU_ACCELERATION.md (Phase 4)

---

## COMMUNITY GOALS

### Short Term
- Release v0.2.0 with autostart
- Build user base
- Gather feedback
- Fix bugs

### Medium Term
- AUR package submission
- Reddit/forum presence
- YouTube demo videos
- Blog posts

### Long Term
- Active community
- Plugin ecosystem
- Contributor base
- Conference talks

---

## SUCCESS METRICS

### Phase 2 Success
- 100+ downloads/week
- Autostart works on 5+ DEs
- <5 critical bugs

### Phase 3 Success
- 500+ downloads/week
- AUR votes >10
- Session mode stable
- Featured on r/unixporn

### Phase 4 Success
- 1000+ downloads/week
- AUR votes >50
- Production deployments
- Featured on Linux podcasts/blogs

### v1.0 Success
- 5000+ downloads/week
- AUR votes >100
- Multiple contributors
- Used in real kiosk deployments

---

## RISK MITIGATION

### Technical Risks
**Risk**: WebGL instability  
**Mitigation**: Document known issues, provide fallback UI

**Risk**: Compositor incompatibility  
**Mitigation**: Test multiple compositors, provide alternatives

**Risk**: GPU driver issues  
**Mitigation**: Comprehensive GPU testing, clear requirements

**Risk**: Session mode conflicts  
**Mitigation**: Careful integration, extensive testing

### Project Risks
**Risk**: Maintenance burden  
**Mitigation**: Keep architecture simple, avoid overengineering

**Risk**: User confusion  
**Mitigation**: Clear documentation, progressive enhancement

**Risk**: Breaking user workflows  
**Mitigation**: Maintain backwards compatibility, optional features

---

## DEPENDENCIES

### System Dependencies
- Arch Linux (primary target)
- WebKitGTK 4.1
- Mesa 21.2+
- systemd
- Cage compositor (Phase 3+)

### Development Dependencies
- Rust 1.95+
- Node.js 24+
- Tauri CLI 2.0+
- Cargo
- npm

### Optional Dependencies
- ollama (AI features)
- gamescope (advanced compositor)
- greetd (lightweight login)

---

## NEXT ACTIONS

### Immediate (This Week)
1. [ ] Generate lockfiles (if not done)
2. [ ] Test v0.1.2 release
3. [ ] Start Phase 2 implementation
4. [ ] Create `--fullscreen-force` CLI arg

### Short Term (2 Weeks)
1. [ ] Complete Phase 2 implementation
2. [ ] Test autostart on multiple DEs
3. [ ] Release v0.2.0
4. [ ] Gather user feedback

### Medium Term (2 Months)
1. [ ] Plan Phase 3 implementation
2. [ ] Research compositor integration
3. [ ] Test Cage with MUTHUR
4. [ ] Begin session mode development

---

## CONCLUSION

MUTHUR OS Terminal is on a clear path from desktop application to production-grade immersive Linux shell. Each phase builds on the previous, maintaining backwards compatibility while adding powerful new capabilities.

**Current Status**: Phase 1 complete, ready for Phase 2  
**Next Milestone**: v0.2.0 with autostart mode  
**Long-term Goal**: v1.0.0 production kiosk session

The architecture is sound, the technology stack is proven, and the roadmap is achievable. Let's build the future of Linux terminals.

---

**Last Updated**: 2026-05-26  
**Document**: docs/PRODUCTION_ROADMAP.md
