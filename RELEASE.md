# Release Instructions

This document explains how to create releases for MUTHUR OS Terminal.

## Release Strategy

MUTHUR OS Terminal uses a **tag-based release system**:

- Normal pushes to main/develop: CI validation only (no artifacts published)
- Version tags: Full release build with published artifacts
- Manual dispatch: Release build without creating a GitHub release

## Supported Release Formats

1. **AppImage** (PRIMARY) - Universal Linux, portable, download and run
2. **.deb Package** (SECONDARY) - Debian/Ubuntu native package manager
3. **Binary** (ADVANCED) - Standalone executable for manual installation

Future: Arch Linux package (.pkg.tar.zst) via AUR

## Creating a Release

### Prerequisites

1. All changes committed and pushed to main
2. CI passing (green checks on GitHub)
3. Version numbers updated in:
   - `package.json` (line 4: "version")
   - `src-tauri/Cargo.toml` (line 3: version)
   - `src-tauri/tauri.conf.json` (line 4: "version")
4. Lockfiles committed:
   - `package-lock.json` (required)
   - `src-tauri/Cargo.lock` (required)
5. VERSION_HISTORY.md updated (optional, auto-generated on push)

### Step 1: Verify Version Consistency

```bash
# Check all version numbers match
grep '"version"' package.json
grep '^version' src-tauri/Cargo.toml
grep '"version"' src-tauri/tauri.conf.json

# All three should show the same version (e.g., 0.1.2)
```

### Step 2: Create and Push Tag

```bash
# Semantic versioning: vMAJOR.MINOR.PATCH
VERSION="v0.1.2"

# Create annotated tag
git tag -a "$VERSION" -m "Release $VERSION"

# Push tag (triggers release workflow)
git push origin "$VERSION"
```

### Step 3: Monitor Release Build

1. Go to: https://github.com/krko2n/Muthur-os-terminal/actions
2. Watch "Release - Build and Publish" workflow
3. Build takes approximately 10-15 minutes

### Step 4: Verify Release

1. Go to: https://github.com/krko2n/Muthur-os-terminal/releases
2. Verify artifacts present:
   - `muthur-os-terminal_X.X.X_amd64.AppImage`
   - `muthur-os-terminal_X.X.X_amd64.deb`
   - `muthur-os-terminal` (binary)
   - `SHA256SUMS` (checksums)
3. Download and test AppImage:
   ```bash
   chmod +x muthur-os-terminal_*.AppImage
   ./muthur-os-terminal_*.AppImage
   ```

## Manual Release (Without Tag)

For testing release builds without publishing:

```bash
# Trigger workflow manually from GitHub UI
# Actions → Release - Build and Publish → Run workflow
# Enter version: v0.1.2-test
```

This builds artifacts but does NOT create a GitHub release.

## Version Numbering Scheme

Follow semantic versioning (semver):

- **MAJOR** (v1.0.0): Breaking changes, incompatible API changes
- **MINOR** (v0.1.0): New features, backwards-compatible
- **PATCH** (v0.0.1): Bug fixes, backwards-compatible

Pre-release tags:
- `v1.0.0-alpha.1` - Alpha release (early testing)
- `v1.0.0-beta.1` - Beta release (feature-complete, testing)
- `v1.0.0-rc.1` - Release candidate (final testing)

## Updating Version Numbers

### Automated Way (Recommended)

```bash
# Install npm-version (if not already)
npm install -g npm-version

# Bump version everywhere
npm version patch  # 0.1.1 → 0.1.2
npm version minor  # 0.1.2 → 0.2.0
npm version major  # 0.2.0 → 1.0.0

# This updates package.json and creates a git tag
# Then manually update Cargo.toml and tauri.conf.json to match
```

### Manual Way

Edit these files to have matching versions:

1. `package.json` line 4
2. `src-tauri/Cargo.toml` line 3
3. `src-tauri/tauri.conf.json` line 4

Commit changes:
```bash
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.1.2"
git push
```

Then create tag (see Step 2 above).

## Rollback/Delete Release

If a release is broken:

```bash
# Delete local tag
git tag -d v0.1.2

# Delete remote tag
git push --delete origin v0.1.2

# Delete GitHub release (via web UI)
# Go to releases page → click release → Delete release
```

Then fix the issue and recreate the tag.

## Lockfile Management

### CRITICAL: Always Commit Lockfiles

```bash
# Generate lockfiles if missing
npm install --legacy-peer-deps  # creates package-lock.json
cd src-tauri && cargo build      # creates Cargo.lock

# Commit them
git add package-lock.json src-tauri/Cargo.lock
git commit -m "chore: add lockfiles for reproducible builds"
git push
```

Without lockfiles:
- Builds are not reproducible
- CI cache is ineffective
- Dependency versions drift
- Security audits are impossible

## Troubleshooting

### "Lockfile missing" Error

```bash
npm install --legacy-peer-deps
cd src-tauri && cargo build
git add package-lock.json src-tauri/Cargo.lock
git commit -m "chore: add missing lockfiles"
git push
```

### "Artifact not found" Error

Check build logs for:
- Frontend build failure (npm run build)
- Binary name mismatch (should be muthur-os-terminal)
- Bundle path issues

### "CI failing" After Tag Push

1. Check: https://github.com/krko2n/Muthur-os-terminal/actions
2. Read error logs carefully
3. If unfixable: delete tag, fix code, recreate tag

### Version Mismatch Error

All three files must have identical version numbers:
- package.json
- Cargo.toml
- tauri.conf.json

## CI/CD Architecture

### Workflows

1. **ci.yml** - Runs on every push (quality gate)
   - Build verification
   - Tests
   - Linting
   - No artifacts published

2. **release.yml** - Runs on version tags only
   - Full release build
   - Artifact generation
   - Checksum generation
   - GitHub release creation

3. **version-update.yml** - Updates VERSION_HISTORY.md

### Workflow Triggers

```
Push to main/develop → ci.yml (tests only)
Push tag v*.*.* → release.yml (build + publish)
Manual dispatch → release.yml (build only, no publish)
```

### Build Outputs

Located in `src-tauri/target/release/`:
- `muthur-os-terminal` - Binary executable
- `bundle/appimage/*.AppImage` - AppImage bundle
- `bundle/deb/*.deb` - Debian package
- `SHA256SUMS` - Checksum file

## Release Checklist

Use this before every release:

- [ ] All tests passing locally
- [ ] CI green on GitHub
- [ ] Version bumped in all 3 files (package.json, Cargo.toml, tauri.conf.json)
- [ ] Lockfiles committed (package-lock.json, Cargo.lock)
- [ ] VERSION_HISTORY.md updated (optional)
- [ ] No uncommitted changes
- [ ] Tag created with correct version
- [ ] Tag pushed to GitHub
- [ ] Release workflow completed successfully
- [ ] Artifacts downloadable from releases page
- [ ] AppImage tested locally
- [ ] Checksums verified
- [ ] Release notes reviewed

## Future Improvements

Planned for future releases:

1. **Arch Linux Package**
   - Create PKGBUILD
   - Submit to AUR
   - Automate with GitHub Actions

2. **Code Signing**
   - GPG sign releases
   - Provide signature verification instructions

3. **Flatpak**
   - Submit to Flathub
   - Sandboxed installation option

4. **Auto-updates**
   - Implement Tauri updater
   - Check for updates on launch

## Contact

For release issues:
- GitHub Issues: https://github.com/krko2n/Muthur-os-terminal/issues
- Tag issues with: `release`, `build`, `ci-cd`
