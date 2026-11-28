const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadTs, ROOT } = require('../helpers/load-ts.cjs');

const { validatePackageManifest, ALLOWED_PACKAGE_TYPES } = loadTs('src/packages/manifest.ts');
const { validatePermissions, renderPermissions, KNOWN_PERMISSIONS } = loadTs('src/security/permissions.ts');

const valid = { id: 'survival-pack', name: 'Survival Pack', version: '0.1.0', type: 'data' };

test('a minimal manifest validates and keeps only known fields', () => {
  const result = validatePackageManifest({ ...valid, extra: 'ignored' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.manifest, valid);
});

test('non-object manifests are rejected', () => {
  for (const raw of [null, [], 'text', 7]) {
    const result = validatePackageManifest(raw);
    assert.equal(result.ok, false, `input ${JSON.stringify(raw)}`);
    assert.deepEqual(result.errors, ['Manifest must be a JSON object.']);
  }
});

test('every required field is reported when missing', () => {
  const result = validatePackageManifest({});
  assert.equal(result.ok, false);
  for (const field of ['id', 'name', 'version', 'type']) {
    assert.ok(result.errors.some((e) => e.includes(`'${field}'`)), `missing ${field} not reported`);
  }
});

test('ids must be lowercase slugs', () => {
  for (const id of ['Survival', '1pack', 'a', 'has space', 'x'.repeat(65)]) {
    const result = validatePackageManifest({ ...valid, id });
    assert.equal(result.ok, false, `id '${id}' should be rejected`);
  }
  assert.equal(validatePackageManifest({ ...valid, id: 'ok-2' }).ok, true);
});

test('unknown package types are rejected and every allowed type is accepted', () => {
  const bad = validatePackageManifest({ ...valid, type: 'kernel-module' });
  assert.equal(bad.ok, false);
  assert.match(bad.errors[0], /Unknown package type 'kernel-module'/);
  for (const type of ALLOWED_PACKAGE_TYPES) {
    assert.equal(validatePackageManifest({ ...valid, type }).ok, true, type);
  }
});

test('optional fields must have the right shape', () => {
  assert.equal(validatePackageManifest({ ...valid, dependencies: 'x' }).ok, false);
  assert.equal(validatePackageManifest({ ...valid, dependencies: ['a', 3] }).ok, false);
  assert.equal(validatePackageManifest({ ...valid, entrypoint: 5 }).ok, false);
  assert.equal(validatePackageManifest({ ...valid, dependencies: ['a'], entrypoint: 'index.js' }).ok, true);
});

test('permissions: known ones pass, unknown ones are listed, non-arrays fail', () => {
  assert.deepEqual(validatePermissions(['fs.read', 'audio.play']), { ok: true, permissions: ['fs.read', 'audio.play'] });

  const mixed = validatePermissions(['fs.read', 'root.everything', 3]);
  assert.equal(mixed.ok, false);
  assert.deepEqual(mixed.unknown, ['root.everything', '3']);
  assert.deepEqual(mixed.valid, ['fs.read']);

  assert.equal(validatePermissions('fs.read').ok, false);
});

test('every known permission has a human description', () => {
  const rendered = renderPermissions([...KNOWN_PERMISSIONS]);
  for (const line of rendered.split('\n').filter((l) => l.startsWith('  - '))) {
    assert.doesNotMatch(line, /undefined/, line);
  }
  assert.equal(renderPermissions([]), 'No permissions requested.');
});

test('docs list every package type and permission the code accepts', () => {
  const packageDoc = fs.readFileSync(path.join(ROOT, 'docs/PACKAGE_FORMAT.md'), 'utf8');
  for (const type of ALLOWED_PACKAGE_TYPES) assert.ok(packageDoc.includes(type), `PACKAGE_FORMAT.md missing type ${type}`);
  const pluginDoc = fs.readFileSync(path.join(ROOT, 'docs/PLUGIN_FORMAT.md'), 'utf8');
  for (const perm of KNOWN_PERMISSIONS) assert.ok(pluginDoc.includes(perm), `PLUGIN_FORMAT.md missing permission ${perm}`);
});
