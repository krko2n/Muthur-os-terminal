// Runtime check for the terminal-only CLI: builds it, then executes it.
// Requires no GUI, AI, cloud, or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(ROOT, 'dist-cli', 'muthur.cjs');
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

const cases = [
  [[], 0, 'stdout', 'Usage:'],
  [['--help'], 0, 'stdout', 'Usage:'],
  [['--version'], 0, 'stdout', `muthur ${VERSION}`],
  [['status'], 0, 'stdout', 'Terminal-only ready: yes'],
  [['config', 'show'], 0, 'stdout', 'missing, using defaults'],
  [['config', 'bogus'], 1, 'stderr', 'Unknown config command: bogus'],
  [['bogus'], 1, 'stderr', 'Unknown command: bogus'],
];

for (const [args, status, stream, text] of cases) {
  test(`muthur ${args.join(' ') || '(no args)'} exits ${status} and prints '${text}'`, () => {
    const result = run(args);
    assert.equal(result.status, status, result.stderr);
    assert.ok(result[stream].includes(text), `${stream} was:\n${result[stream]}`);
  });
}

test.after(() => fs.rmSync(configHome, { recursive: true, force: true }));
