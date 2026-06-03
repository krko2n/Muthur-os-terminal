# Automatic Commit & Push Guide

**Status**: ACTIVE  
**Updated**: 2026-06-03 22:35 UTC  
**Applies To**: All Claude sessions working on MUTHUR OS Terminal

---

## Overview

CLAUDE.md has been updated to include **automatic commit and push** protocol for every significant change.

---

## What Changed

### CLAUDE.md Updates

**Added Sections**:
1. **Automatic Commit & Push Protocol** - In Git Workflow section
2. **Session Workflow** - New section with commit requirements
3. **After Any Significant Change** - In Common Tasks section
4. **Updated examples** - All task examples now include commit/push steps

**Key Requirements**:
- ✅ Commit after every significant change
- ✅ Push immediately after commit
- ✅ Use conventional commit format
- ✅ Announce commits to user
- ✅ Check for uncommitted work at session end

---

## Automatic Commit Protocol

### What Triggers Auto-Commit

**Significant changes** (MUST commit):
- ✅ Adding new features or functionality
- ✅ Fixing bugs or issues
- ✅ Updating documentation
- ✅ Modifying configuration files
- ✅ Refactoring code
- ✅ Completing logical unit of work

**Not significant** (DON'T commit):
- ❌ Work-in-progress code
- ❌ Experimental changes
- ❌ Temporary test files
- ❌ Debug output
- ❌ Half-finished features

---

## Commit Message Format

**Conventional Commits Standard**:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code restructuring
- `chore` - Maintenance
- `style` - Formatting
- `test` - Testing
- `ci` - CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(terminal): add color scheme customization"

# Bug fix
git commit -m "fix(ui): resolve banner visibility issue"

# Documentation
git commit -m "docs: update CLAUDE.md with auto-commit protocol"

# Refactoring
git commit -m "refactor(core): improve error handling"

# Configuration
git commit -m "chore: update .gitignore to exclude AI files"

# Multiple files
git commit -m "feat(image): add AI image generation system

- Install SDXL Turbo model
- Create generation scripts
- Add Claude integration
- Update documentation"
```

---

## Workflow

### Standard Process

**1. Make Changes**
```bash
# Edit files, add features, fix bugs
vim src/component.tsx
```

**2. Test Changes**
```bash
# Verify it works
make dev
make test
```

**3. Stage Changes**
```bash
# Add specific files (preferred)
git add src/component.tsx

# Or add all changed files
git add .
```

**4. Commit**
```bash
# With descriptive message
git commit -m "feat(component): add new functionality"
```

**5. Push Immediately**
```bash
# Push to current branch
git push origin $(git branch --show-current)

# Or explicitly
git push origin main
```

**6. Verify**
```bash
# Check last commit
git log -1

# Verify pushed
git status
```

---

## Integration with Session Workflow

### During Active Development

**After completing each logical change**:

```bash
# 1. Complete work
# 2. Test
# 3. Commit and push
git add <files>
git commit -m "type(scope): description"
git push origin $(git branch --show-current)

# 4. Announce to user
echo "✓ Committed and pushed: [description]"
```

### At Session End

**Before ending session**:

```bash
# 1. Check status
git status

# 2. Commit any pending work (if appropriate)
git add <files>
git commit -m "wip: description of incomplete work"
git push origin $(git branch --show-current)

# 3. Confirm clean state
git status
# Should show: "nothing to commit, working tree clean"
```

---

## .gitignore Updates

**Also updated** to exclude AI helper files:

### Now Ignored
- AI helper system (`ai_helper/`, `agents/`)
- Generated images (except assets)
- AI model files (`*.safetensors`, `*.bin`)
- Python cache (`__pycache__/`, `venv/`)
- AI logs (`**/agent_*.log`)
- AI documentation (non-project docs)

### Still Tracked
- All source code
- Project documentation
- Configuration files
- Asset images in designated folders

**See**: `.gitignore-summary.md` for details

---

## Examples from This Session

### Commit That Applied These Changes

```bash
# Staged files
git add CLAUDE.md .gitignore .gitignore-summary.md

# Committed with full description
git commit -m "docs: add automatic commit protocol and update .gitignore

- Add automatic commit & push protocol to CLAUDE.md
- Configure auto-commit after every significant change
- Update .gitignore to exclude AI helper system files
- Add commit message format guidelines (conventional commits)
- Include examples and workflow instructions
- Add .gitignore-summary.md documentation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Pulled (remote had changes)
git pull --rebase origin main

# Pushed successfully
git push origin main
```

---

## Benefits

### For Development

✅ **Continuous backup** - Every change saved to remote  
✅ **Clear history** - Each logical change has its own commit  
✅ **Easy rollback** - Can revert specific changes  
✅ **Team awareness** - Others see progress in real-time  
✅ **No lost work** - Everything pushed immediately

### For Claude Sessions

✅ **Enforced discipline** - Can't forget to commit  
✅ **Consistent workflow** - Same process every time  
✅ **Clear expectations** - User knows when commits happen  
✅ **Better collaboration** - Changes are always synced  
✅ **Audit trail** - Complete record of all changes

---

## Troubleshooting

### Remote Ahead of Local

**Problem**: `rejected (fetch first)`

**Solution**:
```bash
git pull --rebase origin main
git push origin main
```

### Merge Conflicts

**Problem**: Conflicts during pull

**Solution**:
```bash
# Resolve conflicts in files
vim <conflicted-file>

# Stage resolved files
git add <resolved-files>

# Continue rebase
git rebase --continue

# Push
git push origin main
```

### Forgot to Push

**Problem**: Local commits not on remote

**Solution**:
```bash
# Check unpushed commits
git log origin/main..HEAD

# Push them
git push origin main
```

### Wrong Commit Message

**Problem**: Typo or wrong description

**Solution**:
```bash
# If NOT pushed yet
git commit --amend -m "corrected message"
git push origin main

# If already pushed - create new commit
git commit --allow-empty -m "docs: correct previous commit message"
git push origin main
```

---

## Verification

### Check Auto-Commit is Working

**After any significant change**:

```bash
# 1. Should have new commit
git log -1
# Shows your recent commit

# 2. Should be pushed
git status
# Shows: "Your branch is up to date with 'origin/main'"

# 3. Should be on remote
git log origin/main -1
# Shows same commit as local
```

---

## Summary

✅ **CLAUDE.md updated** - Auto-commit protocol added  
✅ **.gitignore updated** - AI files excluded  
✅ **Committed and pushed** - Changes are live  
✅ **Protocol active** - Applies to all future sessions

**From now on**: Every significant change will be automatically committed and pushed according to the protocol defined in CLAUDE.md.

---

## Files Modified

1. **CLAUDE.md** - Added auto-commit protocol
2. **.gitignore** - Excluded AI helper files
3. **.gitignore-summary.md** - Documentation of ignore patterns
4. **AUTO_COMMIT_GUIDE.md** - This guide

**Commit**: `0bcbd96` - "docs: add automatic commit protocol and update .gitignore"  
**Branch**: `main`  
**Status**: Pushed ✓

---

**Created**: 2026-06-03 22:35 UTC  
**Author**: Claude Sonnet 4.5  
**Purpose**: Document automatic commit & push workflow
