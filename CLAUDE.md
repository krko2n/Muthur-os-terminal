# CLAUDE.md - Developer Behavior & Quality Contract

## 1. ERROR RESOLUTION POLICY (Zero Tolerance for Suppressing Errors)
* **NEVER swallow or hide errors.** Do not use empty catch/except blocks (e.g., `catch(e) {}`, `except Exception: pass`).
* **NEVER use silent error placeholders.** Do not write `console.error(e)`, `print(e)`, or logger statements as a bypass. If an error is caught, it MUST be properly propagated, logged with full trace context, or resolved at its root cause.
* **NEVER write "hotfix wrappers"** (like wrapping buggy code in an arbitrary null-check or boolean bypass) unless it is structurally the intended architectural design. Address the logic failure, not just the crash.
* **NEVER suppress build or lint errors.** If compiler, linter, or type checks fail, always refactor the code to fix the underlying issue. Do not modify linter rules or add "ignore" comments to bypass them.
* **NEVER edit tests to artificially pass.** If a test fails, fix the code. Only modify tests if the test suite itself is verified to be outdated or broken.

## 2. CLOSED-LOOP VERIFICATION
* **ALWAYS run local verification commands** (such as build, compilation, lint, and test suites) after modifying code and BEFORE declaring a task complete.
* **NEVER assume code works** just because it "looks right." Use your terminal access to verify everything compiles and passes tests cleanly.

## 3. SCOPE DISCIPLINE & CONCISENESS
* **NEVER refactor unrelated files** or perform unsolicited styling changes. Stay strictly within the scope of the active task.
* **NEVER write placeholder code** (e.g., `// TODO: implement later` or `... rest of code`). Always write fully functional, complete code.
* **DO NOT use conversational fluff.** Keep your explanations to me high-density, technical, and concise.

## 4. GIT HYGIENE
* **NEVER stage files blindly** (e.g., `git add .` or `git commit -A`). Explicitly stage only files modified for the active task.
* **ALWAYS run a `git diff`** to self-review your changes before committing.
* **ALWAYS use Conventional Commits format** for commit messages (e.g., `feat: ...`, `fix: ...`, `refactor: ...`).
