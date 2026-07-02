const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function assertIncludes(file, needle, label = needle) {
  const text = read(file);
  if (!text.includes(needle)) {
    throw new Error(`${file}: missing ${label}`);
  }
}

function assertPattern(file, pattern, label) {
  const text = read(file);
  if (!pattern.test(text)) {
    throw new Error(`${file}: missing ${label}`);
  }
}

const install = read('scripts/install.sh');

for (const option of ['--dry-run', '--no-deps', '--no-ollama', '--prefix', '--quiet']) {
  assertIncludes('scripts/install.sh', option, `installer option ${option}`);
  assertIncludes('README.md', option, `README documentation for ${option}`);
}

assertPattern(
  'scripts/install.sh',
  /preflight[\s\S]*?if \[ "\$DRY_RUN" = "true" \][\s\S]*?exit 0[\s\S]*?install_deps/,
  'dry-run exits after preflight and before dependency installation'
);

assertIncludes(
  'scripts/install.sh',
  'Privileged operations that may be requested:',
  'dry-run/preflight privileged operation plan'
);

assertIncludes(
  'scripts/install.sh',
  'MUTHUR_ALLOW_PRIVILEGED_INSTALL',
  '--quiet privileged operation opt-in'
);

assertPattern(
  'scripts/install.sh',
  /--quiet refuses privileged changes without MUTHUR_ALLOW_PRIVILEGED_INSTALL=1/,
  '--quiet refuses privileged changes without explicit opt-in'
);

assertPattern(
  'scripts/install.sh',
  /confirm_privileged_operation[\s\S]*?Continue with this privileged operation\? \[y\/N\]/,
  'interactive confirmation before privileged installer operations'
);

assertIncludes(
  'scripts/install.sh',
  'confirm_launcher_privileged',
  'launcher prompts before runtime privileged operations'
);

assertIncludes(
  'scripts/install.sh',
  'MUTHUR_LAUNCHER_ALLOW_PRIVILEGED',
  'launcher privileged operation opt-in'
);

assertPattern(
  'scripts/install.sh',
  /if \[ "\$SKIP_DEPS" = "true" \][\s\S]*?else[\s\S]*?install_deps[\s\S]*?install_rust[\s\S]*?install_node/s,
  '--no-deps skips system, Rust, and Node dependency installation'
);

assertPattern(
  'scripts/install.sh',
  /SYSTEM_ASSETS="false"[\s\S]*?Native session files skipped for custom prefix/s,
  'custom prefixes skip system session files'
);

assertIncludes(
  'scripts/install.sh',
  'MUTHUR_OFFLINE_AI=0 bash "$SCRIPT_DIR/scripts/muthur-offline-pack.sh"',
  '--no-ollama disables optional offline AI pack installation'
);

assertIncludes('scripts/muthur-offline-pack.sh', 'No download starts until an offline module is accepted.');
assertIncludes('scripts/muthur-offline-pack.sh', 'MUTHUR_OFFLINE_AI');
assertIncludes('scripts/muthur-offline-pack.sh', 'MUTHUR_WIKI_ZIM_URL');
assertIncludes('scripts/muthur-offline-pack.sh', 'MUTHUR_MAPS_URL');

if (install.indexOf('preflight') > install.indexOf('install_deps')) {
  throw new Error('scripts/install.sh: preflight must run before dependency installation');
}

console.log('Installer safety check passed.');
