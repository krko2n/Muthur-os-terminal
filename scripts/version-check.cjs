const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function json(relativePath) {
  return JSON.parse(read(relativePath));
}

function requireMatch(relativePath, pattern, label) {
  const match = read(relativePath).match(pattern);
  if (!match) {
    throw new Error(`${label} was not found in ${relativePath}`);
  }
  return match[1];
}

const packageVersion = json('package.json').version;
const checks = [
  ['package-lock.json root', json('package-lock.json').version],
  ['package-lock.json package', json('package-lock.json').packages[''].version],
  [
    'src-tauri/Cargo.toml',
    requireMatch('src-tauri/Cargo.toml', /^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/m, 'Cargo package version'),
  ],
  ['src-tauri/tauri.conf.json', json('src-tauri/tauri.conf.json').version],
  ['scripts/install.sh', requireMatch('scripts/install.sh', /^VERSION="([^"]+)"/m, 'installer version')],
];

const mismatches = checks
  .filter(([, version]) => version !== packageVersion)
  .map(([label, version]) => `${label}: ${version}`);

const versionFamily = packageVersion.split('.').slice(0, 2).join('.');
if (!read('SECURITY.md').includes(`${versionFamily}.x`)) {
  mismatches.push(`SECURITY.md: missing supported ${versionFamily}.x line`);
}

if (!read('CHANGELOG.md').includes(`## [${packageVersion}]`)) {
  mismatches.push(`CHANGELOG.md: missing ${packageVersion} entry`);
}

if (mismatches.length) {
  console.error(`Version check failed. package.json declares ${packageVersion}, but found:`);
  for (const mismatch of mismatches) console.error(`- ${mismatch}`);
  process.exit(1);
}

console.log(`Version check passed: ${packageVersion}`);
