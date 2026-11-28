// Loads a TypeScript module from src/ for behavioural tests, without a build
// step or extra dependencies: each file (and its relative imports) is
// transpiled to CommonJS with the project's own TypeScript compiler.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..', '..');
const cache = new Map();

function resolveTs(fromDir, specifier) {
  const base = path.resolve(fromDir, specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`Cannot resolve '${specifier}' from ${fromDir}`);
}

function loadFile(file) {
  if (cache.has(file)) return cache.get(file).exports;

  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;

  const mod = { exports: {} };
  cache.set(file, mod);
  const localRequire = (specifier) =>
    specifier.startsWith('.') ? loadFile(resolveTs(path.dirname(file), specifier)) : require(specifier);
  new Function('exports', 'require', 'module', '__filename', '__dirname', output)(
    mod.exports, localRequire, mod, file, path.dirname(file),
  );
  return mod.exports;
}

/** loadTs('src/core/metrics.ts') -> the module's exports. */
function loadTs(relativePath) {
  return loadFile(path.join(ROOT, relativePath));
}

/** Clears the module cache so a module re-reads process.env on next load. */
function resetTsCache() {
  cache.clear();
}

module.exports = { loadTs, resetTsCache, ROOT };
