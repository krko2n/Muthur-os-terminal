# CLAUDE.md - AI Assistant Instructions

This file contains instructions and context for AI assistants working on the MUTHUR OS Terminal project.

## Session Start Protocol

At the beginning of every session, read these files in order:

1. **TODO.md** - Current tasks, priorities, and project status
2. **CLAUDE.md** (this file) - AI-specific instructions and context
3. **PROJECT_SUMMARY.md** - High-level project overview
4. **SECURITY.md** - Security considerations and requirements
5. **CONTRIBUTING.md** - Development guidelines and standards

## Project Context

**Project**: MUTHUR OS Terminal - A cinematic terminal emulator inspired by the MU/TH/UR 6000 computer from Alien (1979)

**Technology Stack**:
- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Rust, Tauri v2
- AI Integration: Ollama (llama3.2 default)
- Platform: Linux (Arch, Ubuntu, Debian, Fedora)
- Node.js: 24.x (LTS)
- Rust: 1.95.0

**Key Directories**:
- `src/` - React frontend components
- `src-tauri/src/` - Rust backend code
- `examples/` - Configuration templates
- `.github/workflows/` - CI/CD pipelines

## Project Standards

### Code Style
- **No emojis** - Strict no-emoji policy in code, commits, and documentation
- **No comments** - Write self-documenting code; only comment non-obvious WHY
- **Minimal abstractions** - No premature optimization or unnecessary helpers
- **Security first** - Validate at boundaries, avoid OWASP top 10 vulnerabilities

### Git Workflow
- **Never** run destructive git commands without user confirmation
- **Never** skip hooks (--no-verify) unless explicitly requested
- **Never** amend commits unless explicitly requested
- **Always** create new commits rather than amending
- Commit messages: Follow conventional commits style from git log
- Use descriptive commit messages focusing on "why" not "what"

### Build & CI/CD
- CI/CD uses GitHub Actions with ubuntu-22.04 runners
- Build requires xvfb for headless graphics initialization
- OpenGL/Mesa dependencies required for Tauri builds
- Node.js 24 required (GitHub Actions deprecation compliance)

## Current Known Issues

1. **Banner visibility** - Text hard to read against green grid background (low priority)
2. **No Windows/macOS support** - Linux-only by design
3. **Platform incompatibility** - May expand cross-platform support later (medium priority)

## Configuration System

AI model selection priority:
1. `MUTHUR_AI_MODEL` environment variable
2. `~/.config/muthur/config.toml` [ai] model setting
3. Default: "llama3.2"

See `examples/config.toml.example` for full configuration template.

## Security Requirements

- Install scripts must refuse to run as root
- Use sudo only for specific privileged operations
- Never commit secrets or credentials
- Validate user input at system boundaries
- No unsafe curl | sh patterns

## Session End Protocol

When the user says goodbye or ends the session:
1. Review TODO.md and update any completed tasks
2. Save important session context to memory:
   - New features or bugs discovered
   - Design decisions made
   - User preferences expressed
   - Incomplete tasks or blockers
   - Important context for next session

## Memory Guidelines

Save to memory when you learn:
- **User preferences** - How the user wants to work, their expertise level
- **Project decisions** - Why certain approaches were chosen
- **Feedback** - What worked well or didn't work
- **Ongoing work** - Important context about incomplete tasks

Don't save to memory:
- Code patterns (derive from codebase)
- Git history (use git log)
- Transient task details
- Information already in documentation

## Development Commands

```bash
make dev           # Run development server
make build         # Build production binary
make test          # Run test suite
make install       # Install application
make clean         # Clean build artifacts
```

## Common Tasks

### Adding New Features
1. Check TODO.md for priorities
2. Update relevant components in src/ or src-tauri/src/
3. Test locally with `make dev`
4. Update documentation if needed
5. Commit with descriptive message

### Fixing Bugs
1. Reproduce the issue
2. Identify root cause
3. Fix and test
4. Update TODO.md if it was tracked
5. Commit fix

### Updating Dependencies
1. Check compatibility (especially Tauri v2 API changes)
2. Update package.json or Cargo.toml
3. Test build: `make build`
4. Verify CI/CD passes

## CI/CD Pipeline

The `.github/workflows/build.yml` workflow:
- Runs on push to main/develop and PRs
- Two jobs: `build-linux` and `test`
- Builds AppImage, Deb package, and binary
- Requires xvfb for headless Tauri builds
- Uploads artifacts on success

## Useful Resources

- Repository: https://github.com/krko2n/Muthur-os-terminal
- Issues: https://github.com/krko2n/Muthur-os-terminal/issues
- Tauri v2 Docs: https://v2.tauri.app/
- Ollama: https://ollama.com/

## Notes

- User prefers working autonomously but appreciates confirmation for risky operations
- Focus on pragmatic solutions over perfect ones
- Keep responses concise and technical
- When in doubt about priorities, check TODO.md or ask the user
