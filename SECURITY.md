# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in MUTHUR OS Terminal, please report it by:

1. **DO NOT** open a public GitHub issue
2. Email the maintainers or create a private security advisory on GitHub
3. Include detailed steps to reproduce the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Security Best Practices

### Installation Security

**Never pipe remote scripts directly to shell**:
```bash
# BAD - Do not do this
curl https://example.com/install.sh | sh

# GOOD - Always inspect before executing
curl https://example.com/install.sh -o install.sh
cat install.sh  # Review the script
sh install.sh   # Run only if safe
```

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
- AI requests are sent to local Ollama instance (localhost:11434)
- No telemetry or data collection
- No external network calls except to configured Ollama endpoint

### Configuration Files

User configuration is stored in:
- `~/.config/muthur/config.toml` - User preferences
- `~/.config/xKOR_3RR0R/crash_reports/` - Local crash logs

These files never leave your machine.

### Dependencies

We use the latest stable versions of all dependencies:
- Tauri v2.0 (Rust security framework)
- Regular dependency updates via Dependabot
- Cargo audit for vulnerability scanning

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

## Security Checklist for Contributors

Before submitting code:
- [ ] No hardcoded credentials or secrets
- [ ] Input validation on all external data
- [ ] Use parameterized queries (if applicable)
- [ ] Follow Rust safety guidelines
- [ ] Run `cargo clippy` and `cargo audit`
- [ ] No unsafe code without justification
- [ ] Document security-relevant design decisions

## Acknowledgments

Security researchers who responsibly disclose vulnerabilities will be credited in release notes (with their permission).
