# Phase 2 Implementation Plan - Autostart Mode

**Target Version**: v0.2.0  
**Timeline**: 1-2 weeks  
**Complexity**: Low  
**Risk**: Low

---

## OVERVIEW

Phase 2 adds **autostart functionality** - MUTHUR launches fullscreen automatically when user logs into their desktop session.

**Key Features**:
- XDG autostart integration
- Fullscreen by default
- User can still access desktop (Alt+Tab)
- Easy enable/disable
- No compositor changes needed (works with user's existing environment)

---

## IMPLEMENTATION TASKS

### Task 1: Create Autostart Desktop File

**File**: `packaging/muthur-autostart.desktop`

```desktop
[Desktop Entry]
Type=Application
Name=MUTHUR OS Terminal (Autostart)
Comment=Futuristic terminal interface with AI integration
Exec=muthur-os-terminal --fullscreen-force
Icon=muthur
Terminal=false
StartupNotify=false
X-GNOME-Autostart-enabled=true
X-KDE-autostart-after=panel
Categories=System;TerminalEmulator;
```

**Purpose**: Automatically launch MUTHUR when desktop session starts

---

### Task 2: Add Fullscreen Command Line Argument

**File**: `src-tauri/src/main.rs`

Add CLI argument parsing:

```rust
use clap::Parser;

#[derive(Parser)]
#[command(name = "muthur-os-terminal")]
#[command(about = "MUTHUR OS - Futuristic Terminal Interface")]
struct Cli {
    /// Force fullscreen mode (for autostart)
    #[arg(long)]
    fullscreen_force: bool,
    
    /// Enable systemd watchdog notifications
    #[arg(long)]
    watchdog: bool,
}

fn main() {
    let cli = Cli::parse();
    
    // ... existing code ...
    
    tauri::Builder::default()
        .setup(move |app| {
            let window = app.get_window("main").unwrap();
            
            if cli.fullscreen_force {
                window.set_fullscreen(true).ok();
                window.set_decorations(false).ok();
            }
            
            if cli.watchdog {
                watchdog::init_watchdog();
            }
            
            // ... rest of setup ...
        })
        // ... rest of builder ...
}
```

**Dependencies**: Add to `Cargo.toml`:
```toml
clap = { version = "4.5", features = ["derive"] }
```

---

### Task 3: Update Arch PKGBUILD

**File**: `packaging/arch/PKGBUILD`

Add autostart file installation:

```bash
package() {
  # Install binary
  install -Dm755 "muthur-os-terminal" "$pkgdir/usr/bin/muthur-os-terminal"
  
  # Install desktop entry
  install -Dm644 "muthur.desktop" "$pkgdir/usr/share/applications/muthur.desktop"
  
  # Install autostart file (NEW)
  install -Dm644 "muthur-autostart.desktop" "$pkgdir/etc/xdg/autostart/muthur-autostart.desktop"
  
  # Install icons
  for size in 32 128 256; do
    install -Dm644 "icons/${size}x${size}.png" \
      "$pkgdir/usr/share/icons/hicolor/${size}x${size}/apps/muthur.png"
  done
  
  # Install config example
  install -Dm644 "config.toml.example" "$pkgdir/etc/muthur/config.toml.example"
}
```

**Post-install message**:
```bash
post_install() {
  echo "MUTHUR OS Terminal installed successfully!"
  echo ""
  echo "Usage:"
  echo "  - Run manually: muthur-os-terminal"
  echo "  - Autostart is ENABLED by default"
  echo "  - To disable autostart: rm ~/.config/autostart/muthur-autostart.desktop"
  echo "  - Or disable in your desktop settings > Autostart Applications"
  echo ""
  echo "Note: Autostart launches MUTHUR fullscreen on login"
  echo "      Press Alt+Tab to access other applications"
}
```

---

### Task 4: Update tauri.conf.json

**File**: `src-tauri/tauri.conf.json`

Ensure fullscreen configuration is correct:

```json
{
  "app": {
    "windows": [
      {
        "title": "MUTHUR://CORE",
        "width": 1920,
        "height": 1080,
        "fullscreen": false,
        "decorations": true,
        "transparent": false,
        "resizable": true,
        "alwaysOnTop": false,
        "skipTaskbar": false,
        "visible": true,
        "focus": true
      }
    ]
  }
}
```

**Note**: `fullscreen: false` in config, controlled by CLI arg

---

### Task 5: Add User Documentation

**File**: `docs/AUTOSTART.md`

```markdown
# Autostart Mode

MUTHUR can automatically launch fullscreen when you log into your desktop.

## Enable Autostart (Arch Linux)

Autostart is enabled by default when installing via pacman:

\`\`\`bash
sudo pacman -S muthur-os-terminal
# Autostart enabled automatically
\`\`\`

## Enable Autostart (AppImage)

\`\`\`bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/muthur.desktop <<EOF
[Desktop Entry]
Type=Application
Name=MUTHUR OS Terminal
Exec=/path/to/muthur-os-terminal.AppImage --fullscreen-force
Icon=muthur
Terminal=false
StartupNotify=false
EOF
\`\`\`

## Disable Autostart

### Method 1: Remove File
\`\`\`bash
rm ~/.config/autostart/muthur-autostart.desktop
\`\`\`

### Method 2: Desktop Settings
- KDE: System Settings > Autostart
- GNOME: Tweaks > Startup Applications
- XFCE: Settings > Session and Startup > Application Autostart

## Using with Autostart

When MUTHUR launches automatically:
- It starts fullscreen
- Press Alt+Tab to access other applications
- Press F11 to toggle fullscreen
- Close normally (Ctrl+Q or click X)

## Troubleshooting

### MUTHUR doesn't launch on login
Check autostart file exists:
\`\`\`bash
ls ~/.config/autostart/muthur-autostart.desktop
# or
ls /etc/xdg/autostart/muthur-autostart.desktop
\`\`\`

### MUTHUR launches but not fullscreen
Check command includes --fullscreen-force:
\`\`\`bash
cat ~/.config/autostart/muthur-autostart.desktop | grep Exec
# Should show: Exec=muthur-os-terminal --fullscreen-force
\`\`\`

### Multiple instances launch
Only one autostart file should exist. Remove duplicates:
\`\`\`bash
rm ~/.config/autostart/muthur*.desktop
# Keep only the one you want
\`\`\`
\`\`\`

---

### Task 6: Update README.md

Add autostart section:

```markdown
## Usage

### Desktop Application
\`\`\`bash
./muthur-os-terminal
\`\`\`

### Autostart Mode (NEW)
MUTHUR can launch automatically when you log in:

**Arch Linux**:
\`\`\`bash
sudo pacman -S muthur-os-terminal
# Autostart enabled by default
\`\`\`

**AppImage**:
See [docs/AUTOSTART.md](docs/AUTOSTART.md)

To disable autostart:
\`\`\`bash
rm ~/.config/autostart/muthur-autostart.desktop
\`\`\`
\`\`\`

---

### Task 7: Update Release Workflow

**File**: `.github/workflows/release.yml`

Add autostart desktop file to artifacts:

```yaml
- name: Prepare release artifacts
  run: |
    mkdir -p release-artifacts
    cp src-tauri/target/release/muthur-os-terminal release-artifacts/
    cp src-tauri/target/release/bundle/appimage/*.AppImage release-artifacts/
    cp src-tauri/target/release/bundle/deb/*.deb release-artifacts/
    cp src-tauri/target/release/SHA256SUMS release-artifacts/
    
    # Add packaging files (NEW)
    cp packaging/muthur-autostart.desktop release-artifacts/
    cp docs/AUTOSTART.md release-artifacts/
```

---

## TESTING PLAN

### Test 1: CLI Argument
```bash
# Test fullscreen flag
./muthur-os-terminal --fullscreen-force
# Expected: Launches fullscreen with no window decorations
```

### Test 2: Autostart File
```bash
# Create autostart file
mkdir -p ~/.config/autostart
cp packaging/muthur-autostart.desktop ~/.config/autostart/

# Log out and back in
# Expected: MUTHUR launches fullscreen automatically
```

### Test 3: Disable Autostart
```bash
rm ~/.config/autostart/muthur-autostart.desktop
# Log out and back in
# Expected: MUTHUR does not launch
```

### Test 4: Alt+Tab Functionality
```bash
# With MUTHUR running fullscreen
# Press Alt+Tab
# Expected: Can switch to other applications
```

### Test 5: Toggle Fullscreen
```bash
# With MUTHUR running
# Press F11
# Expected: Toggles fullscreen mode
```

---

## ROLLOUT STRATEGY

### Step 1: Development
- Implement CLI argument
- Create autostart desktop file
- Test locally on Arch Linux

### Step 2: Alpha Testing
- Build AppImage with new flag
- Test on Arch, Ubuntu, Fedora
- Gather feedback

### Step 3: Beta Release
- Update PKGBUILD
- Test AUR package
- Document autostart behavior

### Step 4: Production Release
- Tag v0.2.0
- Release AppImage + Arch package
- Update documentation
- Announce autostart feature

---

## USER COMMUNICATION

### Release Notes (v0.2.0)

```markdown
## What's New

### Autostart Mode
MUTHUR can now launch automatically when you log into your desktop!

**How to Enable**:
- Arch Linux: Enabled by default after `pacman -S muthur-os-terminal`
- AppImage: See [AUTOSTART.md](docs/AUTOSTART.md)

**How to Disable**:
\`\`\`bash
rm ~/.config/autostart/muthur-autostart.desktop
\`\`\`

### New CLI Arguments
- `--fullscreen-force` - Launch fullscreen (used by autostart)
- `--watchdog` - Enable systemd watchdog (future use)

### Improvements
- Better fullscreen handling
- Improved startup performance
- Updated documentation

### Known Issues
- WebGL may fail on some systems (upstream bug)
- Nvidia users may need GBM backend enabled
\`\`\`

---

## RISK ANALYSIS

### Low Risk
- **No compositor changes**: Works with existing desktop
- **Optional feature**: User can disable easily
- **Backwards compatible**: Old usage patterns still work

### Potential Issues
1. **User confusion**: "Why is this launching automatically?"
   - Mitigation: Clear post-install message
   
2. **Desktop environment compatibility**: Some DEs may not honor autostart
   - Mitigation: Document compatibility, provide manual methods
   
3. **Multiple instances**: User might launch manually while autostart runs
   - Mitigation: Add single-instance lock (future)

4. **Focus issues**: Other apps might steal focus on login
   - Mitigation: Document expected behavior, add `focus: true` in config

---

## SUCCESS CRITERIA

- [ ] CLI argument `--fullscreen-force` works
- [ ] Autostart file launches MUTHUR on login
- [ ] User can disable autostart easily
- [ ] Alt+Tab works to access other apps
- [ ] Documentation complete
- [ ] PKGBUILD updated
- [ ] Release notes written
- [ ] Testing on 3+ desktop environments passes

---

## TIMELINE

**Week 1**:
- Day 1-2: Implement CLI argument
- Day 3: Create autostart files
- Day 4-5: Update PKGBUILD and documentation
- Day 6-7: Local testing

**Week 2**:
- Day 1-2: Alpha testing on multiple distros
- Day 3-4: Bug fixes and refinements
- Day 5: Final testing
- Day 6: Tag v0.2.0
- Day 7: Release and announcement

---

## NEXT PHASE

After Phase 2 stabilizes, proceed to **Phase 3: Custom Session Mode** (see `docs/PHASE3_IMPLEMENTATION.md`)
