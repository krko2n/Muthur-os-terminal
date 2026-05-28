# Manual Setup - Lockfile Generation

This document provides instructions for generating the required dependency lockfiles for the MUTHUR OS Terminal project.

## The Problem: Environment Mismatch

The MUTHUR OS Terminal project is designed for **Linux-based environments** and requires specific build tools that may not be available in all development environments:

**Required Tools:**
- Node.js 24.x (LTS)
- npm (comes with Node.js)
- Rust 1.95.0 or later
- Cargo (comes with Rust)
- Linux OS (Arch, Ubuntu, Debian, Fedora) or WSL (Windows Subsystem for Linux)

**Missing Files:**
The project requires two lockfiles for reproducible builds:
- `package-lock.json` - Locks npm dependency versions
- `src-tauri/Cargo.lock` - Locks Rust dependency versions

These lockfiles are **critical** for:
- CI/CD pipeline operation (workflows will fail without them)
- Reproducible builds across environments
- Dependency caching in GitHub Actions
- Security auditing of exact dependency versions

## The Solution: Manual Lockfile Generation

If you're setting up the project for the first time or the lockfiles are missing, follow these steps in your **Linux development environment or WSL**.

### Prerequisites Check

First, verify you have the required tools installed:

```bash
# Check Node.js version (should be 24.x)
node --version

# Check npm is available
npm --version

# Check Rust version (should be 1.95.0 or later)
rustc --version

# Check Cargo is available
cargo --version
```

If any tools are missing, install them before proceeding:

```bash
# Install Node.js 24 via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24

# Install Rust (if not present)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### Step-by-Step Lockfile Generation

Navigate to your project directory and run the following commands:

**Step 1: Generate `package-lock.json`**

```bash
npm install --legacy-peer-deps
```

This command installs all npm dependencies and creates `package-lock.json` with pinned versions.

**Step 2: Generate `src-tauri/Cargo.lock`**

```bash
cd src-tauri
cargo build --release
cd ..
```

This command builds the Rust backend and creates `src-tauri/Cargo.lock` with pinned dependency versions.

**Step 3: Verify Both Files Exist**

```bash
ls -lh package-lock.json src-tauri/Cargo.lock
```

You should see output showing both files with their sizes. Example:

```
-rw-r--r-- 1 user user 245K May 28 12:34 package-lock.json
-rw-r--r-- 1 user user  87K May 28 12:35 src-tauri/Cargo.lock
```

### Commit and Push the Lockfiles

Once both lockfiles are generated, commit them to the repository:

```bash
# Stage the lockfiles
git add package-lock.json src-tauri/Cargo.lock

# Commit with descriptive message
git commit -m "fix: add missing dependency lockfiles for CI/CD reproducibility

Resolves CRITICAL blocker preventing all CI/CD builds and releases.
- Add package-lock.json for reproducible npm dependency resolution
- Add Cargo.lock for deterministic Rust builds
- Enables CI/CD cache keys to work correctly
- Unblocks release creation workflow

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to remote
git push origin main
```

## Verification

After pushing, verify the CI/CD pipeline works:

1. Go to your GitHub repository
2. Navigate to **Actions** tab
3. Check that the latest workflow run passes the "Verify lockfiles exist" step

## Alternative: Using Make

The project includes a Makefile that automates the build process:

```bash
# This will generate lockfiles as a side effect
make build

# Verify lockfiles were created
ls -lh package-lock.json src-tauri/Cargo.lock

# Stage and commit
git add package-lock.json src-tauri/Cargo.lock
git commit -m "fix: add missing dependency lockfiles for CI/CD reproducibility"
git push origin main
```

## Troubleshooting

### "npm: command not found"

Node.js is not installed or not in your PATH. Install Node.js 24.x using nvm (see Prerequisites Check above).

### "cargo: command not found"

Rust is not installed or not in your PATH. Install Rust using rustup (see Prerequisites Check above).

### "Error: ENOENT: no such file or directory"

Make sure you're in the project root directory (where `package.json` exists).

### Build Errors on Linux

Install system dependencies required by Tauri:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y build-essential libssl-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev

# Arch Linux
sudo pacman -S base-devel gtk3 webkit2gtk-4.1 libappindicator-gtk3 \
  librsvg openssl

# Fedora
sudo dnf install -y gcc-c++ openssl-devel gtk3-devel \
  webkit2gtk4.1-devel librsvg2-devel
```

## Why This Matters

Without these lockfiles:
- CI/CD workflows fail immediately at verification step
- Builds are non-deterministic (different dependency versions on different machines)
- Security vulnerabilities may go undetected
- No releases can be created
- Cache keys in GitHub Actions don't work properly

These lockfiles ensure everyone working on the project uses identical dependency versions, making builds reproducible and secure.
