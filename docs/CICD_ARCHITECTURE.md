# CI/CD Architecture

This document explains the complete CI/CD pipeline architecture for MUTHUR OS Terminal.

## Philosophy

**Core Principle**: Fail loudly, fail early, fail clearly.

- No hidden errors (no `|| true`, `|| echo`, `continue-on-error`)
- No log truncation (no `head`, `tail`, grep filtering of errors)
- Reproducible builds (lockfiles always committed)
- Clear separation: CI validation vs Release builds

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Developer Actions                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         Push/PR         Push Tag        Manual Dispatch
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   ci.yml    │  │release.yml  │  │release.yml  │
    │  (Quality)  │  │ (Publish)   │  │(Build Test) │
    └─────────────┘  └─────────────┘  └─────────────┘
              │               │               │
              ▼               ▼               ▼
    No Artifacts       GitHub Release    Artifacts Only
     Tests Pass        + Artifacts       No Release
```

## Workflows

### 1. ci.yml - Continuous Integration (Quality Gate)

**Purpose**: Validate code quality on every push

**Triggers**:
- Push to main/develop
- Pull requests to main/develop
- Excludes: markdown changes, docs, examples

**Jobs**:

#### Job: check
- Install system dependencies (WebKitGTK, Mesa, etc.)
- Setup Rust and Node.js 24
- Restore caches (Cargo, npm)
- **Verify lockfiles exist** (fails if missing)
- Install dependencies (`npm ci`)
- Build frontend (`npm run build`)
- Verify frontend output (dist/ exists)
- Build Tauri binary (no bundle)
- Verify binary exists

#### Job: test
- Run Rust tests (`cargo test`)
- Run clippy (`cargo clippy -- -D warnings`)
- Check formatting (`cargo fmt -- --check`)
- Build TypeScript (`npm run build`)

#### Job: summary
- Aggregates results from check and test
- Fails if either job failed

**Outputs**: None (or build logs as artifacts if configured)

**Duration**: ~5-8 minutes

---

### 2. release.yml - Release Build and Publish

**Purpose**: Build and publish official releases

**Triggers**:
- Push tags matching `v*.*.*` (e.g., v1.0.0, v0.1.2)
- Manual workflow_dispatch (with version input)

**Jobs**:

#### Job: build-linux
- Determine version (from tag or input)
- Install system dependencies
- Setup Rust and Node.js 24
- Restore caches
- **Verify lockfiles exist** (fails if missing)
- Install dependencies (`npm ci`)
- Build frontend with verification
- Build Tauri bundles (AppImage + Deb)
- Verify all artifacts exist:
  - Binary: `src-tauri/target/release/muthur-os-terminal`
  - AppImage: `bundle/appimage/*.AppImage`
  - Deb: `bundle/deb/*.deb`
- Make binary executable
- Generate SHA256 checksums
- Prepare release artifacts in single directory
- Upload artifacts to GitHub Actions

**Outputs**: version, binary_path, appimage_path, deb_path

#### Job: create-release
- Only runs for tag pushes (not manual dispatch)
- Downloads artifacts from build-linux job
- Generates release notes with installation instructions
- Creates GitHub release using softprops/action-gh-release@v2
- Marks as prerelease if version contains: alpha, beta, rc
- Attaches all artifacts (AppImage, Deb, Binary, Checksums)

**Duration**: ~10-15 minutes

---

### 3. version-update.yml - Automated Documentation

**Purpose**: Auto-update VERSION_HISTORY.md

**Triggers**: Push to main

**Jobs**:
- Run generate-changelog.sh script
- Commit updated VERSION_HISTORY.md
- Skip CI on commit (`[skip ci]`)

**Duration**: ~1-2 minutes

---

## Build Environment

### Runner Configuration

**OS**: Ubuntu 22.04 (NOT 24.04)

**Reason**: Ubuntu 24.04 removed libwebkit2gtk-4.0, and building on 24.04 causes GLIBC compatibility issues with older distros. Ubuntu 22.04 provides maximum compatibility.

### System Dependencies

```yaml
build-essential         # GCC, make, basic build tools
curl, wget, file       # Download tools
libssl-dev             # OpenSSL (Rust crypto)
libgtk-3-dev           # GTK3 windowing
libayatana-appindicator3-dev  # System tray
librsvg2-dev           # SVG rendering
libwebkit2gtk-4.1-dev  # WebKit engine (Tauri requirement)
libgl1-mesa-dev        # OpenGL (WebGL support)
libegl1-mesa-dev       # EGL (GPU acceleration)
xvfb                   # Virtual framebuffer (headless builds)
xorg-dev               # X11 development headers
```

### Toolchain Versions

- **Node.js**: 24 (LTS, required for GitHub Actions compliance)
- **Rust**: stable (latest via dtolnay/rust-toolchain)
- **npm**: Bundled with Node 24

### Environment Variables

```yaml
CARGO_TERM_COLOR: always          # Colored Cargo output
RUST_BACKTRACE: 1                 # Full backtraces on panic
FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true  # GitHub Actions requirement
```

---

## Caching Strategy

### Cargo Cache

**Path**:
```
~/.cargo/bin/
~/.cargo/registry/index/
~/.cargo/registry/cache/
~/.cargo/git/db/
src-tauri/target/
```

**Key**: `${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}`

**Restore Keys**: `${{ runner.os }}-cargo-`

**Purpose**: Cache Rust dependencies and build artifacts

**Invalidation**: When Cargo.lock changes

### NPM Cache

**Path**: `node_modules`

**Key**: `${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}`

**Restore Keys**: `${{ runner.os }}-node-`

**Purpose**: Cache npm packages

**Invalidation**: When package-lock.json changes

### Separate Caches for CI and Release

Release workflow uses separate cache keys:
- `cargo-release-*`
- `node-release-*`

**Reason**: Prevents CI and release builds from interfering with each other.

---

## Build Process

### Frontend Build

```bash
npm ci --legacy-peer-deps  # Clean install from lockfile
npm run build              # Vite build → dist/
```

**Output**: `dist/` directory with compiled frontend

**Verification**: Check dist/ exists and contains files

### Tauri Build

```bash
xvfb-run --auto-servernum --server-args="-screen 0 1024x768x24" \
  npm run tauri build
```

**Why xvfb?**
- Tauri requires display server for GTK initialization
- GitHub Actions runners have no display
- xvfb provides virtual display

**Output**:
- Binary: `src-tauri/target/release/muthur-os-terminal`
- AppImage: `src-tauri/target/release/bundle/appimage/*.AppImage`
- Deb: `src-tauri/target/release/bundle/deb/*.deb`

### Binary Naming

Binary name comes from `Cargo.toml` `name` field:
```toml
[package]
name = "muthur-os-terminal"  # ← Binary name
```

**Not** from `productName` in tauri.conf.json (that's for display only).

---

## Artifact Verification

### Verification Steps

1. **Frontend**: Check dist/ directory exists
2. **Binary**: Verify `src-tauri/target/release/muthur-os-terminal` exists
3. **AppImage**: Find first .AppImage file in bundle/appimage/
4. **Deb**: Find first .deb file in bundle/deb/
5. **Checksums**: Generate SHA256SUMS for all artifacts

### Failure Handling

If any artifact is missing:
- Build fails immediately
- Logs show expected path
- Lists actual directory contents
- Exit code 1 (stops workflow)

No silent failures. No `|| true`.

---

## Lockfile Management

### Critical Requirement

**Both lockfiles MUST be committed**:
- `package-lock.json` (npm)
- `src-tauri/Cargo.lock` (Cargo)

### Why?

1. **Reproducibility**: Same dependencies every build
2. **Security**: Can audit exact versions used
3. **Cache Efficiency**: Caches work properly
4. **Debugging**: Can reproduce bugs locally

### Verification

Both workflows verify lockfiles exist before building:
```yaml
- name: Verify lockfiles exist
  run: |
    if [ ! -f package-lock.json ]; then
      echo "ERROR: package-lock.json is missing"
      exit 1
    fi
    if [ ! -f src-tauri/Cargo.lock ]; then
      echo "ERROR: Cargo.lock is missing"
      exit 1
    fi
```

### Rust Best Practice

From Cargo documentation:
> Binary crates should commit Cargo.lock to ensure reproducible builds.

MUTHUR is a binary crate (not a library), so Cargo.lock MUST be committed.

---

## Dependency Installation

### NPM

```bash
npm ci --legacy-peer-deps
```

**Why `npm ci`?**
- Cleaner than `npm install`
- Requires lockfile (fails if missing)
- Faster (skips some checks)
- Reproducible

**Why `--legacy-peer-deps`?**
- React 19 has peer dependency conflicts with some packages
- Flag allows installation despite warnings
- Temporary until ecosystem catches up

### Cargo

```bash
cargo build --release
```

No special flags needed. Uses Cargo.lock automatically.

---

## Release Process

### Version Tag Format

**Semantic Versioning**: `vMAJOR.MINOR.PATCH`

Examples:
- `v1.0.0` - Stable release
- `v0.1.2` - Pre-1.0 release
- `v1.0.0-beta.1` - Pre-release (marked as prerelease)

### Prerelease Detection

Marked as prerelease if version contains:
- `alpha`
- `beta`
- `rc`

### Release Artifacts

All releases include:
1. AppImage (universal Linux)
2. Deb package (Debian/Ubuntu)
3. Binary executable
4. SHA256SUMS (checksums)

### Release Notes

Auto-generated with:
- Installation instructions for each format
- System requirements
- Known issues
- Verification instructions
- Changelog (if VERSION_HISTORY.md exists)

---

## Error Handling

### Philosophy: Fail Fast

If anything goes wrong:
1. Stop immediately
2. Show full error output
3. List relevant directory contents
4. Exit with error code

### No Hidden Failures

**Removed patterns**:
- `|| true` - Hides exit codes
- `|| echo "..."` - Fake success
- `| head -50` - Truncates errors
- `continue-on-error: true` - Ignores failures

**Replaced with**:
- Explicit error checks
- Full log output
- Clear error messages
- Hard failures

### Example: Frontend Build Verification

```yaml
- name: Build frontend
  run: npm run build

- name: Verify frontend build
  run: |
    if [ ! -d dist ]; then
      echo "ERROR: Frontend build failed - dist/ not created"
      exit 1
    fi
    echo "Frontend build successful"
    ls -lh dist/
```

If `npm run build` succeeds but doesn't create dist/, verification catches it.

---

## Monitoring and Debugging

### Viewing Workflow Runs

https://github.com/krko2n/Muthur-os-terminal/actions

### Debugging Failed Builds

1. Click failed workflow run
2. Expand failed job
3. Read error message (full output preserved)
4. Check "Set up job" for environment info
5. Download artifacts if partially built

### Common Failure Modes

**Missing lockfiles**:
```
ERROR: package-lock.json is missing
```
**Fix**: Run `npm install` locally, commit lockfile

**Frontend build failed**:
```
ERROR: Frontend build failed - dist/ not created
```
**Fix**: Check npm run build errors above

**Binary not found**:
```
ERROR: Binary not found at src-tauri/target/release/muthur-os-terminal
```
**Fix**: Check Cargo build errors, verify binary name

**AppImage missing**:
```
ERROR: AppImage not found
```
**Fix**: Check Tauri bundle logs, verify tauri.conf.json targets

---

## Security Considerations

### Lockfile Commits

Committing lockfiles allows:
- Security audits: `npm audit`, `cargo audit`
- Dependency review in PRs
- Exact version tracking

### GitHub Token Permissions

`GITHUB_TOKEN` permissions:
- `contents: write` - For version-update.yml (commits)
- Default permissions - For release.yml (create releases)

### No Secrets Required

Current workflows use only `GITHUB_TOKEN` (auto-provided).

Future GPG signing will require:
- `GPG_PRIVATE_KEY` secret
- `GPG_PASSPHRASE` secret

---

## Performance Optimization

### Build Times

**CI (ci.yml)**: ~5-8 minutes
- Cached: ~3-5 minutes
- Cold cache: ~8-10 minutes

**Release (release.yml)**: ~10-15 minutes
- Cached: ~8-10 minutes
- Cold cache: ~15-20 minutes

### Cache Hit Rates

With committed lockfiles:
- Cargo cache: >90% hit rate
- NPM cache: >90% hit rate

Without lockfiles:
- Cargo cache: ~0% hit rate (lockfile changes every run)
- NPM cache: ~0% hit rate

### Parallelization

CI workflow runs two jobs in parallel:
- `check` (build verification)
- `test` (tests and lints)

Saves ~2-3 minutes vs sequential.

---

## Maintenance

### Updating Dependencies

**NPM**:
```bash
npm update
npm audit fix
git add package-lock.json
git commit -m "chore: update npm dependencies"
```

**Cargo**:
```bash
cd src-tauri
cargo update
cargo audit
git add Cargo.lock
git commit -m "chore: update Rust dependencies"
```

### Updating GitHub Actions

Check for updates: https://github.com/actions

Currently using:
- actions/checkout@v5 (latest)
- actions/setup-node@v5 (latest)
- actions/cache@v4 (latest)
- actions/upload-artifact@v4 (latest)
- dtolnay/rust-toolchain@stable (latest)
- softprops/action-gh-release@v2 (latest)

### Updating Ubuntu Runner

Currently: `ubuntu-22.04`

**Do NOT update to ubuntu-24.04 yet**:
- WebKitGTK compatibility issues
- GLIBC version too new (breaks on older distros)

Re-evaluate in 2027.

---

## Future Improvements

### Planned

1. **Arch Package Workflow**
   - Generate .pkg.tar.zst
   - Auto-update PKGBUILD
   - Submit to AUR

2. **Code Signing**
   - GPG sign releases
   - Publish public key
   - Update release notes with verification

3. **ARM Builds**
   - Use ubuntu-22.04-arm runner
   - Build ARM64 AppImage
   - Add to release artifacts

4. **Artifact Optimization**
   - Strip unnecessary files from AppImage
   - Compress with upx (if beneficial)
   - Analyze bundle size

5. **Test Coverage**
   - Add Rust test coverage reporting
   - Frontend test suite (if tests added)
   - Coverage badges

### Under Consideration

1. **Matrix Builds** (multiple distros)
   - Build on Ubuntu 22.04, 24.04, Fedora
   - Test compatibility
   - Probably overkill for Tauri apps

2. **Nightly Builds**
   - Build develop branch nightly
   - Publish as pre-release
   - Auto-delete old nightlies

3. **Flatpak**
   - Requires Flathub submission
   - Adds maintenance burden
   - Defer until mature

---

## Troubleshooting Guide

### "Cache couldn't be restored"

**Cause**: Cache key changed (lockfile updated)

**Expected**: First build after lockfile change is slower

**Action**: None needed (cache rebuilds automatically)

---

### "npm ci failed"

**Cause**: package-lock.json missing or corrupted

**Fix**:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
```

---

### "cargo build failed"

**Cause**: Dependency update broke API, missing Cargo.lock

**Fix**:
```bash
cd src-tauri
cargo clean
cargo build
# If still fails, check error and update code
git add Cargo.lock
git commit -m "fix: update Cargo.lock"
```

---

### "Binary not found after build"

**Cause**: Binary name mismatch

**Check**:
```bash
ls -la src-tauri/target/release/
```

**Expected**: `muthur-os-terminal` (from Cargo.toml name)

**If different**: Update workflow artifact paths

---

### "AppImage not created"

**Causes**:
- Tauri bundle failed
- Invalid tauri.conf.json
- Missing dependencies

**Debug**:
1. Check Tauri build logs for "Building AppImage"
2. Verify targets in tauri.conf.json: `"targets": ["appimage", "deb"]`
3. Check for libfuse errors (AppImage dependency)

---

### "Release not created"

**Causes**:
- Job ran on non-tag push
- GITHUB_TOKEN lacks permissions
- Artifact download failed

**Check**:
1. Was this a tag push? (`git push origin v1.0.0`)
2. Check create-release job logs
3. Verify artifacts uploaded in build-linux job

---

### "Tests failing in CI but pass locally"

**Causes**:
- Environment differences
- Missing dependencies in CI
- Timing issues (race conditions)

**Debug**:
1. Compare system dependencies (local vs CI)
2. Check for hardcoded paths
3. Add debug logging to tests

---

## References

- Tauri v2 Docs: https://v2.tauri.app/
- GitHub Actions Docs: https://docs.github.com/actions
- Cargo Book: https://doc.rust-lang.org/cargo/
- WebKitGTK: https://webkitgtk.org/

---

## Changelog

- 2026-05-26: Initial CI/CD architecture documentation
- 2026-05-26: Split workflows into ci.yml and release.yml
- 2026-05-26: Fixed lockfile handling and caching
- 2026-05-26: Removed all hidden failure patterns
