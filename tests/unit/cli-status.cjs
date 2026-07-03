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

const serviceSource = read('src/core/status.ts');
const handlerSource = read('src/cli/commands/status.ts');
const mainSource = read('src/cli/main.ts');
const helpSource = read('src/cli/help.ts');

assertIncludes(serviceSource, 'export interface MuthurStatus', 'Status service contract');
assertIncludes(serviceSource, 'export function readMuthurStatus', 'Status service reader');
assertIncludes(serviceSource, 'export function renderMuthurStatus', 'Status service renderer');
assertIncludes(serviceSource, "import * as os from 'node:os'", 'Status service local OS dependency');

for (const forbidden of ['react', '@tauri', 'invoke(', 'fetch(', 'https://']) {
  assertExcludes(serviceSource, forbidden, 'Status service');
}

assertIncludes(handlerSource, "from '../../core/status'", 'CLI status handler');
assertIncludes(handlerSource, 'readMuthurStatus()', 'CLI status handler');
assertIncludes(handlerSource, 'renderMuthurStatus', 'CLI status handler');
assertExcludes(handlerSource, "from 'node:os'", 'CLI status handler');
assertExcludes(handlerSource, "from 'node:os'", 'CLI status handler');

assertIncludes(mainSource, "command === 'status'", 'CLI status route');
assertIncludes(mainSource, 'runStatusCommand()', 'CLI status route');
assertIncludes(helpSource, 'muthur status', 'CLI help status usage');
assertIncludes(helpSource, 'status         print local terminal status', 'CLI help status command');

console.log('CLI status skeleton check passed.');
