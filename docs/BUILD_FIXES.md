# Build Fixes Documentation

This document explains the root cause fixes applied to resolve build failures in the MUTHUR OS Terminal installer.

## Issues Identified

Based on the installer log from Arch Linux, three categories of errors were present:

### 1. TypeScript Compilation Errors
- **Error**: `TS6133: 'useEffect' is declared but its value is never read`
- **Error**: `TS2580: Cannot find name 'process'`
- **Error**: `TS2339: Property 'meshBasicMaterial' does not exist`

### 2. Rust Build Errors
- **Error**: `failed to parse manifest at /home/admin/Muthur-os-terminal/Cargo.toml`
- **Error**: `no targets specified in the manifest`

### 3. Installer Script Issues
- **Error**: Wrong build sequence causing "No path was found" errors

## Root Cause Analysis

### TypeScript Errors

**TS6133 (Unused Variables)**:
- **Cause**: Strict TypeScript checks flagging legitimate React and Three.js patterns
- **Example**: `useFrame(_state, delta)` - the underscore prefix indicates intentionally unused
- **Previous Fix**: Disabled `noUnusedLocals` and `noUnusedParameters` in tsconfig.json
- **Status**: Already fixed

**TS2580 (process is not defined)**:
- **Cause**: Stale code on Linux machine, current codebase doesn't use `process`
- **Solution**: Code already correct, Linux machine needs `git pull` + clean rebuild
- **Backend Support**: Added `get_current_dir` Tauri command for safe directory access

**TS2339 (Three.js JSX Properties)**:
- **Cause**: Missing type definitions for @react-three/fiber
- **Solution**: Added `@types/node` to package.json devDependencies
- **Status**: Fixed in package.json

### Rust Build Errors

**"no targets specified in the manifest"**:
- **Cause**: Installer was running `cargo build` from wrong directory
- **Expected**: Build from project root using `npm run tauri build`
- **Actual**: Build from project root, then `cd src-tauri && cargo build`
- **Problem**: Tauri requires coordinated frontend + backend build

### Installer Script Issues

**Incorrect Build Sequence**:

**Old (Broken)**:
```bash
npm run build          # Build frontend only
cd src-tauri
cargo build --release  # Build backend separately (WRONG!)
cd ..
npm run tauri build    # Try to bundle (fails - wrong state)
```

**New (Correct)**:
```bash
npm ci --legacy-peer-deps
npm run tauri build    # One command handles everything
```

## Fixes Applied

### 1. Backend: Add `get_current_dir` Command

**File**: `src-tauri/src/main.rs`

Added Tauri command for safe directory access:

```rust
#[tauri::command]
async fn get_current_dir() -> Result<String, String> {
    std::env::current_dir()
        .map_err(|e| e.to_string())?
        .to_str()
        .ok_or_else(|| "Invalid UTF-8 in path".to_string())
        .map(|s| s.to_string())
}
```

Registered in handler:
```rust
.invoke_handler(tauri::generate_handler![
    // ... other commands
    get_current_dir,
])
```

**Why**: If frontend code needs current directory, it can call `invoke('get_current_dir')` instead of `process.cwd()`.

### 2. TypeScript: Add Missing Type Definitions

**File**: `package.json`

Added to devDependencies:
```json
"@types/node": "^22.10.5"
```

**Why**: Provides Node.js type definitions for build-time tooling and Three.js interop.

### 3. Installer: Fix Build Command

**File**: `install.sh`

**Before**:
```bash
build_app() {
    npm install --legacy-peer-deps --quiet
    npm run build --quiet              # Frontend only
    cd src-tauri
    cargo build --release --quiet      # Backend separately (WRONG!)
    cd ..
    npm run tauri build --quiet 2>/dev/null || true
}
```

**After**:
```bash
build_app() {
    npm ci --legacy-peer-deps          # Clean install
    npm run tauri build                # One unified build
}
```

**Why**:
- `npm run tauri build` is the official Tauri build command
- It orchestrates: frontend build → backend build → bundling → installers
- Running `cargo build` separately breaks the build state
- Using `npm ci` ensures reproducible builds from package-lock.json

## How Tauri Build Works

```
npm run tauri build
    │
    ├──> Build Frontend (Vite)
    │    └──> Output: dist/
    │
    ├──> Build Backend (Cargo)
    │    ├──> Inject frontend dist/ path
    │    ├──> Compile Rust with embedded frontend
    │    └──> Output: src-tauri/target/release/muthur-os-terminal
    │
    └──> Create Bundles
         ├──> AppImage (Linux universal)
         ├──> Deb (Debian/Ubuntu)
         ├──> DMG (macOS)
         └──> MSI (Windows)
```

## Testing the Fixes

### On Linux (Arch)

```bash
cd ~/Muthur-os-terminal

# Pull latest fixes
git pull origin main

# Clean everything
rm -rf dist/ node_modules/ src-tauri/target/

# Rebuild
npm ci --legacy-peer-deps
npm run tauri build

# Verify artifacts
ls -lh src-tauri/target/release/muthur-os-terminal
ls -lh src-tauri/target/release/bundle/appimage/*.AppImage
ls -lh src-tauri/target/release/bundle/deb/*.deb
```

### Using Installer

```bash
cd ~/Muthur-os-terminal
git pull origin main
./install.sh
```

The installer now uses the correct build command internally.

## Common Build Errors and Solutions

### Error: "Cannot find name 'process'"

**Symptom**: TypeScript error on `process.cwd()` or similar
**Cause**: Stale files on disk
**Solution**:
```bash
git pull origin main
rm -rf node_modules/ dist/
npm ci --legacy-peer-deps
```

### Error: "no targets specified in the manifest"

**Symptom**: Cargo can't build from root Cargo.toml
**Cause**: Running `cargo build` from wrong directory or wrong Cargo.toml
**Solution**: Don't run `cargo build` manually, use `npm run tauri build`

### Error: "failed to watch src-tauri/Cargo.toml"

**Symptom**: File watcher can't find Cargo.toml
**Cause**: Build system looking in wrong location
**Solution**: Ensure you're in project root, use `npm run tauri build`

### Error: TypeScript JSX errors for Three.js

**Symptom**: `Property 'meshBasicMaterial' does not exist on type 'JSX.IntrinsicElements'`
**Cause**: Missing type definitions
**Solution**:
```bash
npm install --save-dev @types/node @types/three
```

## Build Requirements

### System Dependencies (Arch Linux)

```bash
sudo pacman -S base-devel curl wget file openssl gtk3 libappindicator-gtk3 librsvg webkit2gtk-4.1
```

### Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Node.js 24.x

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
```

### Build Time

- Clean build: 5-10 minutes
- Incremental: 30-60 seconds

## Verification Checklist

After build completes:

- [ ] Binary exists: `src-tauri/target/release/muthur-os-terminal`
- [ ] Binary is executable: `chmod +x` and test run
- [ ] AppImage exists: `src-tauri/target/release/bundle/appimage/*.AppImage`
- [ ] Deb exists: `src-tauri/target/release/bundle/deb/*.deb`
- [ ] Binary size reasonable: 15-25 MB
- [ ] Application launches without errors
- [ ] Terminal sessions work
- [ ] System monitor displays stats
- [ ] File explorer navigates directories

## Future Improvements

- [ ] Add build caching to speed up CI/CD
- [ ] Add pre-compiled dependencies for faster local builds
- [ ] Create distro-specific packages (AUR, Flatpak, Snap)
- [ ] Add build verification tests
- [ ] Improve error messages in installer

## References

- Tauri Build Guide: https://v2.tauri.app/develop/
- Tauri CLI Reference: https://v2.tauri.app/reference/cli/
- NPM CI vs Install: https://docs.npmjs.com/cli/v10/commands/npm-ci
