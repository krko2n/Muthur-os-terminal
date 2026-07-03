export const KNOWN_PERMISSIONS = [
  'fs.read',
  'fs.write',
  'fs.delete',
  'process.spawn',
  'process.signal',
  'net.local',
  'net.outbound',
  'env.read',
  'env.write',
  'clipboard.read',
  'clipboard.write',
  'audio.play',
  'notifications.show',
  'system.info',
] as const;

export type KnownPermission = (typeof KNOWN_PERMISSIONS)[number];

export interface PermissionValidationOk {
  readonly ok: true;
  readonly permissions: KnownPermission[];
}

export interface PermissionValidationError {
  readonly ok: false;
  readonly unknown: string[];
  readonly valid: KnownPermission[];
}

export type PermissionValidationResult = PermissionValidationOk | PermissionValidationError;

export function validatePermissions(requested: unknown): PermissionValidationResult {
  if (!Array.isArray(requested)) {
    return { ok: false, unknown: [], valid: [] };
  }

  const valid: KnownPermission[] = [];
  const unknown: string[] = [];

  for (const entry of requested) {
    if (typeof entry !== 'string') {
      unknown.push(String(entry));
      continue;
    }
    if ((KNOWN_PERMISSIONS as readonly string[]).includes(entry)) {
      valid.push(entry as KnownPermission);
    } else {
      unknown.push(entry);
    }
  }

  if (unknown.length > 0) {
    return { ok: false, unknown, valid };
  }

  return { ok: true, permissions: valid };
}

export function renderPermissions(requested: KnownPermission[]): string {
  if (requested.length === 0) {
    return 'No permissions requested.';
  }

  const lines = [
    'Requested permissions:',
    '',
    ...requested.map((p) => `  - ${p}  ${describePermission(p)}`),
  ];
  return lines.join('\n');
}

function describePermission(permission: KnownPermission): string {
  const descriptions: Record<KnownPermission, string> = {
    'fs.read': 'read files from disk',
    'fs.write': 'write files to disk',
    'fs.delete': 'delete files from disk',
    'process.spawn': 'start child processes',
    'process.signal': 'send signals to processes',
    'net.local': 'connect to local network services',
    'net.outbound': 'make outbound network requests',
    'env.read': 'read environment variables',
    'env.write': 'modify environment variables',
    'clipboard.read': 'read from clipboard',
    'clipboard.write': 'write to clipboard',
    'audio.play': 'play audio',
    'notifications.show': 'show system notifications',
    'system.info': 'read system information',
  };
  return descriptions[permission];
}
