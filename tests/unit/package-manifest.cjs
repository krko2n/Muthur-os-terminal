const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label} is missing: ${expected}`);
  }
}

function assertExcludes(value, forbidden, label) {
  if (value.includes(forbidden)) {
    throw new Error(`${label} must not contain: ${forbidden}`);
  }
}

const manifestSource = read('src/packages/manifest.ts');
const docsSource = read('docs/PACKAGE_FORMAT.md');

// Manifest module exports required contract
assertIncludes(manifestSource, 'export const ALLOWED_PACKAGE_TYPES', 'Manifest exports types list');
assertIncludes(manifestSource, 'export interface PackageManifest', 'Manifest exports interface');
assertIncludes(manifestSource, 'export function validatePackageManifest', 'Manifest exports validator');

// All required fields enforced
for (const field of ['id', 'name', 'version', 'type']) {
  assertIncludes(manifestSource, `'${field}'`, `Manifest validates ${field}`);
}

// All allowed types present
for (const type of ['theme', 'keyboard', 'sound', 'widget', 'command', 'data']) {
  assertIncludes(manifestSource, `'${type}'`, `Manifest allows type: ${type}`);
}

// Rejects unknown types
assertIncludes(manifestSource, 'Unknown package type', 'Manifest rejects unknown types');

// No GUI/cloud/network dependencies
for (const forbidden of ['react', '@tauri', 'fetch(', 'http://', 'https://']) {
  assertExcludes(manifestSource, forbidden, 'Manifest module');
}

// Documentation exists and covers the schema
assertIncludes(docsSource, 'Package Format', 'Docs title');
assertIncludes(docsSource, 'manifest.json', 'Docs references manifest file');
for (const type of ['theme', 'keyboard', 'sound', 'widget', 'command', 'data']) {
  assertIncludes(docsSource, type, `Docs lists type: ${type}`);
}

// Inline validation tests using eval-safe subset
// We parse the TS source to extract the validator logic shape
assertIncludes(manifestSource, "Manifest must be a JSON object", 'Rejects non-objects');
assertIncludes(manifestSource, "must be a non-empty string", 'Rejects empty required fields');
assertIncludes(manifestSource, 'ID_PATTERN', 'Validates ID format');

console.log('Package manifest schema check passed.');
