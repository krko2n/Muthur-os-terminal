# VM Testing Guide

Short smoke checklist for validating MUTHUR in a disposable virtual machine.

This guide is terminal-first. GUI checks are optional follow-up validation and
must not be required for terminal-only mode.

## VM Setup

- Use any local VM tool that can run Linux, such as VirtualBox, QEMU/KVM,
  GNOME Boxes, VMware Player, Hyper-V, or UTM.
- Do not depend on paid-only features, cloud-hosted runners, or remote desktop
  services.
- Prefer a clean Linux guest that matches supported targets, such as Arch,
  Ubuntu, Debian, or Fedora.
- Keep network optional after dependencies are already present. Smoke checks
  should be runnable without AI, cloud services, or GUI access.

## Snapshot Advice

Create snapshots at these points:

1. Fresh OS installed, before MUTHUR setup.
2. Dependencies installed, before cloning or copying the repo.
3. MUTHUR checked out, before running tests.
4. Known-good smoke test pass.

Name snapshots with the date, distro, CPU/RAM size, and MUTHUR commit hash.
Restore to the previous snapshot before retrying installer or upgrade tests.

## Low-Resource Path

Use this path when testing on a small laptop or nested VM:

- 2 CPU cores.
- 2 GB RAM minimum for terminal-only checks.
- 4 GB RAM if later GUI validation is needed.
- 20 GB disk.
- Disable 3D acceleration unless the GUI test specifically needs it.
- Skip optional AI, map, wiki, and audio packs.
- Run terminal checks before opening the GUI.

## Terminal-Only Smoke Checklist

From the project root:

```sh
node --version
npm --version
npm test
npm run lint
```

Then verify:

- The commands complete without network, cloud, AI, or GUI services.
- No installer step requires Tauri or a desktop session for terminal checks.
- Error output is readable in a plain terminal.
- Optional packs remain optional.
- Existing shell scripts print clear status or help text.

Useful optional commands:

```sh
bash scripts/muthur-offline-pack.sh --status
bash scripts/muthur-health-check.sh
```

## Later GUI Checklist

Run these only after terminal checks pass:

- Start the GUI using the documented local development path.
- Confirm the app opens without making AI, cloud, or network mandatory.
- Confirm terminal panels still work if optional GUI widgets fail.
- Confirm screenshots show readable text and no overlapping critical controls.
- Close and reopen the app once to check basic startup stability.

## Logs And Screenshots

Keep a small evidence folder outside the repo, for example:

```sh
mkdir -p ~/muthur-vm-smoke
npm test > ~/muthur-vm-smoke/npm-test.log 2>&1
npm run lint > ~/muthur-vm-smoke/npm-lint.log 2>&1
```

Capture:

- VM name, distro, kernel, CPU cores, RAM, disk size.
- MUTHUR commit hash.
- `npm test` log.
- `npm run lint` log.
- Terminal screenshot of the final pass or failure.
- GUI screenshot only when GUI validation is intentionally run.

Do not commit VM screenshots, local logs, secrets, tokens, `.env` files, keys, or
machine-specific paths.

## Pass Criteria

- Terminal-only smoke path passes.
- Low-resource path remains usable.
- GUI validation, if run, is clearly marked as optional.
- Logs and screenshots are captured outside the repository.
- No paid-only VM tool, cloud service, AI service, or network dependency is
  required by the smoke checklist.
