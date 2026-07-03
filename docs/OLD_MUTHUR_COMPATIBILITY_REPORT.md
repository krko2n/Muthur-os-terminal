# Old Muthur Compatibility Report

This document maps legacy Muthur commands, internal APIs, and shell scripts
to their new equivalents in the current architecture. It serves as a
migration guide and deprecation tracker.

## Migration phases

| Phase | Scope                                  | Status    |
|-------|----------------------------------------|-----------|
| 1     | Inventory old commands and map names   | current   |
| 2     | Add CLI aliases for deprecated names   | planned   |
| 3     | Emit deprecation warnings on old names | planned   |
| 4     | Remove old names (breaking)            | future    |

Phase 2 will preserve old names temporarily by routing them to new
implementations. Phase 3 adds visible warnings. Phase 4 removes them
after at least one release cycle with warnings active.

---

## Shell scripts (packaging/bin/)

| Old Name      | Purpose                                 | New Equivalent          | Status      |
|---------------|-----------------------------------------|-------------------------|-------------|
| kys           | Shutdown with countdown + fallbacks     | muthur shutdown (planned) | keep as-is |
| muthur-ui     | Enable/disable autostart (greetd, DM)   | muthur autostart (planned) | keep as-is |

These scripts are standalone and do not conflict with the new CLI.
They will remain available until new CLI commands replace them.

---

## Tauri IPC commands (src-tauri/src/main.rs)

These are the Rust backend commands callable via `invoke()` from the GUI.
The new CLI does not call these directly -- it uses core services instead.

| Old IPC Command          | Purpose                           | New CLI Equivalent           | Deprecated |
|--------------------------|-----------------------------------|------------------------------|------------|
| create_terminal_session  | Start a PTY session               | muthur shell (planned)       | no         |
| write_to_terminal        | Send input to PTY                 | (direct PTY in CLI mode)     | no         |
| resize_terminal          | Resize PTY dimensions             | (automatic in CLI mode)      | no         |
| close_terminal_session   | End a PTY session                 | (exit shell)                 | no         |
| get_system_stats         | CPU/mem/disk/network/uptime        | muthur status                | no         |
| get_hardware_info        | Manufacturer/model/chassis         | muthur status (extended)     | no         |
| get_network_connections  | Active network connections         | muthur status --network      | no         |
| list_directory           | File listing for explorer          | ls (direct shell)            | no         |
| get_current_dir          | Working directory                  | pwd (direct shell)           | no         |
| get_offline_pack_status  | Offline data pack info             | muthur package inspect       | no         |
| detect_editor            | Find available text editor         | $EDITOR / muthur config show | no         |
| open_file_external       | Open file in system editor         | (direct shell: $EDITOR file) | no         |
| get_render_profile       | GPU renderer detection             | (GUI-only, no CLI equiv)     | no         |
| ai_suggest_command       | Ollama command suggestion           | muthur ai suggest (planned)  | no         |
| ai_chat                  | Ollama chat session                 | muthur ai chat (planned)     | no         |
| cancel_ai_request        | Cancel in-progress AI request       | (Ctrl+C in CLI)              | no         |
| search_offline_wiki      | Search bundled wiki content         | muthur wiki search           | no         |
| get_ai_status            | Check Ollama availability           | muthur ai status (planned)   | no         |
| fetch_json               | HTTP JSON fetch (proxy)             | curl (direct shell)          | no         |
| fetch_url                | HTTP text fetch (browser proxy)     | curl (direct shell)          | no         |
| fetch_url_structured     | HTML-to-structured-text fetch       | (GUI-only browser feature)   | no         |
| render_image_ascii       | Image to braille ASCII art          | muthur render (planned)      | no         |
| render_image_color_ascii | Color ASCII art rendering           | muthur render --color        | no         |

### Rules

- IPC commands remain stable for the GUI. They are not deprecated.
- The CLI never calls Tauri IPC. It uses `src/core/` services directly.
- Backend logic lives in Rust (src-tauri/src/). The CLI accesses
  equivalent data through Node.js `src/core/` services to avoid
  requiring the Tauri runtime.
- AI commands are optional. They require a running Ollama instance.

---

## GUI internal events

| Event Name        | Purpose                          | CLI Equivalent    | Notes              |
|-------------------|----------------------------------|-------------------|--------------------|
| terminal-command  | Send command to active shell     | (type directly)   | GUI-only dispatch  |
| open-file         | Open file in editor tab          | $EDITOR <file>    | GUI-only           |
| open-game         | Launch embedded game             | (no CLI equiv)    | GUI-only           |
| cwd-change        | Track working directory changes  | (shell handles)   | GUI-only           |

These events are internal to the React GUI and have no CLI equivalents.
They will not be deprecated since they serve the GUI interaction model.

---

## URL schemes

| Scheme           | Purpose                  | CLI Equivalent      |
|------------------|--------------------------|---------------------|
| muthur://manual  | Offline documentation    | muthur wiki open    |

---

## CLI command mapping (old names -> new names)

For users coming from early prototypes or who type muscle-memory commands:

| Old / Intuitive Name   | New Canonical Name       | Phase | Notes                  |
|------------------------|--------------------------|-------|------------------------|
| muthur info            | muthur status            | 2     | alias planned          |
| muthur sysinfo         | muthur status            | 2     | alias planned          |
| muthur conf            | muthur config show       | 2     | alias planned          |
| muthur settings        | muthur config show       | 2     | alias planned          |
| muthur help            | muthur --help            | 2     | already works          |
| muthur version         | muthur --version         | 2     | already works          |
| muthur perms           | muthur permissions list  | 2     | alias planned          |
| muthur pkg             | muthur package inspect   | 2     | alias planned          |
| muthur wiki            | muthur wiki search       | 2     | alias planned          |
| muthur doctor          | muthur doctor            | -     | new (no old equiv)     |
| muthur shell           | muthur shell             | -     | new (no old equiv)     |

---

## Deprecation policy

1. Old names are accepted silently in Phase 2.
2. In Phase 3, old names print a one-line warning:
   `muthur: 'info' is deprecated, use 'status' instead.`
3. In Phase 4, old names are removed and return an error with guidance.
4. Each phase lasts at least one version release before advancing.

---

## Terminal-only mode

All mappings above preserve terminal-only usability:
- No GUI, AI, cloud, or network is required for any mapped command.
- AI commands are explicitly optional and fail gracefully if Ollama is absent.
- Shell scripts (kys, muthur-ui) remain standalone and work without
  the Tauri app running.

---

## Notes

- This report is based on the codebase at version 0.1.1.
- IPC commands are listed for reference but are not being renamed.
- The CLI and GUI share core services (src/core/) but never share
  runtime dependencies (Tauri invoke vs Node.js direct).
