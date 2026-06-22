const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.conf',
  '.css',
  '.desktop',
  '.example',
  '.html',
  '.json',
  '.md',
  '.rs',
  '.service',
  '.sh',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

const EXCLUDED = [
  /^\.git\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /^output\//,
  /^src-tauri\/gen\//,
  /^src-tauri\/target(?:-|\/|$)/,
  /^target(?:-|\/|$)/,
  /^tmp\//,
  /^package-lock\.json$/,
  /^src-tauri\/Cargo\.lock$/,
];

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: ROOT })
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
      .map(file => file.replaceAll('\\', '/'));
  } catch {
    return [];
  }
}

function shouldCheck(file) {
  if (EXCLUDED.some(pattern => pattern.test(file))) return false;
  return TEXT_EXTENSIONS.has(path.posix.extname(file).toLowerCase());
}

function readUtf8(file) {
  const bytes = fs.readFileSync(path.join(ROOT, file));
  if (bytes.includes(0)) return null;
  return bytes.toString('utf8');
}

const failures = [];

for (const file of trackedFiles().filter(shouldCheck)) {
  const text = readUtf8(file);
  if (text === null) {
    failures.push(`${file}: contains NUL bytes`);
    continue;
  }

  if (/^<<<<<<< |^=======$|^>>>>>>> /m.test(text)) {
    failures.push(`${file}: contains merge conflict markers`);
  }

  if (/\s$/.test(text) && !text.endsWith('\n') && !text.endsWith('\r\n')) {
    failures.push(`${file}: file ends with trailing whitespace`);
  }
}

for (const jsonFile of ['package.json', 'tsconfig.json', 'tsconfig.node.json', 'src-tauri/tauri.conf.json']) {
  try {
    JSON.parse(fs.readFileSync(path.join(ROOT, jsonFile), 'utf8'));
  } catch (error) {
    failures.push(`${jsonFile}: invalid JSON (${error.message})`);
  }
}

if (failures.length) {
  console.error('Format hygiene check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Format hygiene check passed.');
