const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const PACK_DIR = path.join(ROOT, 'packs', 'survival-pack');
const manifestPath = path.join(PACK_DIR, 'manifest.json');
const readmePath = path.join(PACK_DIR, 'README.md');
const jsonlPath = path.join(PACK_DIR, 'wiki', 'survival-field-manual.placeholder.jsonl');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

assert(fs.existsSync(manifestPath), 'Survival pack manifest is missing.');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (const field of ['id', 'name', 'version', 'type']) {
  assert(typeof manifest[field] === 'string' && manifest[field].length > 0, `Manifest field missing: ${field}`);
}

assert(manifest.type === 'data', 'Survival pack manifest type must be data.');
assert(fs.existsSync(readmePath), 'Survival pack README is missing.');
assert(fs.existsSync(jsonlPath), 'Survival pack placeholder JSONL is missing.');

const jsonlSource = fs.readFileSync(jsonlPath, 'utf8').trim();
assert(jsonlSource.length > 0, 'Survival pack placeholder JSONL is empty.');

for (const [index, line] of jsonlSource.split(/\r?\n/).entries()) {
  const entry = JSON.parse(line);
  for (const field of ['title', 'source', 'category', 'text']) {
    assert(typeof entry[field] === 'string' && entry[field].length > 0, `JSONL line ${index + 1} missing field: ${field}`);
  }
}

const packSource = [
  read('packs/survival-pack/manifest.json'),
  read('packs/survival-pack/README.md'),
  read('packs/survival-pack/wiki/survival-field-manual.placeholder.jsonl'),
  read('packs/survival-pack/checklists/README.md'),
  read('packs/survival-pack/maps/README.md'),
  read('packs/survival-pack/radio/README.md'),
  read('packs/survival-pack/power/README.md'),
  read('packs/survival-pack/medical/README.md'),
  read('packs/survival-pack/docs/README.md'),
].join('\n').toLowerCase();

for (const forbidden of ['http://', 'https://', 'api key', 'password', 'token', 'private key']) {
  assert(!packSource.includes(forbidden), `Survival pack contains forbidden string: ${forbidden}`);
}

for (const forbidden of ['react', '@tauri', 'fetch(', 'network dependency']) {
  assert(!packSource.includes(forbidden), `Survival pack must not require ${forbidden}`);
}

console.log('Survival pack placeholder check passed.');
