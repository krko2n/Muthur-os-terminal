const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const { loadTs } = require('../helpers/load-ts.cjs');

const { readMuthurStatus, renderMuthurStatus } = loadTs('src/core/status.ts');

test('status reads real host facts without GUI, AI, or network', () => {
  const status = readMuthurStatus();
  assert.equal(status.mode, 'terminal-only');
  assert.equal(status.hostname, os.hostname());
  assert.equal(status.platform, os.platform());
  assert.ok(status.memory.totalBytes > 0);
  assert.ok(status.memory.usedBytes >= 0 && status.memory.usedBytes <= status.memory.totalBytes);
  assert.ok(status.memory.usedPercent >= 0 && status.memory.usedPercent <= 100);
  assert.equal(status.loadAverage.length, 3);
});

test('rendered status contains the fields users rely on', () => {
  const text = renderMuthurStatus(readMuthurStatus());
  for (const label of ['Mode: terminal-only', 'Terminal-only ready:', 'Host:', 'Memory:', 'Uptime:']) {
    assert.ok(text.includes(label), `missing '${label}'`);
  }
  assert.doesNotMatch(text, /NaN|undefined/);
});
