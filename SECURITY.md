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

The source installer can install system packages and toolchains. Review it before running:

```bash
./install.sh --dry-run
./install.sh --no-deps
./install.sh --prefix "$HOME/.local"
```

The installer may call distro package managers and, unless dependencies already exist or `--no-deps` is used, may download Rust/Node tooling from their upstream installers. Optional Ollama/offline-AI setup can be skipped with `--no-ollama`.

### Privilege Management

MUTHUR follows the principle of least privilege:

- Installation scripts run with user privileges by default
- `sudo` is only invoked for specific operations that require it:
  - Copying binary to `/usr/local/bin/`
  - Creating system-wide desktop entries
- You will be prompted before any elevated privilege operation

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

### Data Privacy

- All terminal data remains local on your machine
- AI chat requests are sent to the configured Ollama endpoint, which defaults to `http://localhost:11434`
- No telemetry or data collection
- The built-in web browser, AI `web`/`fetch` commands, globe feeds, installer, and optional offline-pack downloads make external network requests only when those features are used
- Backend fetch commands allow only `http://` and `https://`; `file://`, `javascript:`, `data:`, `ftp://`, and similar schemes are rejected
- Localhost and private IP fetch targets are blocked by default. Set `MUTHUR_ALLOW_PRIVATE_FETCH=1` only if you intentionally want internal network fetches

### Filesystem Access

The file manager is limited by default to user, app, and offline-pack folders. Hidden dotfiles are hidden by default.

Overrides:

```bash
MUTHUR_ALLOW_FULL_FS=1 muthur
MUTHUR_SHOW_HIDDEN_FILES=1 muthur
```

Use these only when you want broader local filesystem visibility.

### Configuration Files

User configuration is stored in:
- `~/.config/muthur/config.toml` - User preferences
- `~/.config/xKOR_3RR0R/crash_reports/` - Local crash logs

These files never leave your machine.

### Dependencies

Dependencies are pinned through `package-lock.json` and `src-tauri/Cargo.lock`. Contributors should run the project checks before submitting changes:

```bash
npm run lint
npm run format:check
npm run test
npm run version:check
cargo fmt -- --check
cargo clippy --all-targets --all-features -- -D warnings
```

### Build Security

Production builds use:
- LTO (Link-Time Optimization)
- Strip symbols
- Panic abort (no unwinding)
- Code signing (planned)

## Known Limitations

- Linux only (Arch, Ubuntu, Debian, Fedora tested)
- Requires local Ollama installation for AI features
- No sandboxing for terminal sessions (runs with user privileges)
- Browser/search/globe features are not anonymous; requests go to the remote sites they access
- Offline wiki/map/model packs can be large and are user-approved downloads

## Security Checklist for Contributors

Before submitting code:
- [ ] No hardcoded credentials or secrets
- [ ] Input validation on all external data
- [ ] Use parameterized queries (if applicable)
- [ ] Follow Rust safety guidelines
- [ ] Run `npm run lint`, `npm run test`, `cargo fmt`, `cargo clippy`, and vulnerability/audit tooling where available
- [ ] No unsafe code without justification
- [ ] Document security-relevant design decisions

## Acknowledgments

Security researchers who responsibly disclose vulnerabilities will be credited in release notes (with their permission).
