require('./version-check.cjs');
require('./check-format.cjs');
require('./check-installer.cjs');
require('./check-command-safety.cjs');
require(process.cwd() + '/tests/unit/cli-help.cjs');
require(process.cwd() + '/tests/unit/cli-status.cjs');

console.log('Smoke tests passed.');
