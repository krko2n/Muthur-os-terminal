const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../helpers/load-ts.cjs');

const { formatBytes, formatRate, usagePercent, litDotCount, formatUptime, statusLevel, enteredDanger } = loadTs('src/core/metrics.ts');

const GIB = 1024 ** 3;

test('formatBytes picks the largest sensible binary unit', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(12 * 1024), '12 KiB');
  assert.equal(formatBytes(340 * 1024 ** 2), '340 MiB');
  assert.equal(formatBytes(6.24 * GIB), '6.2 GiB');
});

test('formatBytes treats invalid input as zero instead of printing NaN', () => {
  for (const bad of [NaN, -5, Infinity, undefined]) {
    assert.equal(formatBytes(bad), '0 B', `input ${bad}`);
  }
});

test('formatRate renders per-second rates', () => {
  assert.equal(formatRate(0), '0 B/s');
  assert.equal(formatRate(48 * 1024), '48 KiB/s');
  assert.equal(formatRate(1.4 * 1024 ** 2), '1.4 MiB/s');
});

test('usagePercent is clamped and safe for an unknown total', () => {
  assert.equal(usagePercent(4, 16), 25);
  assert.equal(usagePercent(20, 16), 100);
  assert.equal(usagePercent(5, 0), 0);
  assert.equal(usagePercent(-1, 16), 0);
});

test('litDotCount maps usage onto the memory grid', () => {
  assert.equal(litDotCount(0, 16, 320), 0);
  assert.equal(litDotCount(8, 16, 320), 160);
  assert.equal(litDotCount(16, 16, 320), 320);
  assert.equal(litDotCount(16, 0, 320), 0, 'unknown total lights nothing');
});

test('formatUptime switches format by magnitude', () => {
  assert.equal(formatUptime(45 * 60), '45m');
  assert.equal(formatUptime(5 * 3600 + 5 * 60), '5:05');
  assert.equal(formatUptime(3 * 86400 + 4 * 3600), '3d 4h');
  assert.equal(formatUptime(-10), '0m');
});

test('statusLevel grades usage into ok, warn and danger at the thresholds', () => {
  assert.equal(statusLevel(0), 'ok');
  assert.equal(statusLevel(69.9), 'ok');
  assert.equal(statusLevel(70), 'warn');
  assert.equal(statusLevel(89.9), 'warn');
  assert.equal(statusLevel(90), 'danger');
  assert.equal(statusLevel(100), 'danger');
  assert.equal(statusLevel(50, 40, 60), 'warn');
});

test('statusLevel treats unknown values as ok and tolerates swapped thresholds', () => {
  for (const bad of [NaN, -5, undefined]) {
    assert.equal(statusLevel(bad), 'ok', `input ${bad}`);
  }
  assert.equal(statusLevel(95, 90, 70), 'danger');
  assert.equal(statusLevel(75, 90, 70), 'warn');
});

test('enteredDanger fires once when a reading crosses into danger', () => {
  assert.equal(enteredDanger(undefined, 'danger'), true);
  assert.equal(enteredDanger('ok', 'danger'), true);
  assert.equal(enteredDanger('warn', 'danger'), true);
  assert.equal(enteredDanger('danger', 'danger'), false, 'no repeat while it stays red');
  assert.equal(enteredDanger('danger', 'warn'), false);
  assert.equal(enteredDanger('ok', 'warn'), false);
});
