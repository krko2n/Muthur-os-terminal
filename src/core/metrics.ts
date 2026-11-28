// UI-agnostic formatting and math for system metrics.
// No React, no Tauri, no Node APIs: shared by the GUI and covered by unit tests.

const KIB = 1024;
const MIB = KIB * 1024;
const GIB = MIB * 1024;

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Human-readable size: "512 B", "12 KiB", "340 MiB", "6.2 GiB". */
export function formatBytes(bytes: number): string {
  const value = finiteNonNegative(bytes);
  if (value >= GIB) return `${(value / GIB).toFixed(1)} GiB`;
  if (value >= MIB) return `${Math.round(value / MIB)} MiB`;
  if (value >= KIB) return `${Math.round(value / KIB)} KiB`;
  return `${Math.round(value)} B`;
}

/** Human-readable transfer rate: "0 B/s", "48 KiB/s", "1.4 MiB/s". */
export function formatRate(bytesPerSecond: number): string {
  const value = finiteNonNegative(bytesPerSecond);
  if (value >= MIB) return `${(value / MIB).toFixed(1)} MiB/s`;
  if (value >= KIB) return `${Math.round(value / KIB)} KiB/s`;
  return `${Math.round(value)} B/s`;
}

/** Percentage of `used` in `total`, clamped to 0..100. Returns 0 for an unknown total. */
export function usagePercent(used: number, total: number): number {
  const t = finiteNonNegative(total);
  if (t === 0) return 0;
  return Math.min(100, Math.max(0, (finiteNonNegative(used) / t) * 100));
}

/** Number of lit dots in a grid of `dotCount` for the given usage. */
export function litDotCount(used: number, total: number, dotCount: number): number {
  const count = Math.max(0, Math.floor(finiteNonNegative(dotCount)));
  return Math.round((usagePercent(used, total) / 100) * count);
}

/** Compact uptime: "45m", "5:05", "3d 4h". */
export function formatUptime(seconds: number): string {
  const s = Math.floor(finiteNonNegative(seconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}`;
  return `${minutes}m`;
}

export type StatusLevel = 'ok' | 'warn' | 'danger';

/**
 * Grades a usage percentage for colour-coding: "ok" below `warnAt`, "warn"
 * from `warnAt`, "danger" from `dangerAt`. Unknown or negative values are "ok".
 * Thresholds that arrive in the wrong order are swapped.
 */
export function statusLevel(percent: number, warnAt = 70, dangerAt = 90): StatusLevel {
  const value = finiteNonNegative(percent);
  const low = Math.min(warnAt, dangerAt);
  const high = Math.max(warnAt, dangerAt);
  if (value >= high) return 'danger';
  if (value >= low) return 'warn';
  return 'ok';
}

/** True only on the step into "danger", so an alarm sounds once per incident, not on every poll. */
export function enteredDanger(previous: StatusLevel | undefined, next: StatusLevel): boolean {
  return next === 'danger' && previous !== 'danger';
}
