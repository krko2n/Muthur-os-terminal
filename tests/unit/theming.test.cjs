// Themes (MOTHER, AMBER, CRYO, ...) work by rewriting CSS variables on :root.
// A hard-coded accent colour bypasses that and leaves green islands in every
// other theme. These checks keep the fix from regressing.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('../helpers/load-ts.cjs');

function tsxFiles(relDir) {
  return fs.readdirSync(path.join(ROOT, relDir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(relDir, entry.name);
    if (entry.isDirectory()) return tsxFiles(rel);
    return entry.name.endsWith('.tsx') ? [rel] : [];
  });
}

test('Tailwind arbitrary classes use theme variables, not the literal default green', () => {
  const offenders = [];
  for (const file of tsxFiles('src')) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    src.split(/\r?\n/).forEach((line, i) => {
      if (/\[[^\]"'\s]*rgba\(0,\s*255,\s*65/.test(line)) offenders.push(`${file}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, [], 'use rgba(var(--color-r),var(--color-g),var(--color-b),A) instead');
});

test('the pre-paint styles in index.html do not pin the root colour or hide the dot grid', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const rootRule = html.match(/#root\s*\{[^}]*\}/g) || [];
  for (const rule of rootRule) {
    assert.doesNotMatch(rule, /color:\s*#/, `#root colour is hard-coded: ${rule}`);
    assert.doesNotMatch(rule, /background/, `#root background hides the body dot grid: ${rule}`);
  }
});

test('every theme defines the variables the UI reads', () => {
  const themeSrc = fs.readFileSync(path.join(ROOT, 'src/theme.ts'), 'utf8');
  for (const variable of ['--color-r', '--color-g', '--color-b', '--color-accent', '--color-bg', '--color-text', '--color-danger']) {
    assert.ok(themeSrc.includes(`'${variable}'`), `theme.ts never sets ${variable}`);
  }
});
