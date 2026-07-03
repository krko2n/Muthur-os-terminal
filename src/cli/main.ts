import { runConfigCommand } from './commands/config';
import { runStatusCommand } from './commands/status';
import { renderHelp, renderVersion } from './help';

const CLI_VERSION = '0.1.1';

export function runCli(args: readonly string[] = []): number {
  const [command, ...rest] = args;

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    console.log(renderHelp(CLI_VERSION));
    return 0;
  }

  if (command === '--version' || command === '-v' || command === 'version') {
    console.log(renderVersion(CLI_VERSION));
    return 0;
  }

  if (command === 'status') {
    return runStatusCommand();
  }

  if (command === 'config') {
    return runConfigCommand(rest);
  }

  console.error(`Unknown command: ${command}`);
  console.error('Run `muthur --help` for available command groups.');
  return 1;
}

runCli(process.argv.slice(2));
