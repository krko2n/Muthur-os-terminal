# CI/CD Quick Start Guide

**TL;DR**: Generate lockfiles, commit changes, push tag to release.

---

## IMMEDIATE ACTIONS REQUIRED

### 1. Generate Lockfiles (5 minutes)

```bash
# In project root
npm install --legacy-peer-deps

# In src-tauri directory
cd src-tauri
cargo build
cd ..
```

**Expected files created**:
- `package-lock.json`
- `src-tauri/Cargo.lock`

---

### 2. Commit Everything (2 minutes)

```bash
git add .github/workflows/ci.yml
git add .github/workflows/release.yml
git add .gitignore
git add src-tauri/tauri.conf.json
git add package-lock.json
git add src-tauri/Cargo.lock
git add RELEASE.md
git add AUDIT_REPORT.md
git add CICD_QUICK_START.md
git add docs/CICD_ARCHITECTURE.md

git commit -m "fix: modernize CI/CD pipeline with proper lockfiles and error handling"
git push origin main
```

---

### 3. Clean Up (1 minute)

```bash
# Remove deprecated workflow
git rm .github/workflows/build.yml.deprecated
git commit -m "chore: remove deprecated build workflow"
git push
```

---

## HOW TO CREATE A RELEASE

### 1. Bump Version

Edit these 3 files to match version (e.g., 0.1.2):
- `package.json` line 4
- `src-tauri/Cargo.toml` line 3
- `src-tauri/tauri.conf.json` line 4

```bash
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.1.2"
git push
```

---

### 2. Create Tag

```bash
VERSION="v0.1.2"
git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"
```

---

### 3. Wait for Build

Watch: https://github.com/krko2n/Muthur-os-terminal/actions

Build takes ~10-15 minutes.

---

### 4. Verify Release

Download from: https://github.com/krko2n/Muthur-os-terminal/releases

Test AppImage:
```bash
chmod +x muthur-os-terminal_*.AppImage
./muthur-os-terminal_*.AppImage
```

---

## WHAT CHANGED?

### Old System (build.yml)
- ❌ Built artifacts on every push
- ❌ Hid errors with `|| true`
- ❌ Truncated logs with `| head -50`
- ❌ No lockfiles (non-reproducible)
- ❌ Broken caching

### New System (ci.yml + release.yml)
- ✅ CI tests only (every push)
- ✅ Release builds only (tags)
- ✅ All errors visible
- ✅ Full logs preserved
- ✅ Lockfiles required
- ✅ Proper caching
- ✅ Checksums generated
- ✅ Auto-generated release notes

---

## WORKFLOW TRIGGERS

```
Normal push → ci.yml (tests only, no artifacts)
Version tag → release.yml (full build + release)
Manual run → release.yml (build only, no release)
```

---

## RELEASE ARTIFACTS

Every release includes:
1. **AppImage** - Universal Linux (recommended)
2. **Deb package** - Debian/Ubuntu
3. **Binary** - Standalone executable
4. **SHA256SUMS** - Checksums for verification

---

## TROUBLESHOOTING

### "Lockfile missing" error

```bash
npm install --legacy-peer-deps
cd src-tauri && cargo build && cd ..
git add package-lock.json src-tauri/Cargo.lock
git commit -m "fix: add missing lockfiles"
git push
```

---

### "Build failed" after tag push

1. Check: https://github.com/krko2n/Muthur-os-terminal/actions
2. Read error logs (full output now visible)
3. Fix issue
4. Delete tag: `git push --delete origin v0.1.2`
5. Recreate tag after fix

---

### "CI failing on every push"

This is expected if lockfiles are missing. Generate and commit them (see Step 1).

---

## VERSION NUMBERING

Semantic versioning: `vMAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (v1.0.0)
- **MINOR**: New features (v0.1.0)
- **PATCH**: Bug fixes (v0.0.1)

Pre-releases:
- `v1.0.0-alpha.1` - Alpha
- `v1.0.0-beta.1` - Beta
- `v1.0.0-rc.1` - Release candidate

---

## FULL DOCUMENTATION

- **Quick Start**: `CICD_QUICK_START.md` (this file)
- **Release Process**: `RELEASE.md`
- **Architecture**: `docs/CICD_ARCHITECTURE.md`
- **Audit Report**: `AUDIT_REPORT.md`

---

## SUMMARY

**Before pushing tag**:
- [ ] Lockfiles committed
- [ ] Version bumped in all 3 files
- [ ] CI green on GitHub
- [ ] No uncommitted changes

**After pushing tag**:
- Watch Actions tab for build progress
- Download and test AppImage
- Verify checksums

**Questions?**
- Read `AUDIT_REPORT.md` for detailed explanation
- Read `RELEASE.md` for step-by-step instructions
- Open GitHub Issue with `ci-cd` tag
