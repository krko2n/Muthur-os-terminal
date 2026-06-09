# MUTHUR OS - Kiosk Mode Setup

This document describes how to configure MUTHUR OS Terminal as a dedicated
kiosk environment where it becomes the sole user interface after boot.

## Prerequisites

- Arch Linux (or systemd-based distro)
- `cage` compositor: `pacman -S cage`
- `greetd` login manager: `pacman -S greetd`
- MUTHUR OS Terminal installed at `/usr/bin/muthur-os-terminal`

## Quick Setup

```bash
# 1. Enable MUTHUR autostart
sudo mother-ui enable

# 2. Apply kiosk hardening (OPTIONAL - locks down system)
sudo cp packaging/kiosk/muthur-kiosk.conf /etc/systemd/logind.conf.d/
sudo cp packaging/kiosk/99-muthur-kiosk.conf /etc/sysctl.d/
sudo sysctl --system
sudo systemctl restart systemd-logind

# 3. Disable TTY escape routes
sudo systemctl mask getty@tty{2,3,4,5,6}.service
sudo systemctl mask ctrl-alt-del.target

# 4. Reboot into kiosk
sudo reboot
```

## Restricted Shortcuts (After Hardening)

| Shortcut | Normal Function | Kiosk Status |
|----------|----------------|--------------|
| Ctrl+Alt+F1-F6 | Switch to TTY | DISABLED (NAutoVTs=0, getty masked) |
| Alt+SysRq+* | Kernel debug commands | DISABLED (kernel.sysrq=0) |
| Ctrl+Alt+Delete | Reboot system | DISABLED (ctrl-alt-del.target masked) |
| Alt+F4 | Close window | NO EFFECT (cage has no window management) |
| Super/Meta key | Open launcher | NO EFFECT (cage has no launcher) |
| Ctrl+Alt+Backspace | Kill X server | NO EFFECT (Wayland, not X11) |

## Architecture

```
systemd -> greetd (VT1, auto-login)
              |
         muthur-session (wrapper script)
              |
           cage -d (kiosk compositor, no decorations, no VT switch)
              |
        MUTHUR OS Terminal (fullscreen Tauri/webkit2gtk)
```

## Administrative Recovery

If you need to access the system outside MUTHUR:

### Method 1: GRUB Recovery Mode

1. Reboot the system
2. Hold SHIFT during boot to show GRUB menu
3. Select "Advanced options" -> "Recovery mode" (or append `single` to kernel params)
4. Root shell will appear
5. Reverse kiosk settings:

```bash
mount -o remount,rw /
rm /etc/systemd/logind.conf.d/muthur-kiosk.conf
rm /etc/sysctl.d/99-muthur-kiosk.conf
systemctl unmask getty@tty2.service
systemctl unmask ctrl-alt-del.target
mother-ui disable
reboot
```

### Method 2: SSH Access (if configured before lockdown)

```bash
ssh user@kiosk-machine
sudo mother-ui disable
sudo rm /etc/systemd/logind.conf.d/muthur-kiosk.conf
sudo rm /etc/sysctl.d/99-muthur-kiosk.conf
sudo reboot
```

### Method 3: Live USB

1. Boot from a live USB (Arch ISO)
2. Mount the root partition
3. Remove kiosk configuration files
4. Reboot into normal system

## Disabling Kiosk Mode

```bash
# Remove hardening configs
sudo rm /etc/systemd/logind.conf.d/muthur-kiosk.conf
sudo rm /etc/sysctl.d/99-muthur-kiosk.conf

# Restore TTY access
sudo systemctl unmask getty@tty{2,3,4,5,6}.service
sudo systemctl unmask ctrl-alt-del.target

# Disable autostart
sudo mother-ui disable

# Restore kernel params
sudo sysctl -w kernel.sysrq=1

# Restart logind
sudo systemctl restart systemd-logind
```

## Crash Recovery

If MUTHUR crashes during kiosk mode:

1. greetd detects session exit and restarts the session automatically
2. If repeated crashes occur (5 within 5 minutes), greetd falls back to its
   default session (greeter or TTY login)
3. The systemd watchdog service (`muthur-watchdog.service`) can optionally
   restart MUTHUR independently of greetd

## Security Notes

- The `HandlePowerKeyLongPress=poweroff` setting allows a PHYSICAL long-press
  of the power button (10+ seconds) to force shutdown. This is the hardware
  emergency escape and cannot be disabled in software.
- SSH access is NOT affected by kiosk lockdown. If sshd is running, remote
  administration remains available.
- The kiosk hardening is deliberate and manual. It is NEVER auto-applied by
  `mother-ui enable` to prevent accidental lockouts.
