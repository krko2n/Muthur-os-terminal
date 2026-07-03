# GUI Contract

This document defines window behavior and GUI shell rules for the Muthur
desktop application. The GUI is optional -- terminal-only mode must remain
fully functional without any of these behaviors.

## Core rule

The backend (src-tauri, src/core, src/cli) must never depend on window
state, GUI shell presence, or display server availability. All backend
APIs must work identically whether the GUI is running or not.

GUI-specific logic belongs in:
- `src/components/` (React)
- Tauri window configuration (`tauri.conf.json`)
- Frontend-only event handlers

## Window modes

| Mode       | Description                                   | Default |
|------------|-----------------------------------------------|---------|
| fullscreen | Borderless fullscreen, no decorations         | yes     |
| windowed   | Resizable window with title bar               | no      |
| kiosk      | Locked fullscreen, no escape (session mode)   | no      |

The active mode is determined by:
1. `tauri.conf.json` defaults (fullscreen: true, decorations: false)
2. Runtime user action (keybind or command palette)
3. Packaging override (kiosk packaging sets kiosk mode)

## Window state transitions

```
fullscreen <-> windowed     F11 or Ctrl+Shift+F
windowed   --> minimized    platform minimize button or Ctrl+Shift+M
minimized  --> windowed     platform taskbar click or restore
windowed   --> maximized    platform maximize button or Ctrl+Shift+X
maximized  --> windowed     platform restore button or Ctrl+Shift+X
any        --> kiosk        only via config/packaging (no runtime toggle)
```

## Fullscreen behavior (default)

- Application launches fullscreen with no window decorations.
- No title bar, no system borders.
- The custom header component (`NativeHeader.tsx`) provides window
  identity and optional controls.
- Exit fullscreen via F11 or Ctrl+Shift+F to enter windowed mode.

## Windowed behavior

When in windowed mode:
- Window is resizable (minimum size: 800x600).
- Standard platform decorations are shown (title bar, close/min/max).
- Window position and size are not persisted across sessions (future task).
- Terminal panels reflow via ResizeObserver to match available space.

## Snap behavior

Snap zones follow platform conventions (no custom snap logic):
- Windows: Win+Arrow for half-screen snap
- Linux (tiling WMs): WM handles tiling natively
- Linux (floating WMs): EWMH snap hints are respected if available

Muthur does not implement its own snap engine. The application responds
to resize events from the platform; panels reflow automatically.

## Minimize behavior

- Minimizing hides the window to the taskbar/dock.
- Background processes (PTY sessions, system monitor) continue running.
- Audio is muted on minimize (if audio is playing).
- No tray icon is created by default (future task).

## Maximize behavior

- Maximizing fills the screen with decorations visible.
- Distinct from fullscreen: title bar remains, taskbar remains visible.
- Panels reflow to fill the maximized area.

## Panel switcher

The GUI shell supports internal panel switching:
- Panels (terminal, file explorer, browser, hardware inspector, games)
  can be focused, collapsed, or expanded within the window.
- Panel state is managed in React component state, not backend state.
- Panel layout does not affect backend behavior.
- Ctrl+Tab or a command palette switches focus between visible panels.

## Keyboard shortcuts (window management)

| Shortcut          | Action                          |
|-------------------|---------------------------------|
| F11               | Toggle fullscreen               |
| Ctrl+Shift+F      | Toggle fullscreen               |
| Ctrl+Shift+M      | Minimize window                 |
| Ctrl+Shift+X      | Toggle maximize                 |
| Ctrl+Tab          | Next panel                      |
| Ctrl+Shift+Tab    | Previous panel                  |
| Ctrl+Shift+Q      | Quit application                |

## Backend API rule

Backend commands (Tauri IPC, CLI commands, core services) must:
- Never check window state before responding.
- Never fail if no window exists.
- Never require a display server.
- Return the same data regardless of GUI presence.

Frontend may call Tauri window APIs (`appWindow.setFullscreen()`,
`appWindow.minimize()`, etc.) but these are presentation-layer only
and have no effect on backend state.

## Terminal-only mode

When running without the GUI shell:
- No window is created.
- No display server is needed.
- All core services (status, config, packages, security) work via CLI.
- PTY sessions run in the host terminal directly.
- This contract does not apply; window behavior is irrelevant.

## Kiosk mode

For dedicated hardware / digital signage deployments:
- Set via packaging configuration (`packaging/kiosk/`).
- Disables Alt+F4, Alt+Tab (where platform allows).
- No window decorations, no escape from fullscreen.
- Shutdown via CLI command or hardware button only.
- Kiosk mode is a packaging decision, not a runtime toggle.
