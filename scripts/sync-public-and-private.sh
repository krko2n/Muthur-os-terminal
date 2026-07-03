#!/usr/bin/env bash
set -euo pipefail

# Muthur: Sync public (origin/main) and private (private/private/full-local) remotes.
# Never force pushes. Never stages secrets. Requires confirmation for first private push.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

die() { echo -e "${RED}FATAL: $1${NC}" >&2; exit 1; }
info() { echo -e "${GREEN}$1${NC}"; }
warn() { echo -e "${YELLOW}$1${NC}"; }

SECRET_PATTERNS=(
  '*.pem' '*.key' 'id_rsa' 'id_ed25519' '*.p12' '*.pfx'
  '.env' '.env.*' 'credentials.json' '*.secret'
  'node_modules/' 'dist/' 'build/' 'target/' '.git/'
)

check_for_secrets() {
  local files="$1"
  for pattern in "${SECRET_PATTERNS[@]}"; do
    while IFS= read -r file; do
      if [[ -n "$file" ]]; then
        case "$file" in
          $pattern|*/$pattern) die "Refusing to stage potential secret: $file" ;;
        esac
      fi
    done <<< "$files"
  done
}

# Verify we are in the right repo
[[ -f "$REPO_ROOT/MUTHUR_STANDARDS.md" ]] || die "Not in Muthur repo root."
git remote get-url origin >/dev/null 2>&1 || die "No 'origin' remote."
git remote get-url private >/dev/null 2>&1 || die "No 'private' remote. Run setup first."

# Step 1: Ensure on main
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  info "Switching to main..."
  git switch main
fi

# Step 2: Run tests before public push
info "Running tests..."
npm test || die "npm test failed. Not pushing."

# Step 3: Check for uncommitted public changes
if [[ -n "$(git status --short)" ]]; then
  warn "Uncommitted changes on main. Commit or stash them first."
  git status --short
  die "Cannot sync with uncommitted changes."
fi

# Step 4: Push public main to origin
info "Pulling latest from origin/main..."
git pull --rebase origin main || die "Rebase conflict. Resolve manually."

info "Pushing main to origin (public)..."
echo "  Remote: $(git remote get-url origin)"
echo "  Branch: main"
git push origin main || die "Public push failed."
info "Public sync complete."

# Step 5: Switch to private branch
info "Switching to private/full-local..."
if git show-ref --verify --quiet refs/heads/private/full-local; then
  git switch private/full-local
else
  git switch -c private/full-local
fi

# Step 6: Merge main into private branch
info "Merging main into private/full-local..."
git merge main --no-edit || die "Merge conflict. Resolve manually."

# Step 7: Stage private-safe internal files
PRIVATE_FILES=""
[[ -f "CLAUDE.md" ]] && PRIVATE_FILES="$PRIVATE_FILES CLAUDE.md"
[[ -f "mother_internal_specification.md" ]] && PRIVATE_FILES="$PRIVATE_FILES mother_internal_specification.md"

if [[ -n "$PRIVATE_FILES" ]]; then
  check_for_secrets "$PRIVATE_FILES"
  git add -f $PRIVATE_FILES 2>/dev/null || true
fi

# Step 8: Commit if there are changes
if [[ -n "$(git status --short)" ]] || [[ -n "$(git diff --cached --name-only)" ]]; then
  info "Committing private sync..."
  git commit -m "chore: sync private local workspace" --allow-empty || true
fi

# Step 9: Push private branch to private remote
info "Pushing private/full-local to private remote..."
echo "  Remote: $(git remote get-url private)"
echo "  Branch: private/full-local"

# First push confirmation
if ! git ls-remote --exit-code private refs/heads/private/full-local >/dev/null 2>&1; then
  warn "This is the first push to the private remote."
  read -p "Continue? [y/N] " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]] || die "Aborted by user."
fi

git push private private/full-local || die "Private push failed."
info "Private sync complete."

# Step 10: Return to main
git switch main
info "Done. Both remotes synced."
