const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadTs } = require('../helpers/load-ts.cjs');

const { readMuthurConfig, resolveMuthurConfigPath, renderMuthurConfig, parseConfigToml } = loadTs('src/core/config.ts');
const { ROOT } = require('../helpers/load-ts.cjs');

const ENV_KEYS = ['MUTHUR_CONFIG', 'MUTHUR_AI_MODEL', 'MUTHUR_AI_BASE_URL', 'XDG_CONFIG_HOME'];

function withEnv(overrides, fn) {
  const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  Object.assign(process.env, overrides);
  try {
    return fn();
  } finally {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'muthur-config-test-'));
}

function writeConfig(dir, contents) {
  const file = path.join(dir, 'config.toml');
  fs.writeFileSync(file, contents);
  return file;
}

test('the CLI reads config.toml, the same file the GUI backend and installer use', () => {
  withEnv({ XDG_CONFIG_HOME: '/tmp/xdg' }, () => {
    assert.ok(resolveMuthurConfigPath().endsWith(path.join('muthur', 'config.toml')));
  });
});

test('the shipped example config parses and sets the documented defaults', () => {
  const example = fs.readFileSync(path.join(ROOT, 'examples/config.toml.example'), 'utf8');
  const parsed = parseConfigToml(example);
  assert.equal(parsed.ai.model, 'llama3.2');
});

test('config path follows MUTHUR_CONFIG, then XDG_CONFIG_HOME', () => {
  withEnv({ MUTHUR_CONFIG: '/tmp/explicit.json', XDG_CONFIG_HOME: '/tmp/xdg' }, () => {
    assert.equal(resolveMuthurConfigPath(), '/tmp/explicit.json');
  });
  withEnv({ XDG_CONFIG_HOME: '/tmp/xdg' }, () => {
    assert.equal(resolveMuthurConfigPath(), path.join('/tmp/xdg', 'muthur', 'config.toml'));
  });
});

test('missing config file falls back to defaults and still succeeds', () => {
  withEnv({}, () => {
    const result = readMuthurConfig(path.join(tempDir(), 'absent.json'));
    assert.equal(result.ok, true);
    assert.equal(result.exists, false);
    assert.deepEqual(result.sources, ['defaults']);
    assert.equal(result.config.ai.model, 'llama3.2');
    assert.equal(result.config.ai.baseUrl, 'http://localhost:11434');
  });
});

test('values from the file override defaults; blank or wrong-typed values do not', () => {
  withEnv({}, () => {
    const file = writeConfig(tempDir(), '# comment\n[ai]\nmodel = "mistral"  # inline\nbase_url = "   "\n');
    const result = readMuthurConfig(file);
    assert.equal(result.ok, true);
    assert.equal(result.config.ai.model, 'mistral');
    assert.equal(result.config.ai.baseUrl, 'http://localhost:11434', 'blank string keeps default');
    assert.deepEqual(result.sources, ['defaults', 'file']);

    const typed = readMuthurConfig(writeConfig(tempDir(), '[ai]\nmodel = 42\n'));
    assert.equal(typed.config.ai.model, 'llama3.2', 'non-string keeps default');
  });
});

test('environment variables override the file and are reported as sources', () => {
  const file = writeConfig(tempDir(), '[ai]\nmodel = "mistral"\n');
  withEnv({ MUTHUR_AI_MODEL: 'qwen', MUTHUR_AI_BASE_URL: 'http://10.0.0.5:11434' }, () => {
    const result = readMuthurConfig(file);
    assert.equal(result.config.ai.model, 'qwen');
    assert.equal(result.config.ai.baseUrl, 'http://10.0.0.5:11434');
    assert.deepEqual(result.sources, ['defaults', 'file', 'MUTHUR_AI_MODEL', 'MUTHUR_AI_BASE_URL']);
  });
});

test('malformed config is reported as an error naming the file and line, not silently ignored', () => {
  withEnv({}, () => {
    const file = writeConfig(tempDir(), '[ai]\nmodel = "ok"\nthis is not toml\n');
    const result = readMuthurConfig(file);
    assert.equal(result.ok, false);
    assert.match(result.error, /^Malformed config at /);
    assert.ok(result.error.includes(file));
    assert.match(result.error, /line 3/);
    assert.match(renderMuthurConfig(result), /Muthur config error/);
  });
});
