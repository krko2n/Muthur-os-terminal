# Changelog

All notable changes to MUTHUR OS Terminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For detailed commit history, see [VERSION_HISTORY.md](VERSION_HISTORY.md).

## [Unreleased]

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
