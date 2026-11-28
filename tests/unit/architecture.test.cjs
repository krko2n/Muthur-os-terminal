// Enforces MUTHUR_STANDARDS.md boundaries: terminal-only code must not depend
// on the GUI, Tauri, or the network, and the CLI must not grow its own logic.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('../helpers/load-ts.cjs');

function tsFiles(relDir) {
  const dir = path.join(ROOT, relDir);
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(relDir, entry.name);
    if (entry.isDirectory()) return tsFiles(rel);
    return /\.tsx?$/.test(entry.name) ? [rel] : [];
  });
}

function imports(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  return [...src.matchAll(/^\s*import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1]);
}

const TERMINAL_SAFE_DIRS = ['src/core', 'src/cli', 'src/security', 'src/packages'];
const GUI_ONLY = [/^react/, /^@tauri-apps\//, /^three/, /^@react-three\//, /^@xterm\//, /components\//, /hooks\//];

test('terminal-safe modules never import GUI, Tauri, or rendering libraries', () => {
  for (const dir of TERMINAL_SAFE_DIRS) {
    for (const file of tsFiles(dir)) {
      for (const spec of imports(file)) {
        assert.ok(!GUI_ONLY.some((re) => re.test(spec)), `${file} imports GUI-only '${spec}'`);
      }
    }
  }
});

test('terminal-safe modules make no network calls', () => {
  for (const dir of TERMINAL_SAFE_DIRS) {
    for (const file of tsFiles(dir)) {
      const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
      assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|node:https?\b|WebSocket/, `${file} makes network calls`);
    }
  }
});

test('src/core/metrics.ts is pure: usable from both the GUI webview and the CLI', () => {
  assert.deepEqual(imports('src/core/metrics.ts'), []);
});

test('CLI command handlers delegate to shared services instead of touching fs/os directly', () => {
  for (const file of tsFiles('src/cli/commands')) {
    for (const spec of imports(file)) {
      assert.ok(!/^node:(fs|os|child_process)$/.test(spec), `${file} imports ${spec}; move that logic into src/core`);
    }
  }
});
