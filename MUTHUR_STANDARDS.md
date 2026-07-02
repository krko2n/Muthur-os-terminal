# MUTHUR Development Standards

## Project Rules

1. No emojis anywhere in code, UI, documentation, or commits.
2. Terminal-only mode must work without GUI, AI, cloud, or network.
3. Linux-first. No Windows-specific features.
4. Rust backend uses rustls-tls (no native TLS).
5. All changes must pass CI (clippy -D warnings, tsc --noEmit, smoke tests).
6. Commit and push immediately after completing work.
7. Never duplicate backend logic between terminal and GUI.

## Directory Structure

```
src/
  core/       - UI-agnostic shared logic (no React, no Tauri imports)
  cli/        - Terminal-only mode entry point and utilities
  config/     - Configuration loading and typed defaults
  packages/   - Optional self-contained feature modules
  wiki/       - Built-in offline help content
  security/   - Command safety, sanitization, permissions
  components/ - React GUI components (not required for terminal mode)
src-tauri/    - Rust backend (PTY, system, browser, AI, crash handling)
docs/         - Project documentation
tests/        - Test suite (unit, integration, smoke)
examples/     - Example configs and usage
scripts/      - Build, install, and CI helper scripts
packaging/    - Linux packaging, kiosk, desktop entries
public/       - Static assets (audio, fonts, data, keyboards)
```

## Code Style

- TypeScript strict mode, no `any` unless unavoidable.
- Rust: `cargo fmt` + `cargo clippy -D warnings`.
- Frontend: Tailwind CSS, no inline styles.
- Font: Share Tech Mono.
- Color: Green CRT (#00ff41 primary, #aacfd1 foreground).

## Testing

- `npm test` - smoke tests
- `npm run lint` - TypeScript type check
- Tests must not require network or GUI.

## Dependencies

- Minimize external dependencies.
- No cloud-dependent services as hard requirements.
- AI (Ollama) is optional - app must function without it.
