import * as os from 'node:os';

export interface MuthurMemoryStatus {
  readonly totalBytes: number;
  readonly freeBytes: number;
  readonly usedBytes: number;
  readonly usedPercent: number;
}

export interface MuthurStatus {
  readonly name: 'Muthur';
  readonly mode: 'terminal-only';
  readonly platform: NodeJS.Platform;
  readonly arch: string;
  readonly hostname: string;
  readonly uptimeSeconds: number;
  readonly nodeVersion: string;
  readonly memory: MuthurMemoryStatus;
  readonly loadAverage: readonly [number, number, number];
  readonly terminalOnlyReady: boolean;
  readonly notes: readonly string[];
}

function percent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((used / total) * 1000) / 10;
}

function formatBytes(bytes: number): string {
  const gib = bytes / 1024 / 1024 / 1024;
  if (gib >= 1) return `${gib.toFixed(1)} GiB`;

  const mib = bytes / 1024 / 1024;
  return `${mib.toFixed(1)} MiB`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function readMuthurStatus(): MuthurStatus {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = Math.max(0, totalBytes - freeBytes);
  const loadAverage = os.loadavg() as [number, number, number];

  return {
    name: 'Muthur',
    mode: 'terminal-only',
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptimeSeconds: Math.floor(os.uptime()),
    nodeVersion: process.version,
    memory: {
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent: percent(usedBytes, totalBytes),
    },
    loadAverage,
    terminalOnlyReady: true,
    notes: [
      'GUI is not required for this status check.',
      'AI, cloud, and network access are not required.',
    ],
  };
}

export function renderMuthurStatus(status: MuthurStatus): string {
  return [
    `${status.name} status`,
    '',
    `Mode: ${status.mode}`,
    `Terminal-only ready: ${status.terminalOnlyReady ? 'yes' : 'no'}`,
    `Host: ${status.hostname}`,
    `Platform: ${status.platform} ${status.arch}`,
    `Uptime: ${formatUptime(status.uptimeSeconds)}`,
    `Memory: ${formatBytes(status.memory.usedBytes)} / ${formatBytes(status.memory.totalBytes)} (${status.memory.usedPercent}%)`,
    `Load average: ${status.loadAverage.map((value) => value.toFixed(2)).join(', ')}`,
    `Node: ${status.nodeVersion}`,
    '',
    'Notes:',
    ...status.notes.map((note) => `  - ${note}`),
  ].join('\n');
}
