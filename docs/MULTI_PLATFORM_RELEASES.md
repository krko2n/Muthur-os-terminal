# Multi-Platform Release Guide

This document explains how to create releases for Windows, macOS, and Linux using the automated GitHub Actions workflow.

## Overview

The MUTHUR OS Terminal now supports automated multi-platform builds using the official `tauri-apps/tauri-action`. When you push a version tag, GitHub Actions automatically:

1. Builds the application for Windows, macOS, and Linux
2. Creates installers for each platform
3. Generates a GitHub Draft Release with all binaries attached
4. Includes installation instructions and checksums

## Version Management

All version numbers are managed from Git tags. The source files use `0.0.0` as a placeholder:

- `package.json`: `"version": "0.0.0"`
- `src-tauri/Cargo.toml`: `version = "0.0.0"`
- `src-tauri/tauri.conf.json`: `"version": "0.0.0"`

The CI workflow automatically updates these to match your Git tag during the build process.

## Creating a Release

### Step 1: Update Documentation

Before creating a release, update relevant documentation:

```bash
# Update VERSION_HISTORY.md with changes
# Update README.md if needed
# Update TODO.md to mark completed items
```

### Step 2: Create and Push Version Tag

```bash
# Ensure you're on main branch with clean working tree
git checkout main
git pull origin main

# Create an annotated tag (example: v0.2.0)
git tag -a v0.2.0 -m "Release v0.2.0 - Multi-platform support"

# Push the tag to trigger the workflow
git push origin v0.2.0
```

### Step 3: Monitor the Build

1. Go to: https://github.com/krko2n/Muthur-os-terminal/actions
2. Click on the "Build & Release - Multi-Platform" workflow
3. Monitor all three platform builds (macOS, Ubuntu, Windows)

Build times:
- Linux: 5-10 minutes
- macOS: 8-15 minutes
- Windows: 8-15 minutes

### Step 4: Review and Publish Draft Release

Once all builds complete:

1. Go to: https://github.com/krko2n/Muthur-os-terminal/releases
2. Find your draft release
3. Review the generated artifacts:
   - **Linux**: `.AppImage`, `.deb`
   - **macOS**: `.dmg`, `.app.tar.gz`
   - **Windows**: `.msi`, `.exe`, `.zip`
4. Edit the release notes if needed
5. Click "Publish release"

## Build Artifacts

### Linux

- **AppImage** (Recommended): Universal Linux binary, runs on most distributions
- **Deb package**: For Debian/Ubuntu/derivatives
- Requires: WebKitGTK 4.1, OpenGL drivers

### macOS

- **DMG**: Drag-and-drop installer
- **App tarball**: For advanced users
- Minimum: macOS 10.13 (High Sierra)

### Windows

- **MSI**: Standard Windows installer
- **EXE**: Portable executable
- **ZIP**: Portable archive
- Minimum: Windows 10

## Troubleshooting

### Build Fails on Specific Platform

If one platform fails but others succeed:

1. Check the Actions logs for that specific platform
2. Common issues:
   - **Linux**: Missing system dependencies (webkit2gtk, librsvg)
   - **macOS**: Code signing issues (can be disabled for open-source)
   - **Windows**: MSVC toolchain issues

### Missing Artifacts

If artifacts are missing from the release:

1. Check that the build step completed successfully
2. Verify `tauri.conf.json` has `"targets": "all"`
3. Check platform-specific bundle settings

### Version Mismatch

If the version in the binary doesn't match the tag:

1. Ensure source files use `"version": "0.0.0"`
2. Verify the tag format matches `v*.*.*` (e.g., `v1.2.3`)
3. tauri-action automatically updates versions during build

## Manual Local Builds

To test builds locally before pushing a tag:

### Linux
```bash
npm ci
npm run tauri build
```

### macOS
```bash
npm ci
npm run tauri build
```

### Windows
```bash
npm ci
npm run tauri build
```

Artifacts will be in `src-tauri/target/release/bundle/`

## Version Numbering

Follow Semantic Versioning (semver):

- **v0.x.x**: Pre-1.0 development releases
- **v1.0.0**: First stable release
- **v1.1.0**: Minor version (new features, backwards compatible)
- **v1.1.1**: Patch version (bug fixes)
- **v2.0.0**: Major version (breaking changes)

Examples:
- `v0.2.0`: Second alpha release (multi-platform support)
- `v0.3.0`: Third alpha release (autostart mode)
- `v1.0.0`: First stable release

## Testing Releases

Before publishing a release:

1. Download each platform's artifact
2. Test installation on that platform
3. Verify the application launches
4. Test core features:
   - Terminal sessions
   - AI integration
   - System monitoring
   - File explorer

## Rollback Procedure

If a release has critical issues:

1. Delete the GitHub release
2. Delete the Git tag locally and remotely:
   ```bash
   git tag -d v0.x.x
   git push origin :refs/tags/v0.x.x
   ```
3. Fix the issue
4. Create a new patch version (e.g., v0.x.1)

## Future Enhancements

Planned improvements to the release system:

- [ ] Code signing for macOS (requires Apple Developer account)
- [ ] Code signing for Windows (requires certificate)
- [ ] Auto-updater integration (built into Tauri)
- [ ] Release notes auto-generation from git log
- [ ] Homebrew formula for macOS
- [ ] AUR package for Arch Linux
- [ ] Chocolatey package for Windows

## References

- Tauri Action: https://github.com/tauri-apps/tauri-action
- Tauri Bundling: https://v2.tauri.app/distribute/
- GitHub Releases: https://docs.github.com/en/repositories/releasing-projects-on-github
