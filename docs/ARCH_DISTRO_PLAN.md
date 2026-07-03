# Arch Distro Plan: Installer Presets

This document defines installer presets for a future Muthur Arch Linux ISO.
Each preset is a curated package group that determines what gets installed.
The installer will present these as choices during setup.

## Design principles

- Terminal-only mode must always be installable without a display server.
- No preset requires AI, cloud, or network post-install (network needed only
  during install for package download).
- Each preset builds on the previous one (additive layers).
- The user can always choose "Custom Checklist" to pick individual groups.

---

## Presets

### 1. Bare Core

Minimal terminal-only installation. No display server, no GUI.

| Package Group      | Packages                                                    |
|--------------------|-------------------------------------------------------------|
| base               | base, base-devel, linux, linux-firmware                     |
| bootloader         | grub, efibootmgr                                           |
| network            | networkmanager, iwd                                        |
| shell              | bash, zsh, zsh-completions                                 |
| core-utils         | git, curl, less, man-db, htop, tree, neovim                |
| muthur-cli         | muthur-os-terminal-cli (planned: terminal-only CLI binary)  |

**Post-install state:** Boots to TTY login. User runs `muthur status`,
`muthur config show`, etc. from the shell. No graphical session.

---

### 2. Terminal + Session

Bare Core plus a Wayland compositor for running Muthur as a graphical
terminal in a lightweight session (no full desktop environment).

| Package Group      | Packages                                                    |
|--------------------|-------------------------------------------------------------|
| (inherits)         | All of Bare Core                                            |
| wayland            | wayland, xorg-xwayland                                     |
| compositor         | cage                                                        |
| session            | greetd, greetd-tuigreet                                    |
| gpu                | mesa, vulkan-icd-loader                                    |
| muthur-gui         | muthur-os-terminal (full Tauri app)                         |
| muthur-session     | muthur-session files, systemd service, desktop entry        |

**Post-install state:** Boots to greetd TUI login. Selecting "MUTHUR OS"
launches Cage with the Muthur app fullscreen.

---

### 3. Kiosk

Terminal + Session hardened for dedicated-hardware / signage use.
No user escape, no VT switching, no power key access.

| Package Group      | Packages                                                    |
|--------------------|-------------------------------------------------------------|
| (inherits)         | All of Terminal + Session                                   |
| kiosk-hardening    | (config-only, no extra packages)                            |

**Additional configuration:**
- logind.conf: NAutoVTs=0, HandlePowerKey=ignore
- sysctl: kernel.sysrq=0
- greetd: auto-login to muthur session
- Watchdog systemd service (`packaging/systemd/muthur-watchdog.service`)

**Post-install state:** Boots directly into Muthur fullscreen. No login
prompt, no escape keys, no VT switching. Recovery via GRUB or SSH only.

---

### 4. Desktop

Full desktop environment alongside Muthur for general-purpose use.

| Package Group      | Packages                                                    |
|--------------------|-------------------------------------------------------------|
| (inherits)         | All of Terminal + Session                                   |
| desktop-wm         | hyprland OR sway (user choice)                              |
| desktop-utils      | waybar, wofi, mako, swaylock, grim, slurp                  |
| desktop-apps       | foot, thunar, imv                                           |
| audio              | pipewire, pipewire-pulse, wireplumber                       |
| fonts              | ttf-share-tech-mono (bundled), noto-fonts, noto-fonts-emoji |
| theme              | (muthur GTK/Qt theme files, planned)                        |

**Post-install state:** Boots to greetd. User can pick Hyprland/Sway
session (general desktop) or MUTHUR session (focused terminal).
Muthur is available as a .desktop application in either session.

---

### 5. Full (AI-Ready)

Desktop preset plus optional AI tooling pre-configured.

| Package Group      | Packages                                                    |
|--------------------|-------------------------------------------------------------|
| (inherits)         | All of Desktop                                              |
| ai-runtime         | ollama                                                      |
| ai-models          | (none installed by default; user pulls via ollama)           |
| ai-config          | Pre-configured config.toml pointing to localhost:11434       |

**Post-install state:** Same as Desktop, but `ollama` service is enabled.
User can immediately use `muthur ai suggest` and AI chat panel in GUI.
AI remains optional -- disabling the ollama service does not break anything.

---

### 6. Custom Checklist

User manually selects from all available package groups:

| Group              | Description                                | Default |
|--------------------|--------------------------------------------|---------|
| base               | Linux base system                          | always  |
| bootloader         | GRUB + EFI                                 | always  |
| network            | NetworkManager + iwd                       | always  |
| shell              | zsh + completions                          | always  |
| core-utils         | git, curl, htop, neovim, etc.              | on      |
| muthur-cli         | Muthur CLI tools (terminal-only)           | on      |
| wayland            | Wayland display server                     | off     |
| compositor         | Cage (kiosk compositor)                    | off     |
| session            | greetd login manager                       | off     |
| gpu                | Mesa + Vulkan                              | off     |
| muthur-gui         | Muthur desktop app (Tauri)                 | off     |
| muthur-session     | Boot-to-Muthur session files               | off     |
| kiosk-hardening    | Lock down for dedicated hardware           | off     |
| desktop-wm         | Hyprland or Sway                           | off     |
| desktop-utils      | Waybar, wofi, mako, etc.                   | off     |
| desktop-apps       | File manager, image viewer, terminal       | off     |
| audio              | PipeWire audio stack                       | off     |
| fonts              | System fonts                               | off     |
| ai-runtime         | Ollama AI runtime                          | off     |

---

## Package group to repo mapping

| Group              | Source Repository                          |
|--------------------|--------------------------------------------|
| base               | core (official Arch)                       |
| bootloader         | core (official Arch)                       |
| network            | extra (official Arch)                      |
| shell              | extra (official Arch)                      |
| core-utils         | extra (official Arch)                      |
| wayland            | extra (official Arch)                      |
| compositor         | extra (official Arch: cage)                |
| session            | extra (official Arch: greetd)              |
| gpu                | extra (official Arch)                      |
| desktop-wm         | extra (official Arch)                      |
| desktop-utils      | extra (official Arch)                      |
| desktop-apps       | extra (official Arch)                      |
| audio              | extra (official Arch)                      |
| fonts              | extra (official Arch) + bundled            |
| ai-runtime         | AUR or official (ollama)                   |
| muthur-cli         | muthur repo (custom, planned)              |
| muthur-gui         | muthur repo (custom: PKGBUILD)             |
| muthur-session     | muthur repo (custom: session files)        |
| kiosk-hardening    | (config files only, no package)            |

---

## Installer flow (planned)

```
1. Boot ISO
2. Connect network (required for package download)
3. Select disk / partition
4. Choose preset:
   [ ] Bare Core
   [ ] Terminal + Session
   [ ] Kiosk
   [ ] Desktop
   [ ] Full (AI-Ready)
   [ ] Custom Checklist
5. Confirm package list
6. Install (pacstrap equivalent)
7. Configure (fstab, locale, bootloader, users)
8. Apply preset-specific configuration
9. Reboot
```

---

## Terminal-only guarantee

Presets 1 (Bare Core) and 6 (Custom with only CLI groups) produce a
system that:
- Has no display server
- Has no GUI dependencies (no GTK, no WebKit, no Mesa)
- Runs all `muthur` CLI commands locally
- Requires no network after install
- Requires no AI service
- Boots to TTY in under 5 seconds on modern hardware

This guarantee is non-negotiable across all future ISO work.

---

## Status

| Item                    | Status  |
|-------------------------|---------|
| Preset definitions      | done    |
| Package group mapping   | done    |
| Installer script        | planned |
| ISO build (archiso)     | planned |
| Custom muthur repo      | planned |
| muthur-cli package      | planned |
| Testing matrix          | planned |
