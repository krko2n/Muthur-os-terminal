require('./version-check.cjs');
require('./check-format.cjs');
require('./check-installer.cjs');
require('./check-command-safety.cjs');
require(process.cwd() + '/tests/unit/cli-help.cjs');
require(process.cwd() + '/tests/unit/cli-status.cjs');
require(process.cwd() + '/tests/unit/cli-config.cjs');
require(process.cwd() + '/tests/unit/package-manifest.cjs');
require(process.cwd() + '/tests/unit/package-permissions.cjs');
require(process.cwd() + '/tests/unit/survival-pack.cjs');

console.log('Smoke tests passed.');
