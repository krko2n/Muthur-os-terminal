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

const serviceSource = read('src/core/config.ts');
const handlerSource = read('src/cli/commands/config.ts');
const mainSource = read('src/cli/main.ts');
const helpSource = read('src/cli/help.ts');

assertIncludes(serviceSource, 'export interface MuthurConfig', 'Config service contract');
assertIncludes(serviceSource, 'export function resolveMuthurConfigPath', 'Config path resolver');
assertIncludes(serviceSource, 'export function readMuthurConfig', 'Config service reader');
assertIncludes(serviceSource, 'export function renderMuthurConfig', 'Config service renderer');
assertIncludes(serviceSource, 'JSON.parse', 'Config JSON parser');
assertIncludes(serviceSource, 'Malformed config at', 'Malformed config error');
assertIncludes(serviceSource, 'MUTHUR_CONFIG', 'Config path override');
assertIncludes(serviceSource, 'MUTHUR_AI_MODEL', 'Config env override');
assertIncludes(serviceSource, 'config.json', 'Default config path');

for (const forbidden of ['react', '@tauri', 'invoke(', 'fetch(', 'https://']) {
  assertExcludes(serviceSource, forbidden, 'Config service');
}

assertIncludes(handlerSource, "from '../../core/config'", 'CLI config handler');
assertIncludes(handlerSource, 'readMuthurConfig()', 'CLI config handler');
assertIncludes(handlerSource, 'renderMuthurConfig', 'CLI config handler');
assertExcludes(handlerSource, "from 'node:fs'", 'CLI config handler');
assertExcludes(handlerSource, 'JSON.parse', 'CLI config handler');

assertIncludes(mainSource, "command === 'config'", 'CLI config route');
assertIncludes(mainSource, 'runConfigCommand(rest)', 'CLI config route');
assertIncludes(helpSource, 'muthur config show', 'CLI help config usage');
assertIncludes(helpSource, 'config show    print resolved local configuration', 'CLI help config command');

console.log('CLI config check passed.');
