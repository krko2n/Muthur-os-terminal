const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadTs } = require('../helpers/load-ts.cjs');

const { readMuthurConfig, resolveMuthurConfigPath, renderMuthurConfig } = loadTs('src/core/config.ts');

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
  const file = path.join(dir, 'config.json');
  fs.writeFileSync(file, contents);
  return file;
}

test('config path follows MUTHUR_CONFIG, then XDG_CONFIG_HOME', () => {
  withEnv({ MUTHUR_CONFIG: '/tmp/explicit.json', XDG_CONFIG_HOME: '/tmp/xdg' }, () => {
    assert.equal(resolveMuthurConfigPath(), '/tmp/explicit.json');
  });
  withEnv({ XDG_CONFIG_HOME: '/tmp/xdg' }, () => {
    assert.equal(resolveMuthurConfigPath(), path.join('/tmp/xdg', 'muthur', 'config.json'));
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
    const file = writeConfig(tempDir(), JSON.stringify({ ai: { model: 'mistral', baseUrl: '   ' } }));
    const result = readMuthurConfig(file);
    assert.equal(result.ok, true);
    assert.equal(result.config.ai.model, 'mistral');
    assert.equal(result.config.ai.baseUrl, 'http://localhost:11434', 'blank string keeps default');
    assert.deepEqual(result.sources, ['defaults', 'file']);

    const typed = readMuthurConfig(writeConfig(tempDir(), JSON.stringify({ ai: { model: 42 } })));
    assert.equal(typed.config.ai.model, 'llama3.2', 'non-string keeps default');
  });
});

test('environment variables override the file and are reported as sources', () => {
  const file = writeConfig(tempDir(), JSON.stringify({ ai: { model: 'mistral' } }));
  withEnv({ MUTHUR_AI_MODEL: 'qwen', MUTHUR_AI_BASE_URL: 'http://10.0.0.5:11434' }, () => {
    const result = readMuthurConfig(file);
    assert.equal(result.config.ai.model, 'qwen');
    assert.equal(result.config.ai.baseUrl, 'http://10.0.0.5:11434');
    assert.deepEqual(result.sources, ['defaults', 'file', 'MUTHUR_AI_MODEL', 'MUTHUR_AI_BASE_URL']);
  });
});

test('malformed JSON is reported as an error naming the file, not silently ignored', () => {
  withEnv({}, () => {
    const file = writeConfig(tempDir(), '{ "ai": ');
    const result = readMuthurConfig(file);
    assert.equal(result.ok, false);
    assert.match(result.error, /^Malformed config at /);
    assert.ok(result.error.includes(file));
    assert.match(renderMuthurConfig(result), /Muthur config error/);
  });
});
