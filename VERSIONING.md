# Versioning Guide

MUTHUR OS Terminal follows [Semantic Versioning](https://semver.org/) (SemVer).

## Current Version

**v0.1.1**

View in:
- [Cargo.toml](Cargo.toml)
- [package.json](package.json)
- [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)

## Version Format

`MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., 1.0.0 -> 2.0.0)
- **MINOR**: New features, backwards compatible (e.g., 0.1.0 -> 0.2.0)
- **PATCH**: Bug fixes (e.g., 0.1.0 -> 0.1.1)

## For Users

### Check Your Version

```bash
# If installed
muthur --version  # (coming soon)

# From source
grep version Cargo.toml | head -1
```

### Update to Latest

```bash
cd muthur-os-terminal
make upgrade
```

This will fetch the latest tagged release and rebuild.

## For Contributors

### View All Versions

```bash
# List all tags
git tag -l

# View specific version
git show v0.1.1
```

### Bump Version

Use the version bump script:

```bash
./version-bump.sh
```

This will:
1. Ask for bump type (patch/minor/major)
2. Update all version files:
   - Cargo.toml
   - package.json
   - src-tauri/tauri.conf.json
   - CHANGELOG.md
3. Create a git commit and tag
4. Prompt to push

**Manual bump:**

```bash
# 1. Update version in all three files
# Cargo.toml, package.json, src-tauri/tauri.conf.json

# 2. Update CHANGELOG.md with changes

# 3. Commit with version message
git add -A
git commit -m "v0.1.2: Brief description of changes"

# 4. Create tag
git tag -a "v0.1.2" -m "Release v0.1.2"

# 5. Push
git push && git push --tags
```

### Commit Message Format

All commits should follow this format:

```
type: brief description

Detailed explanation (optional)

Version: x.y.z (if version bump)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**

```bash
git commit -m "fix: correct Arch Linux webkit2gtk package name

Changed webkit2gtk to webkit2gtk-4.1 for Arch compatibility.

Version: 0.1.1"
```

```bash
git commit -m "feat: add multi-tab terminal support

Implemented tab management with xterm.js sessions.

Version: 0.2.0"
```

## Version History

### Curated Changelog

[CHANGELOG.md](CHANGELOG.md) - Human-curated, highlights important changes

### Complete History

[VERSION_HISTORY.md](VERSION_HISTORY.md) - Auto-generated from all commits

This file is automatically updated on every push to main via GitHub Actions.

### Generate History Manually

```bash
./generate-changelog.sh
```

This creates VERSION_HISTORY.md with:
- Every commit
- Commit hash
- Author
- Date
- Changed files

## Release Process

### Pre-Release Checklist

- [ ] All tests pass: `make test`
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in all files
- [ ] Commit tagged

### Release Steps

1. **Bump Version**
   ```bash
   ./version-bump.sh
   ```

2. **Push Changes**
   ```bash
   git push && git push --tags
   ```

3. **Verify CI/CD**
   - Check [GitHub Actions](https://github.com/krko2n/Muthur-os-terminal/actions)
   - Ensure build passes
   - Verify artifacts uploaded

4. **Create GitHub Release**
   - GitHub automatically creates release from tag
   - Binaries attached via CI/CD
   - Release notes generated from commits

### Hotfix Process

For critical bugs in production:

1. Create hotfix branch from tag:
   ```bash
   git checkout -b hotfix/v0.1.2 v0.1.1
   ```

2. Fix the bug and commit:
   ```bash
   git commit -m "fix: critical security issue

   Version: 0.1.2"
   ```

3. Bump patch version:
   ```bash
   # Update versions manually
   git add -A
   git commit -m "chore: bump to v0.1.2"
   git tag -a "v0.1.2" -m "Hotfix v0.1.2"
   ```

4. Merge back to main:
   ```bash
   git checkout main
   git merge hotfix/v0.1.2
   git push && git push --tags
   ```

## Version Timeline

| Version | Date | Description |
|---------|------|-------------|
| v0.1.1 | 2026-05-24 | Bug fixes, versioning system |
| v0.1.0 | 2026-05-24 | Initial release |

For complete history, see [VERSION_HISTORY.md](VERSION_HISTORY.md).

---

**Last Updated**: 2026-05-24  
**Current Version**: 0.1.1
