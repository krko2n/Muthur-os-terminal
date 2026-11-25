// Runtime check for the terminal-only CLI: builds it, then executes it.
// Requires no GUI, AI, cloud, or network.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(ROOT, 'dist-cli', 'muthur.mjs');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

const build = spawnSync(
  process.execPath,
  [
    '-r',
    './scripts/vite-no-cmd-netuse.cjs',
    './node_modules/vite/bin/vite.js',
    'build',
    '--config',
    'vite.cli.config.js',
    '--configLoader',
    'native',
    '--logLevel',
    'error',
  ],
  { cwd: ROOT, encoding: 'utf8' },
);

if (build.status !== 0 || !fs.existsSync(CLI)) {
  throw new Error(`CLI build failed:\n${build.stdout}\n${build.stderr}`);
}

const configHome = fs.mkdtempSync(path.join(os.tmpdir(), 'muthur-cli-test-'));
const env = { ...process.env, XDG_CONFIG_HOME: configHome };
delete env.MUTHUR_CONFIG;
delete env.MUTHUR_AI_MODEL;
delete env.MUTHUR_AI_BASE_URL;

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, env, encoding: 'utf8' });
}

function expect(args, status, stream, text) {
  const result = run(args);
  const label = `muthur ${args.join(' ') || '(no args)'}`;
  if (result.status !== status) {
    throw new Error(`${label} exited ${result.status}, expected ${status}\n${result.stderr}`);
  }
  if (!result[stream].includes(text)) {
    throw new Error(`${label} ${stream} is missing: ${text}`);
  }
}

try {
  expect([], 0, 'stdout', 'Usage:');
  expect(['--help'], 0, 'stdout', 'Usage:');
  expect(['--version'], 0, 'stdout', `muthur ${VERSION}`);
  expect(['status'], 0, 'stdout', 'Terminal-only ready: yes');
  expect(['config', 'show'], 0, 'stdout', 'missing, using defaults');
  expect(['config', 'bogus'], 1, 'stderr', 'Unknown config command: bogus');
  expect(['bogus'], 1, 'stderr', 'Unknown command: bogus');
} finally {
  fs.rmSync(configHome, { recursive: true, force: true });
}

console.log('CLI runtime check passed.');
