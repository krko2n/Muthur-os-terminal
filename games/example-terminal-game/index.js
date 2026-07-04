import { fileURLToPath } from 'node:url';

export function run() {
  return [
    'Example Terminal Game',
    'This package is a placeholder entrypoint only.',
    'No game loop is implemented yet.',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(run());
}
