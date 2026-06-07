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

**Automatic Commit & Push Protocol**:
- **After every significant change**, automatically commit and push to remote
- A "significant change" includes:
  - Adding new features or functionality
  - Fixing bugs or issues
  - Updating documentation (README, CLAUDE.md, etc.)
  - Modifying configuration files
  - Refactoring code
  - Any change that completes a logical unit of work
- **Exclude from auto-commit**: Trivial changes, work-in-progress, experimental code
- **Required**: Always create a descriptive commit message

**Auto-Commit Procedure**:
1. After completing a significant change, immediately run:
   ```bash
   git add <changed-files>
   git commit -m "type(scope): descriptive message"
   git push origin <current-branch>
   ```
2. Verify push succeeded before moving to next task
3. Log the commit in session notes

**Commit Message Format** (Conventional Commits):
- `feat(component): add new feature` - New functionality
- `fix(component): resolve bug` - Bug fixes
- `docs: update documentation` - Documentation changes
- `refactor(component): improve code structure` - Code restructuring
- `chore: update dependencies` - Maintenance tasks
- `style: format code` - Formatting changes
- `test: add tests` - Test additions

**Git Safety Rules**:
- **Never** run destructive git commands without user confirmation
- **Never** skip hooks (--no-verify) unless explicitly requested
- **Never** amend commits unless explicitly requested
- **Always** create new commits rather than amending
- **Always** push to remote immediately after commit
- Push to remote: `git push origin <branch>`

**Examples**:
```bash
# After adding image generation feature
git add src/components/ImageGen.tsx
git commit -m "feat(image): add AI image generation component"
git push origin main

# After fixing a bug
git add src-tauri/src/terminal.rs
git commit -m "fix(terminal): resolve cursor positioning issue"
git push origin main

# After updating docs
git add CLAUDE.md README.md
git commit -m "docs: add automatic commit protocol to CLAUDE.md"
git push origin main
```

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

## Session Workflow

### During Active Development

**After EVERY significant change**:
1. Complete the logical unit of work
2. Test that it works
3. **IMMEDIATELY commit and push**:
   ```bash
   git add <files>
   git commit -m "type(scope): description"
   git push origin $(git branch --show-current)
   ```
4. Announce to user: "Committed and pushed: [description]"
5. Continue with next task

**Key Points**:
- Don't wait to commit multiple changes together
- Each logical change gets its own commit
- Always push immediately after commit
- Never leave commits unpushed

### Session End Protocol

When the user says goodbye or ends the session:
1. **Check for uncommitted changes**: Run `git status`
2. **Commit any pending work** (if appropriate)
3. **Push all commits**: Ensure nothing is left unpushed
4. Review TODO.md and update any completed tasks
5. Save important session context to memory:
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
5. **Auto-commit and push**:
   ```bash
   git add <changed-files>
   git commit -m "feat(component): describe feature"
   git push origin <branch>
   ```

### Fixing Bugs
1. Reproduce the issue
2. Identify root cause
3. Fix and test
4. Update TODO.md if it was tracked
5. **Auto-commit and push**:
   ```bash
   git add <changed-files>
   git commit -m "fix(component): describe fix"
   git push origin <branch>
   ```

### After Any Significant Change
**REQUIRED**: Immediately commit and push to remote

**What counts as "significant"**:
- Completed feature implementation
- Bug fix that resolves an issue
- Documentation update
- Configuration change
- Refactoring that improves code
- Any logical unit of work completion

**Do NOT auto-commit**:
- Experimental/WIP code
- Half-finished features
- Temporary test files
- Debug output

**Process**:
```bash
# 1. Stage your changes
git add <files>

# 2. Create descriptive commit
git commit -m "type(scope): description"

# 3. Push immediately
git push origin $(git branch --show-current)

# 4. Verify
git log -1  # Check last commit
```

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

---

## Developer Behavior & Quality Contract

### 1. ERROR RESOLUTION POLICY (Zero Tolerance for Suppressing Errors)
* **NEVER swallow or hide errors.** Do not use empty catch/except blocks (e.g., `catch(e) {}`, `except Exception: pass`).
* **NEVER use silent error placeholders.** Do not write `console.error(e)`, `print(e)`, or logger statements as a bypass. If an error is caught, it MUST be properly propagated, logged with full trace context, or resolved at its root cause.
* **NEVER write "hotfix wrappers"** (like wrapping buggy code in an arbitrary null-check or boolean bypass) unless it is structurally the intended architectural design. Address the logic failure, not just the crash.
* **NEVER suppress build or lint errors.** If compiler, linter, or type checks fail, always refactor the code to fix the underlying issue. Do not modify linter rules or add "ignore" comments to bypass them.
* **NEVER edit tests to artificially pass.** If a test fails, fix the code. Only modify tests if the test suite itself is verified to be outdated or broken.

### 2. CLOSED-LOOP VERIFICATION
* **ALWAYS run local verification commands** (such as build, compilation, lint, and test suites) after modifying code and BEFORE declaring a task complete.
* **NEVER assume code works** just because it "looks right." Use your terminal access to verify everything compiles and passes tests cleanly.

### 3. SCOPE DISCIPLINE & CONCISENESS
* **NEVER refactor unrelated files** or perform unsolicited styling changes. Stay strictly within the scope of the active task.
* **NEVER write placeholder code** (e.g., `// TODO: implement later` or `... rest of code`). Always write fully functional, complete code.
* **DO NOT use conversational fluff.** Keep your explanations to me high-density, technical, and concise.

### 4. GIT HYGIENE
* **NEVER stage files blindly** (e.g., `git add .` or `git commit -A`). Explicitly stage only files modified for the active task.
* **ALWAYS run a `git diff`** to self-review your changes before committing.
* **ALWAYS use Conventional Commits format** for commit messages (e.g., `feat: ...`, `fix: ...`, `refactor: ...`).
