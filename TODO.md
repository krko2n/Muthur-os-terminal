# TODO List - MUTHUR OS Terminal

## PRODUCTION ARCHITECTURE TRANSFORMATION (NEW)

MUTHUR is evolving from a desktop app into a production-grade immersive Linux shell session.
See `PRODUCTION_ROADMAP.md` and `docs/PRODUCTION_ARCHITECTURE.md` for complete details.

### Phase 2: Autostart Mode (v0.2.0) - NEXT PRIORITY

- [ ] **Implement CLI arguments**
  - Add --fullscreen-force flag
  - Add --watchdog flag
  - Add --session-mode flag
  - Use clap crate for argument parsing
  - Priority: HIGH
  - See: `docs/PHASE2_IMPLEMENTATION.md`

- [ ] **Create packaging files**
  - packaging/muthur-autostart.desktop (created)
  - packaging/muthur.desktop (created)
  - packaging/arch/PKGBUILD (created)
  - Make muthur-session executable
  - Priority: HIGH

- [ ] **Add autostart documentation**
  - Create docs/AUTOSTART.md
  - Update README.md with autostart section
  - Add usage examples
  - Priority: MEDIUM

- [ ] **Test autostart mode**
  - Test on KDE, GNOME, XFCE
  - Test enable/disable workflow
  - Test fullscreen behavior
  - Test Alt+Tab functionality
  - Priority: HIGH

- [ ] **Release v0.2.0**
  - Bump version in all files
  - Create release tag
  - Build and test artifacts
  - Update release notes
  - Priority: HIGH

### Phase 3: Custom Session Mode (v0.3.0) - FUTURE

- [ ] **Implement session integration**
  - Add session mode detection
  - Create Wayland session file
  - Test with Cage compositor
  - Test with SDDM/greetd
  - Priority: MEDIUM
  - Timeline: 6-8 weeks

- [ ] **Create session documentation**
  - docs/SESSION_MODE.md
  - docs/PHASE3_IMPLEMENTATION.md
  - Installation guide
  - Troubleshooting
  - Priority: MEDIUM

### Phase 4: Production Kiosk Mode (v1.0.0) - LONG TERM

- [ ] **Implement systemd watchdog**
  - Add watchdog service
  - Health monitoring
  - Auto-restart logic
  - Crash recovery
  - Priority: LOW
  - Timeline: 3-4 months

- [ ] **Performance optimization**
  - Frontend code splitting
  - Three.js optimization
  - Startup time <500ms
  - Memory usage <200MB
  - Priority: LOW

## CRITICAL - CI/CD Issues (From 2026-05-26 Audit)

### Action Required Immediately

- [ ] **Generate and commit lockfiles** (BLOCKING RELEASES)
  - Run: `npm install --legacy-peer-deps` (creates package-lock.json)
  - Run: `cd src-tauri && cargo build` (creates Cargo.lock)
  - Commit both files: `git add package-lock.json src-tauri/Cargo.lock`
  - Priority: CRITICAL
  - Blocks: All releases until fixed
  - See: `CICD_QUICK_START.md` Step 1

- [ ] **Commit CI/CD modernization changes**
  - New workflows created: ci.yml, release.yml
  - Old workflow deprecated: build.yml.deprecated
  - Updated .gitignore (removed Cargo.lock exclusion)
  - Updated tauri.conf.json (added bundleMediaFramework)
  - Priority: CRITICAL
  - See: `CICD_QUICK_START.md` Step 2

- [ ] **Delete deprecated workflow file**
  - Remove: .github/workflows/build.yml.deprecated
  - Priority: HIGH
  - See: `CICD_QUICK_START.md` Step 3

- [ ] **Test new CI workflow**
  - Make small change to trigger CI
  - Verify "CI - Build and Test" runs successfully
  - Priority: HIGH
  - See: `CICD_QUICK_START.md` and `AUDIT_REPORT.md`

- [ ] **Create first release with new system**
  - Bump version to 0.1.2 in package.json, Cargo.toml, tauri.conf.json
  - Create and push v0.1.2 tag
  - Verify release artifacts (AppImage, Deb, Binary, SHA256SUMS)
  - Test AppImage download and launch
  - Priority: HIGH
  - See: `RELEASE.md` and `CICD_QUICK_START.md`

## Security Issues (From Audit)

### Not Yet Addressed

- [ ] **Issue #4 (Medium)**: Platform incompatibility
  - Problem: Linux-only support (no Windows/macOS)
  - Solution: Consider cross-platform support or document limitations clearly
  - Note: May be by design, not a bug
  - Priority: Medium

- [ ] **Issue #5 (Low)**: Dependency on GitHub CLI for bug reporting
  - Problem: report-error.sh requires gh CLI
  - Solution: Provide alternative simple bug report method (web form link)
  - Files: `report-error.sh`, README.md
  - Priority: Low

- [ ] **Issue #6 (Low)**: Rigid contribution guidelines
  - Problem: No-emoji policy and strict conventional commits may deter contributors
  - Solution: Soften guidelines or explain rationale better
  - Files: `CONTRIBUTING.md`, `NO_EMOJI_POLICY.md`
  - Priority: Low

## Features & Improvements

### High Priority

### Medium Priority

- [ ] Improve banner visual quality
  - Text is hard to read against green grid
  - Consider adding text outline or stronger background
  - User feedback: text visibility issues

- [ ] Create proper macOS .icns file
  - Currently using PNG placeholder
  - Need actual .icns format for macOS builds


- [ ] Security documentation improvements
  - Add example safe installation practices
  - Document privilege model in detail
  - Create security checklist for users

### Low Priority

- [ ] Consider changing icon color scheme
  - Current: cyan accent
  - Proposed: Matrix green (#00ff41) to match theme
  - User preference needed

- [ ] Local application testing
  - Build and run locally
  - Test all features work correctly
  - Verify AI integration with Ollama
  - Check terminal sessions, file explorer, system monitor

- [ ] Add automated security scanning
  - cargo audit in CI/CD
  - Dependabot for dependency updates
  - SAST tools integration

## Documentation

- [ ] Add SECURITY.md to CI/CD badge section
- [ ] Create troubleshooting guide for config.toml
- [ ] Document all environment variables
- [ ] Add architecture diagram showing config hierarchy
- [ ] Update DEVELOPMENT.md with security practices

## Testing

- [ ] Write tests for AI config loading
- [ ] Test environment variable precedence
- [ ] Test config file parsing errors
- [ ] Integration test for Ollama connection

## Known Issues

- Banner cached on GitHub - may take time to update
- Text visibility issue in banner against green grid background
- No Windows/macOS support (by design)

## Completed ✓

- [x] Issue #1 (Critical): Fixed unsafe curl | sh pattern
- [x] Issue #2 (High): Use of sudo in install scripts - Already secure (refuses to run as root, uses sudo only for specific privileged operations)
- [x] Issue #3 (Medium): Made AI model configurable (env var + config file)
- [x] Added SECURITY.md file
- [x] Updated README with secure installation practices
- [x] Added toml dependency for config parsing
- [x] Generated application icons from AI-generated geometric design
- [x] Fixed all Rust compilation errors (sysinfo 0.39, portable-pty 0.9)
- [x] Upgraded to latest dependency versions
- [x] Created banner for repository
- [x] Fixed Linux CI/CD build failures (Node.js 24, xvfb, OpenGL dependencies)
- [x] Created example config.toml with comprehensive documentation
- [x] Verified AI model configuration system works correctly

## Notes

- No emojis anywhere (project policy)
- Matrix green theme: #00ff41
- Tauri v2 API (breaking changes from v1)
- Rust 1.95.0, Node.js 24.x (LTS)
- Target: Linux (Arch, Ubuntu, Debian, Fedora)
