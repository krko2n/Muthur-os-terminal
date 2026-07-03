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

const helpSource = read('src/cli/help.ts');
const mainSource = read('src/cli/main.ts');
const packageJson = JSON.parse(read('package.json'));

assertIncludes(helpSource, 'renderHelp', 'CLI help renderer');
assertIncludes(helpSource, 'Usage:', 'CLI help output');
assertIncludes(helpSource, 'Planned command groups:', 'CLI help output');

for (const group of ['shell', 'system', 'config', 'packages', 'security', 'wiki']) {
  assertIncludes(helpSource, `name: '${group}'`, 'CLI command group list');
}

assertIncludes(mainSource, "command === '--help'", 'CLI help argument handling');
assertIncludes(mainSource, "command === '--version'", 'CLI version argument handling');
assertIncludes(mainSource, `const CLI_VERSION = '${packageJson.version}'`, 'CLI version');

console.log('CLI help skeleton check passed.');
