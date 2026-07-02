# tests

Test suite for MUTHUR OS Terminal.

## Structure

- `unit/`     - Isolated function/module tests
- `integration/` - Cross-module and backend integration tests
- `smoke/`    - Quick sanity checks (existing: scripts/smoke-test.cjs)

## Running

```sh
npm test              # runs smoke tests (current)
npm run lint          # type checking via tsc --noEmit
```

Tests must not require network access or GUI to pass.
