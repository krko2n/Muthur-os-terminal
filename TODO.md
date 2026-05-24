# TODO List - MUTHUR OS Terminal

## Security Issues (From Audit)

### Not Yet Addressed

- [ ] **Issue #2 (High)**: Use of sudo in make install
  - Problem: Entire install script runs with root privileges
  - Solution: Refactor install.sh to use sudo only for specific commands
  - Files: `install-auto.sh`, `install.sh`
  - Priority: High

- [ ] **Issue #4 (Medium)**: Platform incompatibility
  - Problem: Linux-only support (no Windows/macOS)
  - Solution: Consider cross-platform support or document limitations clearly
  - Note: May be by design, not a bug
  - Priority: Medium

- [ ] **Issue #5 (Low)**: Dependency on GitHub CLI for bug reporting
  - Problem: report-error.sh requires gh CLI
  - Solution: Provide alternative simple bug report method (web form link)
  - Files: `report-error.sh`, README.md
  - Priority: Low

- [ ] **Issue #6 (Low)**: Rigid contribution guidelines
  - Problem: No-emoji policy and strict conventional commits may deter contributors
  - Solution: Soften guidelines or explain rationale better
  - Files: `CONTRIBUTING.md`, `NO_EMOJI_POLICY.md`
  - Priority: Low

## Features & Improvements

### High Priority

- [ ] Test AI model configuration system
  - Verify MUTHUR_AI_MODEL environment variable works
  - Verify config.toml file parsing works
  - Test fallback to default model
  - Update documentation if needed

- [ ] Verify CI/CD pipeline passes
  - Check GitHub Actions after recent changes
  - Ensure Rust compilation succeeds with new toml dependency
  - Test all build targets (AppImage, Deb, Binary)

### Medium Priority

- [ ] Improve banner visual quality
  - Text is hard to read against green grid
  - Consider adding text outline or stronger background
  - User feedback: text visibility issues

- [ ] Create proper macOS .icns file
  - Currently using PNG placeholder
  - Need actual .icns format for macOS builds

- [ ] Add example config.toml to repository
  - Create `examples/config.toml.example`
  - Document all available options
  - Add comments explaining each setting

- [ ] Security documentation improvements
  - Add example safe installation practices
  - Document privilege model in detail
  - Create security checklist for users

### Low Priority

- [ ] Consider changing icon color scheme
  - Current: cyan accent
  - Proposed: Matrix green (#00ff41) to match theme
  - User preference needed

- [ ] Local application testing
  - Build and run locally
  - Test all features work correctly
  - Verify AI integration with Ollama
  - Check terminal sessions, file explorer, system monitor

- [ ] Add automated security scanning
  - cargo audit in CI/CD
  - Dependabot for dependency updates
  - SAST tools integration

## Documentation

- [ ] Add SECURITY.md to CI/CD badge section
- [ ] Create troubleshooting guide for config.toml
- [ ] Document all environment variables
- [ ] Add architecture diagram showing config hierarchy
- [ ] Update DEVELOPMENT.md with security practices

## Testing

- [ ] Write tests for AI config loading
- [ ] Test environment variable precedence
- [ ] Test config file parsing errors
- [ ] Integration test for Ollama connection

## Known Issues

- Banner cached on GitHub - may take time to update
- Text visibility issue in banner against green grid background
- No Windows/macOS support (by design)

## Completed ✓

- [x] Issue #1 (Critical): Fixed unsafe curl | sh pattern
- [x] Issue #3 (Medium): Made AI model configurable (env var + config file)
- [x] Added SECURITY.md file
- [x] Updated README with secure installation practices
- [x] Added toml dependency for config parsing
- [x] Generated application icons from AI-generated geometric design
- [x] Fixed all Rust compilation errors (sysinfo 0.39, portable-pty 0.9)
- [x] Upgraded to latest dependency versions
- [x] Created banner for repository

## Notes

- No emojis anywhere (project policy)
- Matrix green theme: #00ff41
- Tauri v2 API (breaking changes from v1)
- Rust 1.95.0, Node.js 20.20.2
- Target: Linux (Arch, Ubuntu, Debian, Fedora)
