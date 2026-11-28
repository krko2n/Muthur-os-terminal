// npm test: fast repository checks, then behavioural unit tests (node:test).
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

require('./version-check.cjs');
require('./check-format.cjs');
require('./check-installer.cjs');

const unitDir = path.join(__dirname, '..', 'tests', 'unit');
const files = fs.readdirSync(unitDir).filter((f) => f.endsWith('.test.cjs')).sort().map((f) => path.join(unitDir, f));

const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], { stdio: 'inherit' });
if (result.status !== 0) {
  console.error('\nUnit tests failed.');
  process.exit(result.status ?? 1);
}
console.log('Smoke tests passed.');
