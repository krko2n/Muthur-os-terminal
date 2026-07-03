#Requires -Version 5.1
<#
.SYNOPSIS
    Muthur: Sync public (origin/main) and private (private/private/full-local) remotes.
.DESCRIPTION
    Never force pushes. Never stages secrets. Requires confirmation for first private push.
#>

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

$SecretPatterns = @(
    '*.pem', '*.key', 'id_rsa', 'id_ed25519', '*.p12', '*.pfx',
    '.env', '.env.*', 'credentials.json', '*.secret',
    'node_modules/', 'dist/', 'build/', 'target/', '.git/'
)

function Test-SecretFile {
    param([string]$FilePath)
    foreach ($pattern in $SecretPatterns) {
        if ($FilePath -like $pattern -or $FilePath -like "*/$pattern") {
            throw "Refusing to stage potential secret: $FilePath"
        }
    }
}

function Write-Status { param([string]$Msg) Write-Host $Msg -ForegroundColor Green }
function Write-Warn { param([string]$Msg) Write-Host $Msg -ForegroundColor Yellow }
function Write-Fatal { param([string]$Msg) Write-Host "FATAL: $Msg" -ForegroundColor Red; exit 1 }

# Verify repo
if (-not (Test-Path "$RepoRoot\MUTHUR_STANDARDS.md")) { Write-Fatal "Not in Muthur repo root." }
$originUrl = git remote get-url origin 2>$null
if (-not $originUrl) { Write-Fatal "No 'origin' remote." }
$privateUrl = git remote get-url private 2>$null
if (-not $privateUrl) { Write-Fatal "No 'private' remote. Run setup first." }

# Step 1: Ensure on main
$currentBranch = git branch --show-current
if ($currentBranch -ne 'main') {
    Write-Status "Switching to main..."
    git switch main
    if ($LASTEXITCODE -ne 0) { Write-Fatal "Cannot switch to main." }
}

# Step 2: Run tests
Write-Status "Running tests..."
npm test
if ($LASTEXITCODE -ne 0) { Write-Fatal "npm test failed. Not pushing." }

# Step 3: Check uncommitted changes
$status = git status --short
if ($status) {
    Write-Warn "Uncommitted changes on main:"
    Write-Host $status
    Write-Fatal "Cannot sync with uncommitted changes."
}

# Step 4: Push public
Write-Status "Pulling latest from origin/main..."
git pull --rebase origin main
if ($LASTEXITCODE -ne 0) { Write-Fatal "Rebase conflict. Resolve manually." }

Write-Status "Pushing main to origin (public)..."
Write-Host "  Remote: $originUrl"
Write-Host "  Branch: main"
git push origin main
if ($LASTEXITCODE -ne 0) { Write-Fatal "Public push failed." }
Write-Status "Public sync complete."

# Step 5: Switch to private branch
Write-Status "Switching to private/full-local..."
$branchExists = git show-ref --verify --quiet refs/heads/private/full-local 2>$null
if ($LASTEXITCODE -eq 0) {
    git switch private/full-local
} else {
    git switch -c private/full-local
}

# Step 6: Merge main
Write-Status "Merging main into private/full-local..."
git merge main --no-edit
if ($LASTEXITCODE -ne 0) { Write-Fatal "Merge conflict. Resolve manually." }

# Step 7: Stage private-safe files
$privateFiles = @()
if (Test-Path "CLAUDE.md") { $privateFiles += "CLAUDE.md" }
if (Test-Path "mother_internal_specification.md") { $privateFiles += "mother_internal_specification.md" }

foreach ($file in $privateFiles) {
    Test-SecretFile $file
}
if ($privateFiles.Count -gt 0) {
    git add -f @privateFiles 2>$null
}

# Step 8: Commit if needed
$staged = git diff --cached --name-only
$dirty = git status --short
if ($staged -or $dirty) {
    Write-Status "Committing private sync..."
    git commit -m "chore: sync private local workspace" --allow-empty 2>$null
}

# Step 9: Push private
Write-Status "Pushing private/full-local to private remote..."
Write-Host "  Remote: $privateUrl"
Write-Host "  Branch: private/full-local"

$remoteRef = git ls-remote --heads private refs/heads/private/full-local 2>$null
if (-not $remoteRef) {
    Write-Warn "This is the first push to the private remote."
    $confirm = Read-Host "Continue? [y/N]"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') { Write-Fatal "Aborted by user." }
}

git push private private/full-local
if ($LASTEXITCODE -ne 0) { Write-Fatal "Private push failed." }
Write-Status "Private sync complete."

# Step 10: Return to main
git switch main
Write-Status "Done. Both remotes synced."
