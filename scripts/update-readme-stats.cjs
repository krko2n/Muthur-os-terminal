const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const README = path.join(ROOT, 'README.md');
const START = '<!-- MUTHUR-STATS:START -->';
const END = '<!-- MUTHUR-STATS:END -->';

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

const TEXT_FILENAMES = new Set([
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'DEVELOPMENT.md',
  'GNUmakefile',
  'LICENSE',
  'Makefile',
  'QUICKSTART.md',
  'README.md',
  'RELEASE.md',
  'SECURITY.md',
]);

const EXCLUDED = [
  /^\.git\//,
  /^dist(?:-|\/|$)/,
  /^dist-verify(?:-|\/|$)/,
  /^node_modules\//,
  /^output\//,
  /^src-tauri\/gen\//,
  /^src-tauri\/target(?:-|\/|$)/,
  /^target(?:-|\/|$)/,
  /^tmp\//,
  /^package-lock\.json$/,
  /^src-tauri\/Cargo\.lock$/,
  /\.(?:avif|gif|icns|ico|jpeg|jpg|mbtiles|ogg|pdf|png|ttf|wav|woff2|zip)$/i,
];

const EXCLUDED_DIRS = new Set([
  '.git',
  'dist',
  'node_modules',
  'output',
  'tmp',
]);

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT })
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
      .map((file) => file.replaceAll('\\', '/'));
  } catch {
    return scannedFiles();
  }
}

function scannedFiles(dir = ROOT, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(ROOT, absolute).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      if (/^dist-verify/.test(entry.name)) continue;
      if (/^target/.test(entry.name)) continue;
      if (relative === 'src-tauri/gen') continue;
      if (relative.startsWith('src-tauri/target')) continue;
      scannedFiles(absolute, results);
      continue;
    }

    results.push(relative);
  }
  return results;
}

function isCounted(file) {
  if (EXCLUDED.some((pattern) => pattern.test(file))) return false;
  const base = path.posix.basename(file);
  const ext = path.posix.extname(file).toLowerCase();
  return TEXT_FILENAMES.has(base) || TEXT_EXTENSIONS.has(ext);
}

function lineCount(file) {
  const bytes = fs.readFileSync(path.join(ROOT, file));
  if (bytes.includes(0)) return 0;
  const text = bytes.toString('utf8');
  if (!text) return 0;
  return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function shieldSegment(value) {
  return encodeURIComponent(value).replace(/-/g, '--').replace(/_/g, '__');
}

function badge(label, value, color) {
  return `https://img.shields.io/badge/${shieldSegment(label)}-${shieldSegment(value)}-${color}?style=flat-square&labelColor=161b22`;
}

const allFiles = trackedFiles();
const totalFiles = allFiles.length;
const lines = allFiles.reduce((sum, file) => sum + lineCount(file), 0);
const generated = [
  START,
  `![Lines of Code](${badge('lines of code', formatNumber(lines), 'c9d1d9')})`,
  `![Total Files](${badge('total files', formatNumber(totalFiles), 'c9d1d9')})`,
  END,
].join('\n');

const readme = fs.readFileSync(README, 'utf8');
const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
if (!pattern.test(readme)) {
  throw new Error(`README.md is missing ${START}/${END} markers`);
}

const next = readme.replace(pattern, generated);
fs.writeFileSync(README, next);

console.log(`README stats updated: ${formatNumber(lines)} lines, ${formatNumber(totalFiles)} files`);
