# Contributing to MUTHUR OS Terminal

First off, thank you for considering contributing to MUTHUR!

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something awesome together.

---

## How Can I Contribute?

### Reporting Bugs

**Before submitting a bug report:**
1. Check existing [issues](https://github.com/krko2n/Muthur-os-terminal/issues)
2. Update to the latest version
3. Try to reproduce with minimal configuration

**When submitting a bug report, include:**
- **OS**: Distribution and version (e.g., Arch Linux, Ubuntu 22.04)
- **Version**: MUTHUR version (check with `muthur --version` if available)
- **Steps to reproduce**: Detailed, step-by-step
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Logs**: From `~/.config/xKOR_3RR0R/crash_reports/` if applicable
- **Screenshots**: If UI-related

### Suggesting Features

**Before suggesting a feature:**
1. Check if it already exists
2. Check if it's already suggested in [issues](https://github.com/krko2n/Muthur-os-terminal/issues)

**When suggesting a feature:**
- **Clear title**: Concise description
- **Use case**: Why is this needed?
- **Proposed solution**: How should it work?
- **Alternatives**: What other solutions did you consider?
- **Mockups**: If UI-related, include sketches or mockups

---

## Development Process

### Setting Up Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/muthur-os-terminal.git
cd muthur-os-terminal

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions.

### Making Changes

1. **Create a branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**:
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**:
   ```bash
   # Test Rust code
   cd src-tauri && cargo test

   # Test TypeScript compilation
   npm run build

   # Test the app
   npm run tauri dev
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add awesome new feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `perf:` Performance improvements
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

5. **Push to your fork**:
   ```bash
   git push origin feat/your-feature-name
   ```

6. **Create a Pull Request**:
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

---

## Coding Standards

### Rust

```rust
// Use rustfmt
cargo fmt

// Use clippy
cargo clippy

// Document public APIs
/// Creates a new terminal session
pub fn create_session(&mut self) -> Result<SessionId> {
    // Implementation
}
```

**Style guidelines:**
- Use snake_case for functions and variables
- Use PascalCase for types and structs
- Keep functions short and focused
- Prefer `Result<T, E>` over panics
- Use `?` for error propagation

### TypeScript/React

```typescript
// Use Prettier
npm run format

// Use ESLint
npm run lint

// Prefer functional components
export default function MyComponent() {
  return <div>Hello</div>;
}

// Use TypeScript types
interface Props {
  name: string;
  count: number;
}
```

**Style guidelines:**
- Use PascalCase for components
- Use camelCase for functions and variables
- Prefer const over let
- Use arrow functions
- Type everything (avoid `any`)

### CSS/TailwindCSS

```css
/* Use Tailwind utility classes */
<div className="flex items-center gap-2">

/* Custom classes in index.css for reusable patterns */
.panel {
  @apply bg-muthur-panel border border-muthur-border;
}
```

---

## Pull Request Guidelines

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New code has tests (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow Conventional Commits
- [ ] Branch is up to date with main
- [ ] PR description explains the changes

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test this? What test cases did you run?

## Screenshots (if applicable)
Include before/after screenshots for UI changes.

## Checklist
- [ ] My code follows the project style
- [ ] I have tested my changes
- [ ] I have updated the documentation
- [ ] My commits follow Conventional Commits
```

### Review Process

1. **Automated checks**: CI/CD will run tests and linters
2. **Code review**: Maintainer will review your code
3. **Changes requested**: Address feedback and push updates
4. **Approval**: Once approved, your PR will be merged
5. **Release**: Changes will be included in the next release

---

## Project Structure

```
src-tauri/src/
├── main.rs      # Entry point, Tauri commands
├── pty.rs       # Terminal/PTY management
├── system.rs    # System monitoring
├── ai.rs        # AI integration
└── crash.rs     # Crash reporting

src/components/
├── Header.tsx        # Top bar
├── LeftPanel.tsx     # System stats
├── CenterPanel.tsx   # Main content
├── RightPanel.tsx    # Network & AI
├── Terminal.tsx      # xterm.js integration
├── FileExplorer.tsx  # File browser
├── Globe.tsx         # 3D visualization
└── AIPanel.tsx       # AI chat
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed architecture documentation.

---

## Testing Guidelines

### Rust Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_session() {
        let mut manager = PtyManager::new();
        let session_id = manager.create_session().unwrap();
        assert!(!session_id.to_string().is_empty());
    }
}
```

### TypeScript Tests (Future)

Currently, TypeScript tests are not set up. Contributions to add testing infrastructure are welcome!

---

## Documentation

### Code Comments

**Rust**:
```rust
/// Creates a new PTY session with default settings.
///
/// # Returns
/// SessionId if successful, or Error if PTY creation fails
pub fn create_session(&mut self) -> Result<SessionId> {
    // Implementation
}
```

**TypeScript**:
```typescript
/**
 * Terminal component with multi-tab support
 * Integrates xterm.js with Tauri backend
 */
export default function Terminal() {
  // Implementation
}
```

### Documentation Files

Update these files when making changes:
- `README.md` - If user-facing features change
- `DEVELOPMENT.md` - If architecture or dev workflow changes
- `QUICKSTART.md` - If setup process changes
- `CHANGELOG.md` - For all changes

---

## Community

### Getting Help

- **GitHub Discussions**: Ask questions, share ideas
- **GitHub Issues**: Bug reports, feature requests
- **Discord**: [Coming soon]

### Recognition

Contributors are listed in:
- GitHub contributors page
- CHANGELOG.md (for significant contributions)
- README.md (for major features)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Don't hesitate to ask! Open a discussion or issue, and we'll help you get started.

**Thank you for contributing to MUTHUR!**
