# No Emoji Policy

## Policy Statement

**MUTHUR OS Terminal maintains a strict no-emoji policy across all project files.**

Emojis are not permitted in:
- Documentation files (*.md, *.txt)
- Source code (*.rs, *.ts, *.tsx, *.js, *.jsx)
- Configuration files
- Scripts (*.sh, *.bash)
- Commit messages
- Pull request descriptions
- Issue descriptions
- Code comments

## Rationale

1. **Accessibility**: Screen readers often handle emojis poorly or inconsistently
2. **Searchability**: Emojis make text search and grep operations less reliable
3. **Terminal compatibility**: Not all terminals render emojis correctly
4. **Professionalism**: Technical documentation should be clear and professional
5. **Cross-platform**: Emoji rendering varies across platforms and fonts
6. **Version control**: Emojis can cause encoding issues in some git configurations

## Acceptable Alternatives

Instead of emojis, use:

**Section headers:**
```markdown
## Features          (not: ## 🚀 Features)
## Installation      (not: ## 🛠️ Installation)
## Troubleshooting   (not: ## 🐛 Troubleshooting)
```

**Status indicators in scripts:**
```bash
echo "[OK] Test passed"       (not: echo "✓ Test passed")
echo "[FAIL] Test failed"     (not: echo "✗ Test failed")
echo "[WARNING] Check this"   (not: echo "⚠ Check this")
```

**File trees:**
```
├── README.md                 (not: 📄 README.md)
├── src/                      (not: 📁 src/)
```

**Commit messages:**
```
feat: add terminal tabs       (not: feat: add terminal tabs 🎉)
fix: resolve memory leak      (not: fix: resolve memory leak 🐛)
```

## Enforcement

1. **Pre-commit hook**: Install the emoji-check hook (coming soon)
2. **CI/CD**: GitHub Actions will reject PRs containing emojis
3. **Code review**: Reviewers will request emoji removal

## Checking Your Changes

Before committing, run:

```bash
# Check for emojis in staged files
git diff --cached | grep -E "[\U0001F300-\U0001F9FF]"

# If output is empty, you're good
# If output shows matches, remove the emojis
```

## Exceptions

None. This policy has no exceptions.

## Questions?

If you have questions about this policy, open a discussion on GitHub.

---

**Last Updated**: 2026-05-24  
**Version**: 1.0  
**Status**: Active
