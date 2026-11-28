// Validates every shipped content package (packs/*, games/*) with the real
// manifest validator, checks entrypoints exist, and scans for secrets/URLs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadTs, ROOT } = require('../helpers/load-ts.cjs');

const { validatePackageManifest } = loadTs('src/packages/manifest.ts');

function packageDirs() {
  return ['packs', 'games'].flatMap((parent) => {
    const dir = path.join(ROOT, parent);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(parent, d.name));
  });
}

function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

const dirs = packageDirs();

test('at least one content package ships with the repo', () => {
  assert.ok(dirs.length > 0);
});

for (const dir of dirs) {
  test(`${dir}: manifest is valid and its id matches the folder`, () => {
    const manifestPath = path.join(ROOT, dir, 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), `${dir}/manifest.json is missing`);
    const result = validatePackageManifest(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));
    assert.equal(result.ok, true, result.ok ? '' : result.errors.join('; '));
    assert.equal(result.manifest.id, path.basename(dir));
    if (result.manifest.entrypoint) {
      assert.ok(fs.existsSync(path.join(ROOT, dir, result.manifest.entrypoint)), `entrypoint ${result.manifest.entrypoint} missing`);
    }
  });

  test(`${dir}: JSONL data files parse and carry required fields`, () => {
    for (const file of filesUnder(path.join(ROOT, dir)).filter((f) => f.endsWith('.jsonl'))) {
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
      assert.ok(lines.length > 0, `${file} is empty`);
      lines.forEach((line, i) => {
        const entry = JSON.parse(line);
        for (const field of ['title', 'source', 'category', 'text']) {
          assert.ok(typeof entry[field] === 'string' && entry[field].length > 0, `${path.relative(ROOT, file)}:${i + 1} missing ${field}`);
        }
      });
    }
  });

  test(`${dir}: contains no URLs or credential-like strings (offline, public-safe)`, () => {
    for (const file of filesUnder(path.join(ROOT, dir))) {
      const text = fs.readFileSync(file, 'utf8').toLowerCase();
      for (const forbidden of ['http://', 'https://', 'api key', 'password', 'private key', 'secret=']) {
        assert.ok(!text.includes(forbidden), `${path.relative(ROOT, file)} contains '${forbidden}'`);
      }
    }
  });
}
