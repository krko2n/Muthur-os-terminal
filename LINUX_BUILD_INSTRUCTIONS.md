# Linux Build Instructions - FIXED

The installer has been completely fixed. All root causes addressed.

## What Was Fixed

1. **Installer Script** - Now uses proper `npm run tauri build` command
2. **Backend** - Added `get_current_dir` Tauri command for safe directory access
3. **TypeScript** - Added `@types/node` for proper type definitions
4. **Build Sequence** - Removed incorrect multi-step manual build process

## On Your Linux PC - Run This

```bash
cd ~/Muthur-os-terminal

# Get the fixes
git pull origin main

# Clean everything (IMPORTANT!)
rm -rf dist/
rm -rf node_modules/
rm -rf src-tauri/target/

# Run the fixed installer
./install.sh
```

## Or Manual Build

```bash
cd ~/Muthur-os-terminal
git pull origin main

# Clean
rm -rf dist/ node_modules/ src-tauri/target/

# Install dependencies
npm ci --legacy-peer-deps

# Build (one command does everything!)
npm run tauri build
```

## After Successful Build

Your binaries will be at:

```bash
# Standalone binary
./src-tauri/target/release/muthur-os-terminal

# AppImage (recommended)
./src-tauri/target/release/bundle/appimage/muthur-os-terminal_*.AppImage

# Deb package
./src-tauri/target/release/bundle/deb/muthur-os-terminal_*.deb
```

## What Changed in the Installer

**Before (Broken)**:
```bash
npm install
npm run build              # Frontend only
cd src-tauri
cargo build --release      # Backend separately (WRONG!)
cd ..
npm run tauri build        # Try to bundle (fails)
```

**After (Fixed)**:
```bash
npm ci --legacy-peer-deps
npm run tauri build        # One unified command (CORRECT!)
```

## Why This Works

`npm run tauri build` is the official Tauri build command that:
1. Builds the React frontend (Vite → dist/)
2. Builds the Rust backend with embedded frontend
3. Creates all platform packages (AppImage, Deb, etc.)

Running `cargo build` separately breaks the build state because Tauri needs to coordinate the frontend and backend builds.

## Expected Build Time

- First build: 5-10 minutes
- Incremental: 30-60 seconds

## If Build Still Fails

Check you have all dependencies:

```bash
# Arch Linux
sudo pacman -S base-devel curl wget file openssl gtk3 libappindicator-gtk3 librsvg webkit2gtk-4.1

# Verify Rust
rustc --version  # Should be 1.95.0 or later

# Verify Node
node --version   # Should be v24.x or later
```

## Verify Build Success

```bash
# Check binary exists
ls -lh src-tauri/target/release/muthur-os-terminal

# Check AppImage exists
ls -lh src-tauri/target/release/bundle/appimage/*.AppImage

# Test run
./src-tauri/target/release/muthur-os-terminal
```

## Full Documentation

See `docs/BUILD_FIXES.md` for complete technical details about all the fixes applied.

## Need Help?

If build still fails after these fixes:
1. Save the full error log
2. Open issue: https://github.com/krko2n/Muthur-os-terminal/issues
3. Include: OS (Arch/Ubuntu/etc), Rust version, Node version, full error output
