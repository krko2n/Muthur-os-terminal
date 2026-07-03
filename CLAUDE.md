# Claude Code Instructions for Muthur

You are working on Muthur.

## Start-of-task rules

Before editing anything:

1. Read `MUTHUR_STANDARDS.md`.
2. Run:

```bash
git status --short
```

3. Identify any pre-existing local changes.
4. Do not overwrite, delete, reformat, or commit unrelated user changes.
5. If unrelated local changes block the task, stop and report them.
6. Implement only the requested task.
7. Keep the change small, testable, terminal-safe, and Muthur-compatible.
8. Do not make GUI, AI, cloud, or network required for terminal-only mode.
9. Do not duplicate backend/core logic between CLI and GUI.
10. Do not add bloat, flashy AI-slop, or unrelated architecture rewrites.

## End-of-task workflow

After finishing every task:

1. Run:

```bash
npm test
npm run lint
```

2. If either command fails:

   * Do not commit.
   * Do not push.
   * Report the failing command and exact error.
   * Stop.

3. If both pass, inspect changed files:

```bash
git status --short
git diff --stat
```

4. Stage only files changed for the current task.

Good example:

```bash
git add src/core/config.ts src/cli/main.ts tests/unit/cli-config.cjs
```

Avoid unless you are completely sure:

```bash
git add .
```

5. Commit with a clear conventional commit message:

```bash
git commit -m "feat: add local config command"
```

6. Rebase on latest main before pushing:

```bash
git pull --rebase origin main
```

7. If rebase conflicts happen:

   * Do not guess.
   * Do not force push.
   * Stop and report the conflict files.

8. If rebase succeeds, push:

```bash
git push origin HEAD:main
```

9. After pushing, report:

   * changed files
   * tests run
   * commit hash
   * what remains
   * limitations

## Safety rules

* Never force push unless explicitly told.
* Never commit secrets, tokens, `.env`, private keys, or local machine credentials.
* Never hide failing tests.
* Never commit unrelated user changes.
* Never make GUI, AI, cloud, or network mandatory.
* Never duplicate backend/core logic between terminal and GUI.
* Never rewrite unrelated architecture.
* Never add unnecessary dependencies.
* Keep terminal-only mode usable.
