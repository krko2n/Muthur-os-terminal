# MUTHUR OS - Compositor Evaluation Report

## Executive Summary

For kiosk deployment (MUTHUR as sole UI), **Cage** is the definitive choice.
For desktop integration (MUTHUR as one app alongside others), Hyprland or Sway
are both suitable. Gamescope is not recommended.

## Comparison Matrix

| Criteria | Cage | Hyprland | Sway | Gamescope |
|----------|------|----------|------|-----------|
| **Purpose** | Kiosk (single app) | Desktop (tiling WM) | Desktop (tiling WM) | Gaming overlay |
| **Version (2026)** | 0.3.0 | 0.55.x | 1.12.x | 3.15.x |
| **Maintenance** | Active, stable | Active, rapid | Active, conservative | Active (Valve) |
| **Maturity** | High (purpose-built) | Moderate (2-3 yrs) | High (7+ yrs) | Moderate |
| **Kiosk Suitability** | EXCELLENT | Poor | Adequate | Not suitable |
| **Desktop Suitability** | Not applicable | Excellent | Excellent | Not applicable |
| **Resource Usage (idle)** | ~5 MB RAM, <1% CPU | ~40 MB RAM, 1-3% CPU | ~25 MB RAM, <1% CPU | ~60 MB RAM, 2-5% CPU |
| **GPU Overhead** | Minimal | Moderate (effects) | Minimal | High (Vulkan) |
| **webkit2gtk Support** | Full | Full | Full | Partial |
| **Configuration** | None needed | hyprland.conf | sway config (i3) | Command-line flags |
| **Multi-window** | No (by design) | Yes | Yes | No |
| **Animations** | None | Yes (configurable) | None | Framerate control |
| **VT Switch Prevention** | Flag: omit -s | Requires workaround | Requires workaround | Not supported |
| **Arch Linux Package** | extra/cage | extra/hyprland | extra/sway | extra/gamescope |
| **Dependencies** | wlroots | aquamarine | wlroots | Vulkan, Xwayland |
| **Crash Recovery** | greetd restarts | User must re-login | User must re-login | Process exits |

## Detailed Analysis

### Cage (RECOMMENDED for Kiosk)

Cage is a Wayland kiosk compositor explicitly designed to display a single,
maximized application. It provides no window management, no workspace switching,
no application launcher, and no keyboard shortcuts beyond what the running
application handles. This is ideal for MUTHUR OS kiosk mode because:

- Zero escape routes by design (no Alt+Tab, no Super key, no taskbar)
- Minimal attack surface (no compositor configuration to exploit)
- Sub-5MB memory footprint
- Handles webkit2gtk Wayland surface correctly
- greetd integration is trivial (single exec command)
- Active maintenance with stable API

**Limitations:** Cannot run alongside other applications. Not suitable as a
daily desktop compositor. No multi-monitor tiling.

### Hyprland (OPTIONAL for Desktop Use)

Hyprland is a modern dynamic tiling Wayland compositor with smooth animations,
rounded corners, and extensive customization. For users who want MUTHUR as ONE
application within their desktop environment:

- Window rules can force fullscreen + no decorations for MUTHUR
- Gap elimination on dedicated workspace provides immersive experience
- Animation system can be disabled per-window for MUTHUR
- Users retain access to other applications, browser, file manager

**Not recommended for kiosk because:**
- Complex configuration surface (many potential escape routes)
- Rapid development cycle introduces potential instability
- Unnecessary resource overhead for single-app deployment
- Animation engine wastes GPU cycles in kiosk mode
- Keyboard shortcuts (Super, Alt+Tab) break immersion

An optional Hyprland config is provided at:
`packaging/compositors/hyprland.conf`

### Sway (FALLBACK for Both)

Sway is a mature i3-compatible Wayland compositor. Conservative development
with battle-tested stability (7+ years, 84 releases).

- Can be configured for kiosk-like single-app mode (but cage is simpler)
- Excellent documentation and community support
- Predictable behavior with minimal surprises
- Lower resource usage than Hyprland

**When to use Sway over Cage:**
- If multi-window support is needed within the kiosk (e.g., MUTHUR + a status bar)
- If cage becomes unmaintained in the future
- If the user needs i3-compatible configuration familiarity

### Gamescope (NOT RECOMMENDED)

Gamescope is SteamOS's compositor designed for gaming (framerate control, FSR
upscaling, frame timing). It is architecturally unsuitable for web applications:

- Vulkan-centric rendering pipeline adds unnecessary overhead
- Designed for game windows, not webkit2gtk surfaces
- No proper window management for non-game applications
- Higher resource usage without corresponding benefit
- Xwayland dependency for non-native Wayland apps

## Final Verdict

| Deployment Mode | Recommended Compositor | Reason |
|-----------------|----------------------|--------|
| **Kiosk (sole UI)** | Cage | Purpose-built, minimal, secure |
| **Desktop (app within DE)** | Hyprland or Sway | User choice, both work |
| **Embedded/IoT** | Cage | Lowest resource footprint |
| **Gaming machine + MUTHUR** | Hyprland | Coexists with gaming workflows |

## Installation

```bash
# Kiosk (recommended)
pacman -S cage greetd

# Desktop - Hyprland
pacman -S hyprland
cp packaging/compositors/hyprland.conf ~/.config/hypr/muthur.conf
echo 'source = ~/.config/hypr/muthur.conf' >> ~/.config/hypr/hyprland.conf

# Desktop - Sway
pacman -S sway
# Add window rules to ~/.config/sway/config:
#   for_window [app_id="muthur-os-terminal"] fullscreen enable, border none
```
