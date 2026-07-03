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

const permSource = read('src/security/permissions.ts');
const docsSource = read('docs/PLUGIN_FORMAT.md');

// Module exports required contract
assertIncludes(permSource, 'export const KNOWN_PERMISSIONS', 'Permissions exports list');
assertIncludes(permSource, 'export function validatePermissions', 'Permissions exports validator');
assertIncludes(permSource, 'export function renderPermissions', 'Permissions exports renderer');

// All known permissions present in source
const knownPerms = [
  'fs.read', 'fs.write', 'fs.delete',
  'process.spawn', 'process.signal',
  'net.local', 'net.outbound',
  'env.read', 'env.write',
  'clipboard.read', 'clipboard.write',
  'audio.play', 'notifications.show', 'system.info',
];
for (const perm of knownPerms) {
  assertIncludes(permSource, `'${perm}'`, `Known permission: ${perm}`);
}

// Rejects unknown permissions
assertIncludes(permSource, 'unknown', 'Validator tracks unknown permissions');

// No GUI/cloud/network dependencies
for (const forbidden of ['react', '@tauri', 'fetch(', 'http://', 'https://']) {
  assertExcludes(permSource, forbidden, 'Permissions module');
}

// Documentation covers permissions
assertIncludes(docsSource, 'Known permissions', 'Docs has known permissions section');
assertIncludes(docsSource, 'Validation behavior', 'Docs has validation section');
for (const perm of knownPerms) {
  assertIncludes(docsSource, perm, `Docs lists permission: ${perm}`);
}
assertIncludes(docsSource, 'unknown permission', 'Docs explains rejection');

console.log('Package permissions check passed.');
