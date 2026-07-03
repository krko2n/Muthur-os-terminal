export interface CliCommandGroup {
  readonly name: string;
  readonly summary: string;
  readonly plannedCommands: readonly string[];
}

export const CLI_COMMAND_GROUPS: readonly CliCommandGroup[] = [
  {
    name: 'shell',
    summary: 'terminal session helpers and shell entry points',
    plannedCommands: ['shell', 'exec'],
  },
  {
    name: 'system',
    summary: 'local status, diagnostics, and environment checks',
    plannedCommands: ['status', 'doctor'],
  },
  {
    name: 'config',
    summary: 'local configuration inspection and validation',
    plannedCommands: ['config show', 'config validate'],
  },
  {
    name: 'packages',
    summary: 'offline package manifest inspection and validation',
    plannedCommands: ['package inspect', 'package validate'],
  },
  {
    name: 'security',
    summary: 'permission and safety policy inspection',
    plannedCommands: ['permissions list', 'permissions check'],
  },
  {
    name: 'wiki',
    summary: 'offline help and reference lookup',
    plannedCommands: ['wiki search', 'wiki open'],
  },
];

export function renderHelp(version: string): string {
  const groups = CLI_COMMAND_GROUPS.map((group) => {
    const commands = group.plannedCommands.map((command) => `      - ${command}`).join('\n');
    return `  ${group.name}\n    ${group.summary}\n${commands}`;
  }).join('\n\n');

  return [
    `muthur ${version}`,
    '',
    'Usage:',
    '  muthur --help',
    '  muthur --version',
    '  muthur status',
    '  muthur config show',
    '  muthur <command> [options]',
    '',
    'Available commands:',
    '  status         print local terminal status',
    '  config show    print resolved local configuration',
    '',
    'Planned command groups:',
    groups,
    '',
    'Notes:',
    '  GUI, AI, cloud, and network access are optional.',
    '  Terminal-only mode must stay usable.',
    '  Command handlers are intentionally thin; core behavior belongs in shared services.',
  ].join('\n');
}

export function renderVersion(version: string): string {
  return `muthur ${version}`;
}
