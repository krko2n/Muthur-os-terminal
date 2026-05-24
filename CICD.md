# CI/CD Documentation

## What the CI/CD Does

MUTHUR OS Terminal uses GitHub Actions for continuous integration and deployment.

### Workflow Overview

Located in: `.github/workflows/build.yml`

### Jobs

#### 1. build-linux
**Purpose**: Build the application and create release artifacts

**Runs on**: Ubuntu 22.04

**Steps**:
1. **Checkout code** - Downloads repository
2. **Install system dependencies** - GTK3, WebKit, OpenSSL, etc.
3. **Setup Rust** - Installs Rust toolchain
4. **Setup Node.js** - Installs Node.js 20
5. **Cache dependencies** - Caches Cargo and npm for faster builds
6. **Install NPM dependencies** - Runs `npm install --legacy-peer-deps`
7. **Build frontend** - Compiles React app
8. **Build Tauri app** - Compiles Rust backend and creates bundles
9. **Upload artifacts** - Uploads AppImage, Deb, and binary

**Artifacts created**:
- `muthur-linux-appimage` - Portable AppImage (~28 MB)
- `muthur-linux-deb` - Debian package (~22 MB)
- `muthur-linux-binary` - Raw binary (~18 MB)

#### 2. test
**Purpose**: Run tests and code quality checks

**Runs on**: Ubuntu 22.04

**Steps**:
1. **Checkout code**
2. **Install dependencies**
3. **Setup Rust & Node.js**
4. **Install NPM dependencies**
5. **Run Rust tests** - `cargo test` (optional, won't fail build)
6. **Run Rust clippy** - Linter (optional, won't fail build)
7. **Check Rust formatting** - `cargo fmt --check` (optional)

**Note**: All test steps use `continue-on-error: true` so they won't fail the build. This is intentional during early development.

#### 3. release
**Purpose**: Create GitHub releases with artifacts

**Runs on**: Ubuntu 22.04

**Triggers**: Only when you push a git tag (e.g., `v0.1.1`)

**Steps**:
1. Downloads all artifacts from build-linux job
2. Creates a GitHub Release
3. Attaches artifacts to the release
4. Generates release notes from commits

## When CI/CD Runs

### Automatic Triggers

1. **Push to main branch**
   - Runs build-linux and test jobs
   - Does NOT create a release

2. **Push to develop branch**
   - Runs build-linux and test jobs
   - Used for testing before merging to main

3. **Pull Request to main**
   - Runs build-linux and test jobs
   - Must pass before PR can be merged

4. **Push a version tag** (e.g., `v0.1.1`)
   - Runs all jobs including release
   - Creates GitHub Release with binaries

### Manual Triggers

Currently not configured. To add, update `.github/workflows/build.yml`:

```yaml
on:
  workflow_dispatch:  # Add this
  push:
    branches: [ main, develop ]
```

## How to Read CI/CD Results

### Success
- Green checkmark on GitHub
- All jobs completed
- Artifacts available for download

### Failure
- Red X on GitHub
- Click to see which step failed
- Read logs to understand the error

### Common Failures

#### npm install fails
**Cause**: Peer dependency conflicts
**Fix**: Add `--legacy-peer-deps` flag

#### cargo build fails
**Cause**: Rust compilation error
**Fix**: Check Rust code syntax

#### Missing system libraries
**Cause**: System dependency not installed
**Fix**: Update system dependencies in workflow

## Viewing Artifacts

After a successful build:

1. Go to Actions tab on GitHub
2. Click on a workflow run
3. Scroll to "Artifacts" section
4. Download AppImage, Deb, or binary

## Creating a Release

### Automatic Release Process

1. **Update version** (use version-bump.sh):
   ```bash
   ./version-bump.sh
   # Select patch/minor/major
   ```

2. **Push with tags**:
   ```bash
   git push && git push --tags
   ```

3. **CI/CD automatically**:
   - Builds all artifacts
   - Creates GitHub Release
   - Attaches binaries
   - Generates release notes

### Manual Release Process

If automatic release fails:

1. **Build locally**:
   ```bash
   make build
   ```

2. **Create release on GitHub**:
   - Go to Releases
   - Click "Draft a new release"
   - Tag: `v0.1.X`
   - Upload: AppImage, Deb, binary

## Debugging CI/CD Failures

### Step 1: Check Logs

1. Click on failed workflow
2. Click on failed job
3. Expand failed step
4. Read error message

### Step 2: Reproduce Locally

```bash
# Install same dependencies as CI
sudo apt install build-essential libgtk-3-dev libwebkit2gtk-4.1-dev

# Run same commands
npm install --legacy-peer-deps
npm run build
cd src-tauri && cargo build --release
```

### Step 3: Fix and Test

1. Fix the issue locally
2. Commit and push
3. CI/CD runs automatically
4. Check if it passes

## Optimization Tips

### Speed Up Builds

1. **Caching** (already enabled):
   - Cargo dependencies cached
   - npm modules cached
   - Reduces build time by 50%

2. **Parallel builds**:
   - build-linux and test run in parallel
   - Saves time

3. **Skip tests** (for quick iteration):
   - Tests already use `continue-on-error`
   - Won't block builds

### Reduce Artifact Size

Current sizes:
- Binary: ~18 MB (stripped)
- AppImage: ~28 MB
- Deb: ~22 MB

Already optimized with:
```toml
[profile.release]
lto = true
opt-level = "z"
strip = true
```

## CI/CD Configuration Files

### Main Workflow
`.github/workflows/build.yml` - Build and release

### Version Update Workflow
`.github/workflows/version-update.yml` - Auto-updates VERSION_HISTORY.md

## Environment Variables

```yaml
env:
  CARGO_TERM_COLOR: always
```

Ensures colored output in Cargo commands.

## Secrets Used

- `GITHUB_TOKEN` - Automatically provided by GitHub
  - Used for creating releases
  - No manual setup needed

## Future Improvements

Planned enhancements:

- [ ] Add frontend tests (Jest/Vitest)
- [ ] Add e2e tests (Playwright)
- [ ] Build for multiple architectures (ARM64)
- [ ] Windows and macOS builds
- [ ] Automated security scanning
- [ ] Performance benchmarks
- [ ] Docker image builds

## Troubleshooting

### "npm ERESOLVE unable to resolve dependency tree"
**Solution**: Already fixed with `--legacy-peer-deps`

### "target not found: webkit2gtk"
**Solution**: Already fixed, uses `webkit2gtk-4.1` on Arch

### "permission denied"
**Solution**: Scripts need `chmod +x`, but not needed in CI

### Build takes too long
**Normal**: First build takes 8-10 minutes
**Cached**: Subsequent builds take 3-5 minutes

## Monitoring CI/CD

### Check Status Badge

Add to README (already present):
```markdown
![CI](https://github.com/krko2n/Muthur-os-terminal/workflows/Build%20and%20Release/badge.svg)
```

### Email Notifications

GitHub sends emails on:
- Build failures (if you're the author)
- PR status changes

Configure in: GitHub Settings → Notifications

---

**Last Updated**: 2026-05-24  
**Version**: 0.1.1
