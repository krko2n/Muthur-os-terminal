import { readMuthurConfig, renderMuthurConfig } from '../../core/config';

export function runConfigCommand(args: readonly string[] = []): number {
  const [subcommand] = args;

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    console.log([
      'muthur config',
      '',
      'Usage:',
      '  muthur config show',
      '',
      'Commands:',
      '  show    print the resolved local configuration',
    ].join('\n'));
    return 0;
  }

  if (subcommand !== 'show') {
    console.error(`Unknown config command: ${subcommand}`);
    console.error('Run `muthur config --help` for available config commands.');
    return 1;
  }

  const result = readMuthurConfig();
  console.log(renderMuthurConfig(result));
  return result.ok ? 0 : 1;
}
