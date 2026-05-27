# Release Quick Start Guide

Fast reference for creating multi-platform releases.

## Prerequisites

- Clean working tree on main branch
- All changes committed and pushed
- Documentation updated (VERSION_HISTORY.md, TODO.md)

## Release Process

### 1. Create Tag

```bash
# Example: releasing v0.2.0
git checkout main
git pull origin main
git tag -a v0.2.0 -m "Release v0.2.0 - Multi-platform support"
git push origin v0.2.0
```

### 2. Wait for Build

Monitor at: https://github.com/krko2n/Muthur-os-terminal/actions

Expected time: 10-15 minutes for all platforms

### 3. Publish Release

1. Go to: https://github.com/krko2n/Muthur-os-terminal/releases
2. Find draft release
3. Review artifacts
4. Click "Publish release"

## Artifacts Produced

- **Linux**: AppImage, Deb
- **macOS**: DMG, App tarball
- **Windows**: MSI, EXE, ZIP

## Version Format

Use semantic versioning: `v[major].[minor].[patch]`

Examples:
- `v0.2.0` - New features (alpha)
- `v0.2.1` - Bug fixes
- `v1.0.0` - First stable release

## Rollback

```bash
# Delete bad release
git tag -d v0.x.x
git push origin :refs/tags/v0.x.x
# Then delete the GitHub release via web UI
```

## Testing Checklist

Before publishing:

- [ ] Download Linux AppImage, test launch
- [ ] Download macOS DMG, test launch
- [ ] Download Windows MSI, test launch
- [ ] Verify terminal works
- [ ] Verify AI integration works
- [ ] Check version number in app

## Full Documentation

See `docs/MULTI_PLATFORM_RELEASES.md` for detailed information.

## Workflow File

`.github/workflows/release-multiplatform.yml`
