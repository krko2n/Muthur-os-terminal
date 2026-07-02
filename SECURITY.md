# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | Supported |

## Reporting a Vulnerability

If you discover a security vulnerability in MUTHUR OS Terminal, please report it by:

1. **DO NOT** open a public GitHub issue
2. Email the maintainers or create a private security advisory on GitHub
3. Include detailed steps to reproduce the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Security Best Practices

### Installation Security

The source installer can install system packages, build the app, write launchers,
write session files, enable/start services, and add the user to the `seat` group.
Review the plan before running:

```bash
./install.sh --dry-run
./install.sh --no-deps
./install.sh --no-ollama
./install.sh --prefix "$HOME/.local"
```

`--prefix "$HOME/.local"` is the safest user-level install path. It skips
system session files and system command links.

In interactive mode, the installer shows and asks before privileged operation
categories such as system package installation, writes under `/usr/bin`,
`/usr/local`, or `/usr/share`, service enable/start, and adding the user to a
group.

`--dry-run` prints the privileged operations that may be requested and exits
before making changes.

`--quiet` does not allow privileged system changes by default. Automation that
intentionally needs those changes must set:

```bash
MUTHUR_ALLOW_PRIVILEGED_INSTALL=1 ./install.sh --quiet
```

The generated launcher also prompts before runtime package, service, group, or
`/run/user` fixes. Non-interactive launcher use must opt in explicitly:

```bash
MUTHUR_LAUNCHER_ALLOW_PRIVILEGED=1 muthur
```

Running the installer as root is blocked on installed systems. Root is allowed in
CI, containers, live ISO sessions, and similar disposable environments because
those workflows commonly have no normal user elevation path and the environment
is expected to be rebuilt.

Optional Ollama/offline-pack setup remains voluntary. The Ollama upstream
installer may request its own privilege escalation; review that prompt before
accepting.

### AI Model Configuration

AI model selection is configurable without rebuilding:

1. **Environment variable** (highest priority):
   ```bash
   export MUTHUR_AI_MODEL=llama3.2
   ```

2. **Config file** `~/.config/muthur/config.toml`:
   ```toml
   [ai]
   model = "llama3.2"
   base_url = "http://localhost:11434"
   ```

3. **Default**: `llama3.2` if not configured

### AI Command Safety

AI command help is a suggestion workflow:

- AI may suggest a command
- The command is displayed before use
- Known dangerous command patterns are flagged
- Dangerous queued commands require explicit confirmation before MUTHUR sends
  them to the terminal

The classifier covers common high-risk patterns such as `rm -rf`, `mkfs`, `dd`,
fork bombs, `chmod -R 777`, `chown -R`, `sudo`, package install/remove commands,
service start/stop/enable commands, disk tools, and curl/wget piped into a
shell. This is a safety layer, not a sandbox or complete command verifier.

### Data Privacy

- All terminal data remains local on your machine
- AI chat requests are sent to the configured Ollama endpoint, which defaults to `http://localhost:11434`
- No telemetry or data collection
- The built-in web browser, AI `web`/`fetch` commands, globe feeds, installer, and optional offline-pack downloads make external network requests only when those features are used
- Backend fetch commands allow only `http://` and `https://`; `file://`, `javascript:`, `data:`, `ftp://`, and similar schemes are rejected
- Localhost, private IP targets, and hostnames that resolve to local/private addresses are blocked by default. Redirect targets are rechecked before they are followed. Set `MUTHUR_ALLOW_PRIVATE_FETCH=1` only if you intentionally want internal network fetches

### Filesystem Access

The file manager is limited by default to user, app, and offline-pack folders. Hidden dotfiles are hidden by default.

Overrides:

```bash
MUTHUR_ALLOW_FULL_FS=1 muthur
MUTHUR_SHOW_HIDDEN_FILES=1 muthur
```

Use these only when you want broader local filesystem visibility.

### Tauri Asset Protocol

The Tauri asset protocol is enabled for local app/offline functionality, but it
is not allowed to read arbitrary filesystem paths. The scope is restricted to
resource, app-data, app-config, local offline-pack, MUTHUR config, and MUTHUR
crash/log data locations.

The previous broad `["**"]` scope is not acceptable unless a future change
documents a specific need and adds compensating path validation.

### Configuration Files

User configuration is stored in:
- `~/.config/muthur/config.toml` - User preferences
- `~/.config/xKOR_3RR0R/crash_reports/` - Local crash logs

These files never leave your machine.

### Dependency Audits

Dependencies are pinned through `package-lock.json` and `src-tauri/Cargo.lock`.
Dependabot monitors npm, Cargo, and GitHub Actions dependencies weekly.

Run these checks before security-sensitive changes:

```bash
npm ci --legacy-peer-deps
npm run lint
npm run format:check
npm run installer:check
npm run test
npm run version:check
npm run audit:npm
npm run audit:cargo
npm run audit:cargo-deny
npm run audit
npm run build

cd src-tauri
cargo test --no-fail-fast
cargo fmt -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo audit
cargo deny check
```

`npm run audit:npm` runs `npm audit --audit-level=moderate`.
`npm run audit:cargo` runs `cargo audit` from `src-tauri`.
`npm run audit:cargo-deny` runs `cargo deny check` from `src-tauri`.
`npm run audit` runs all three audit checks.

The CI security-audit job installs npm dependencies using the existing lockfile
flow, installs `cargo-audit` and `cargo-deny` if needed, then runs the npm,
Rust advisory, and cargo-deny checks. Audit failures are not ignored. OSV scan
is not mandatory yet; it can be added later if it stays reliable and low
maintenance.

### Build Security

Production builds use:
- LTO (Link-Time Optimization)
- Strip symbols
- Panic abort (no unwinding)
- Code signing (planned)

## Known Limitations

- Linux only (Arch, Ubuntu, Debian, Fedora tested)
- Requires local Ollama installation for AI features
- No sandboxing for terminal sessions; commands run with user privileges
- AI command detection is incomplete and is not a security boundary
- Browser/search/globe features are not anonymous; requests go to the remote sites they access
- Offline wiki/map/model packs can be large and are user-approved downloads
- Installer privilege prompts reduce surprise but cannot make third-party package manager or upstream installer behavior risk-free
- Future asset protocol entry points must keep validating and constraining local paths

## Security Checklist for Contributors

Before submitting code:
- [ ] No hardcoded credentials or secrets
- [ ] Input validation on all external data
- [ ] Use parameterized queries (if applicable)
- [ ] Follow Rust safety guidelines
- [ ] Run `npm run lint`, `npm run test`, `cargo fmt`, `cargo clippy`, and vulnerability/audit tooling where available
- [ ] Run `npm run audit` or document why the environment could not run it
- [ ] Terminal command paths do not auto-run generated dangerous commands
- [ ] No unsafe code without justification
- [ ] Document security-relevant design decisions

## Acknowledgments

Security researchers who responsibly disclose vulnerabilities will be credited in release notes (with their permission).
