# Core Repo Structure Audit

Status: Done  
Task: Audit Core Repo Structure  
Repository audited: `krko2n/Muthur-os-terminal`  
Roadmap repository label: `muthur-core`  
Audit date: 2026-07-03  
Change type: documentation only

## Validation

- Audit document exists: `docs/AUDIT_CORE_REPO_STRUCTURE.md`
- No source files were changed for this task.
- This audit is safe to use as the completion artifact for the roadmap item `Audit Core Repo Structure`.

## Scope

This audit checks the current online GitHub repository structure and records what already exists, what is clean, and what should be separated before the next core roadmap tasks start.

The connected GitHub installation exposes `krko2n/Muthur-os-terminal`. No separate online repository named `muthur-core` was visible through the connected GitHub app during this audit. For now, this document treats the current terminal repository as the active core source until the project is split into separate `muthur-core`, `muthur-gui`, `muthur-iso`, `muthur-legacy`, and `muthur-packages` repositories.

## Current repository role

The repository is currently a full desktop terminal application, not a small isolated core library. It combines:

- Rust / Tauri backend
- React / TypeScript frontend
- terminal session handling
- local AI integration
- system monitoring
- built-in browser / fetch features
- offline pack inspection
- file explorer access
- installer and packaging scripts
- kiosk / compositor integration
- documentation and examples

This is acceptable for the current app stage, but the roadmap should treat it as a monorepo-style application until the core boundaries are separated.

## Observed top-level structure

Expected high-level areas:

```text
/
├── README.md
├── DEVELOPMENT.md
├── package.json
├── install.sh
├── docs/
├── examples/
├── scripts/
├── packaging/
├── src/
└── src-tauri/
```

### Root files

- `README.md` is the main user-facing document.
- `DEVELOPMENT.md` explains architecture, development setup, project structure, IPC commands, and styling guidance.
- `package.json` defines the Node/Vite/Tauri project metadata and scripts.
- `install.sh` is a small wrapper that forwards to the real installer under `scripts/`.

### Frontend area

Path: `src/`

The frontend is a React 19 + TypeScript + Vite app. It contains panelized UI components, including terminal, side panels, bottom panel, command palette, first-run setup, shutdown screen, custom cursor, and visual system UI.

Current frontend role:

- render the MUTHUR interface
- host the terminal component
- request backend data through Tauri commands
- store interface settings locally
- manage layout and panel state
- expose GUI controls for settings, offline pack, AI, and shutdown

### Backend area

Path: `src-tauri/`

The backend is a Rust / Tauri application. Current backend modules include:

```text
src-tauri/src/
├── main.rs
├── ai.rs
├── ascii_image.rs
├── browser.rs
├── crash.rs
├── pty.rs
└── system.rs
```

Current backend role:

- create and manage terminal sessions
- write and resize PTY sessions
- collect system stats
- talk to local Ollama
- search offline wiki/docs context
- validate and fetch HTTP/HTTPS URLs
- block unsafe URL schemes and local/private network fetches by default
- browse local files inside safer default roots
- inspect offline pack state
- render remote images as ASCII
- expose hardware and network status

### Packaging and installer area

Path examples:

```text
install.sh
scripts/
packaging/
```

Current role:

- install dependencies
- build the project
- install binaries and desktop/session integration
- provide kiosk/session helper scripts
- support safer installer modes such as dry-run and no-deps flows

### Documentation area

Path: `docs/`

Current role:

- project explanations
- comparison/report documents
- now includes this audit artifact

## Existing strengths

1. The project has a clear modern stack: Rust/Tauri backend and React/TypeScript/Vite frontend.
2. Backend modules already separate several major concerns: PTY, AI, browser parsing, image conversion, crash handling, and system monitoring.
3. The frontend is already split into components instead of being one giant page.
4. `package.json` already contains useful scripts for linting, formatting checks, installer checks, smoke tests, audits, build, preview, and Tauri development.
5. Network fetching has explicit scheme validation and blocks local/private network targets unless intentionally overridden.
6. File browsing has safer default boundaries and requires an override for full filesystem access.
7. The root `install.sh` delegates to `scripts/install.sh`, which keeps the root cleaner.
8. README and DEVELOPMENT docs already explain the product, requirements, project structure, usage, and development workflow.

## Structural risks and gaps

### 1. Core is not isolated yet

The current repository is still a complete application. It does not yet expose a clean `muthur-core` package boundary.

Impact:

- CLI, backend commands, GUI calls, installer logic, and product behavior can become tightly coupled.
- Future package system work may accidentally depend on GUI internals.

Recommended direction:

- Keep the current app working.
- Add a clear core layer before adding package manifest and permission logic.
- Treat `src-tauri/src/` as the first place to define core service boundaries.

### 2. `main.rs` is carrying too many responsibilities

`src-tauri/src/main.rs` currently contains command registration plus URL validation, fetch handling, filesystem validation, offline pack inspection, render profile logic, hardware/network helpers, and tests.

Impact:

- Future `status`, `config`, `package manifest`, and `permissions` logic will make `main.rs` harder to maintain.
- It becomes harder to test core behavior independently from Tauri wiring.

Recommended direction:

Split backend logic over time into modules such as:

```text
src-tauri/src/
├── commands.rs
├── config.rs
├── status.rs
├── permissions.rs
├── package_manifest.rs
├── fetch_policy.rs
├── filesystem_policy.rs
├── offline_pack.rs
└── render_profile.rs
```

Do not do this during the audit task. This belongs to later implementation tasks.

### 3. CLI command boundary is not clear yet

The roadmap expects future CLI behavior such as:

- `muthur --help`
- `muthur status`
- config inspection commands

The current app is primarily a Tauri desktop application with helper commands and scripts. A dedicated CLI skeleton is not documented as a stable boundary yet.

Impact:

- Future CLI commands may be added in a scattered way.
- Business logic could end up inside CLI argument handlers instead of reusable backend services.

Recommended direction:

- Add a CLI help skeleton as the next task.
- Keep CLI handlers thin.
- Put real logic into backend/core services.

### 4. Status backend service is not isolated yet

System stats already exist, but a stable `status` service boundary is not visible as a separate backend service.

Impact:

- GUI and CLI may duplicate status logic.

Recommended direction:

- Create a reusable status service.
- Let both GUI and CLI call the same backend/service logic.
- Keep presentation formatting outside the service.

### 5. Local config is partially documented but should become a real core contract

README documents a user config file at `~/.config/muthur/config.toml`. The project already depends on `toml` in Rust. However, config handling should become a formal core service before package and permission work expands.

Recommended direction:

- Define config path resolution.
- Define default config values.
- Define malformed config errors.
- Add clear `config show` behavior.

### 6. Package manifest and permission system are not present as core contracts yet

The roadmap includes package manifest schema and known package permissions. These should not be hardcoded into GUI components.

Recommended direction:

- Add a package manifest schema under docs/examples first.
- Add Rust validation logic later.
- Add known permission names in one central registry.
- Unknown permissions must fail clearly.

### 7. Docs may drift from implementation

README and DEVELOPMENT are useful, but as the app evolves, file names and component names can drift. This is normal, but it needs periodic checking.

Recommended direction:

- Keep `DEVELOPMENT.md` updated after structural changes.
- Add a lightweight docs check to the roadmap if drift becomes common.

## Recommended next task order

After this audit, the next safe order is:

1. Implement CLI Help Skeleton
2. Create Status Backend Service
3. Read Local Config
4. Create Package Manifest Schema
5. Define Known Package Permissions
6. Document Window Behavior
7. Prototype GUI Status Panel

Reason:

- CLI help establishes user-facing command shape.
- Status service prevents CLI/GUI logic duplication.
- Config service gives later package/permission features stable settings.
- Package manifest and permission work should happen after the core boundaries are clearer.

## Done criteria result

Roadmap item: `Audit Core Repo Structure`

Result: Done

Evidence:

- This audit document exists in `docs/AUDIT_CORE_REPO_STRUCTURE.md`.
- The audit records current structure, strengths, risks, and next-step ordering.
- Only documentation was added for this task.
- No source code files were intentionally changed.

## Final note

This audit should not be treated as proof that `muthur-core` has already been split into its own repository. It only confirms that the currently connected online repository has been audited and that the roadmap can move from audit into implementation tasks.
