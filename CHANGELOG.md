# Changelog

All notable changes to MUTHUR OS Terminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For detailed commit history, see [VERSION_HISTORY.md](VERSION_HISTORY.md).

## [Unreleased]

### Added
- GREEN TERMINAL (green on pure black) and GREY OPS (grey chrome with green/orange/red status) themes.
- Status colours in every theme: CPU, RAM, disk, per-process CPU and network state turn orange when worth a look and red when dangerous; an alarm sounds once when a reading enters the red.
- Installer boots straight into MUTHUR by default: autostart after a desktop login, or a greetd autologin session (cage) on machines without a graphical login. `--no-boot` opts out.
- eDEX-style kernel boot log with [ OK ]/[ WARN ] tags, staggered panel sounds and a terminal output tick.

### Changed
- First-boot setup opens as a SETTINGS tab inside the main window instead of a floating dialog; choices apply live.
- On-screen keyboard matches eDEX-UI: flat keys, solid fill while pressed, a blink on release, outlined space bar and a seamless L-shaped Enter.
- The boot screen follows the selected theme instead of a fixed dark blue.

### Fixed
- `scripts/uninstall.sh` now accepts `--prefix <path>` and reads the prefix recorded by `install.sh` in `~/.config/muthur/install-prefix`, so custom-prefix installs (for example `~/.local`) are fully removed.
- WebKit aborted on the first sound (blank window) because the installer and PKGBUILD did not pull in gst-plugins-base/good (autoaudiosink).
- BIOS BLUE status red was unreadable on its blue background (2.4:1 contrast).
- `./install.sh --no-deps` failed with "cargo: command not found" in non-interactive shells because ~/.cargo/env was only loaded by the skipped Rust step.
- The SETTINGS tab could show the shell instead of its content: React reused the node the terminal is attached to.
- The fullscreen boot session (greetd + cage) exited immediately on virtual machines and machines without a GPU render node ("Unable to create the wlroots renderer"); it now falls back to software rendering like the launcher, and logs to ~/.local/state/muthur/session.log instead of the runtime directory that is wiped on logout.
- The interactive installer enabled greetd even when another display manager (LightDM, GDM, SDDM) already owned the screen.

### Planned
- Plugin system for custom widgets
- Configurable themes
- Session persistence
- SSH client integration
- Split pane support

---

## [0.1.1] - 2026-05-24

### Fixed
- Fixed Arch Linux package name: webkit2gtk -> webkit2gtk-4.1
- Fixed CI/CD workflow to handle missing package-lock.json
- Added --legacy-peer-deps to npm install
- Made clippy and fmt checks non-blocking

### Changed
- Redesigned README with focus on install/upgrade/uninstall
- Updated all documentation with correct Arch package names

### Added
- Version bump script (version-bump.sh)
- Automatic changelog generator (generate-changelog.sh)
- GitHub Actions workflow for version history updates
- QUICK_REFERENCE.md for common commands

---

## [0.1.0] - 2026-05-24

### Added
- Initial release of MUTHUR OS Terminal
- Multi-tab terminal emulator with xterm.js
- Real-time system monitoring (CPU, RAM, processes, network)
- AI assistant integration via Ollama
  - Command suggestions with `#` prefix
  - Auto-execute capability
  - Error debugging assistance
- File system explorer with full filesystem access
- 3D WebGL globe visualization for network status
- Sci-fi CRT aesthetic with:
  - Custom cursor
  - Scanline effects
  - Matrix green color scheme
  - Glow effects
- Automatic crash reporting to `~/.config/xKOR_3RR0R/crash_reports/`
- PTY session management with batched output (16ms frames)
- Cross-platform Linux support (Arch, Ubuntu, Debian, Fedora)
- One-command installation script
- AppImage and Deb package generation

### Technical Details
- Tauri 2.0 for native window management
- Rust backend with portable-pty
- React 19 with TypeScript
- TailwindCSS for styling
- Three.js for 3D graphics
- Optimized for <10% idle CPU usage

### Known Issues
- Windows/macOS support not yet implemented
- Browser panel placeholder (not functional)
- AI auto-execute has no confirmation dialog
- No session persistence between restarts

---

## Version History

- **v0.1.0** (2026-05-24) - Initial release

---

## Migration Guides

### From eDEX-UI

MUTHUR is inspired by eDEX-UI but is not a drop-in replacement. Key differences:

**Architecture**:
- eDEX-UI: Electron
- MUTHUR: Tauri (lighter, faster)

**Terminal**:
- Both use xterm.js
- MUTHUR adds multi-tab support
- MUTHUR has AI command suggestions

**System Monitor**:
- Similar functionality
- MUTHUR updates every 2s (configurable)
- Lighter resource usage

**Migration Steps**:
1. Install MUTHUR alongside eDEX-UI (no conflicts)
2. Test your workflows
3. Customize MUTHUR to match your preferences
4. Uninstall eDEX-UI when satisfied

---

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines.

---

## Links

- **Repository**: https://github.com/krko2n/Muthur-os-terminal
- **Issues**: https://github.com/krko2n/Muthur-os-terminal/issues
- **Releases**: https://github.com/krko2n/Muthur-os-terminal/releases
