// Status colours must mean the same thing in every theme (green = fine,
// orange = worth a look, red = dangerous) and stay readable on the theme's
// background, otherwise a red alert can disappear into a blue or red theme.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../helpers/load-ts.cjs');

const { THEME_PRESETS, getStatusColors } = loadTs('src/theme.ts');

function rgb(hex) {
  assert.match(hex, /^#[0-9a-f]{6}$/i, `not a #rrggbb colour: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
}
function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function hue(hex) {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
function saturation(hex) {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
}

test('every theme has green, orange and red status colours readable on its background', () => {
  for (const theme of THEME_PRESETS) {
    const { ok, warn, danger } = getStatusColors(theme);
    for (const [name, colour] of Object.entries({ ok, warn, danger })) {
      assert.ok(contrast(colour, theme.background) >= 3, `${theme.id} ${name} ${colour} contrast ${contrast(colour, theme.background).toFixed(1)} < 3`);
    }
    const okHue = hue(ok);
    const warnHue = hue(warn);
    const dangerHue = hue(danger);
    assert.ok(okHue >= 75 && okHue <= 170, `${theme.id} ok ${ok} is not green (hue ${Math.round(okHue)})`);
    assert.ok(warnHue >= 20 && warnHue <= 55, `${theme.id} warn ${warn} is not orange (hue ${Math.round(warnHue)})`);
    assert.ok(dangerHue >= 330 || dangerHue <= 15, `${theme.id} danger ${danger} is not red (hue ${Math.round(dangerHue)})`);
  }
});

test('GREEN TERMINAL is green on pure black', () => {
  const theme = THEME_PRESETS.find((t) => t.id === 'terminal');
  assert.ok(theme, 'GREEN TERMINAL theme missing');
  assert.equal(theme.background, '#000000');
  const h = hue(theme.accent);
  assert.ok(h >= 100 && h <= 150, `accent ${theme.accent} is not green`);
});

test('GREY OPS uses grey chrome so only the status colours carry colour', () => {
  const theme = THEME_PRESETS.find((t) => t.id === 'greyops');
  assert.ok(theme, 'GREY OPS theme missing');
  assert.ok(saturation(theme.accent) < 0.15, `accent ${theme.accent} is not grey`);
  assert.ok(saturation(theme.text) < 0.15, `text ${theme.text} is not grey`);
  const { ok, warn, danger } = getStatusColors(theme);
  for (const colour of [ok, warn, danger]) {
    assert.ok(saturation(colour) > 0.6, `status colour ${colour} is too washed out to stand out`);
  }
});

test('themes without their own status colours get the shared defaults', () => {
  const plain = { accent: '#4fd1ff', danger: '#ffe064' }; // cyan accent, yellow "danger"
  const status = getStatusColors(plain);
  assert.notEqual(status.ok, plain.accent, 'a non-green accent must not mean ok');
  assert.notEqual(status.danger, plain.danger, 'a yellow danger colour must not mean danger');
  const green = getStatusColors({ accent: '#00ff41', danger: '#ff3b53' });
  assert.equal(green.ok, '#00ff41');
  assert.equal(green.danger, '#ff3b53');
});
