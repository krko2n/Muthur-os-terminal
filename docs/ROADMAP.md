# Muthur Roadmap

Status as of 2026-11-25. Current version: 0.1.1.

The desktop GUI (Tauri + React) is feature-complete for its first scope. The
terminal-only CLI, offline packages, and Arch distro work are early. Each phase
below is small, testable, and keeps terminal-only mode usable without GUI, AI,
cloud, or network.

## Phase 1: Stabilize (in progress)

Goal: CI green on `main`, and a CLI that can actually be built and run.

- [x] Clear `npm audit` advisories (lockfile-only update).
- [x] Refresh README stats so `check:readme-stats` passes.
- [x] CLI returns its exit code (`muthur bogus` now exits 1).
- [x] `npm run build:cli` builds `dist-cli/muthur.mjs`; `bin` entry `muthur`.
- [x] Runtime CLI test: build and execute the CLI inside `npm test`.
- [ ] Re-run or close the stale Dependabot PRs once `main` is green.

## Phase 2: CLI command coverage

Goal: every planned command group has a working first command. Logic lives in
`src/core` (or `src/security`, `src/packages`) and the CLI handler stays thin.

- `muthur doctor`: local environment checks (shell, editor, config, optional
  Ollama reachability reported as optional, never as failure).
- `muthur config validate`: validate the config file against typed defaults.
- `muthur package inspect <dir>` / `package validate <dir>`: reuse
  `src/packages/manifest.ts`.
- `muthur permissions list` / `permissions check <cmd>`: reuse
  `src/security/permissions.ts` and the command safety classifier.
- `muthur wiki search <term>`: offline search over `src/wiki` and pack wiki data.
- Phase 2 aliases from `OLD_MUTHUR_COMPATIBILITY_REPORT.md` (`info`, `sysinfo`,
  `conf`, `perms`, `pkg`).

## Phase 3: Installable terminal-only mode

Goal: `muthur` works from a TTY after install, with no display server.

- Installer copies `dist-cli/muthur.mjs` to `/usr/local/bin/muthur`.
- Split PKGBUILD into `muthur-os-terminal-cli` (Node runtime only) and
  `muthur-os-terminal` (GUI).
- Decide long-term CLI runtime: keep Node, or move core services into a Rust
  crate shared by the Tauri backend and a native CLI binary. Record the
  decision before starting the move.

## Phase 4: GUI hardening

- Confirmation step before AI auto-executes a command.
- Route GUI status panel and Rust stats through the same core contract (no
  duplicated logic).
- Split `src-tauri/src/main.rs` (1,257 lines) into modules.
- Lazy-load the globe/Three.js chunk (2.2 MB) so startup is lighter.
- Rust unit tests for PTY batching, browser HTML parsing, ASCII rendering.
- Session persistence, split panes, configurable themes.

## Phase 5: Offline content packs

- Package loader shared by CLI and GUI.
- Replace survival pack placeholders with real, licensed offline content.
- Make the example terminal game runnable via `muthur package run` (gated by
  package permissions).

## Phase 6: Arch ISO

- `archiso` profile implementing the presets in `ARCH_DISTRO_PLAN.md`.
- Automated VM smoke run following `VM_TESTING_GUIDE.md`.

## Phase 7: Release 0.2.0

- Version bump, changelog, release artifacts (AppImage, deb, Arch package).
