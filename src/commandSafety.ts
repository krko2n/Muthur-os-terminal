export interface CommandRisk {
  pattern: RegExp;
  reason: string;
}

export const COMMAND_RISK_RULES: CommandRisk[] = [
  {
    pattern: /\brm\s+-(?=[^\n;&|]*r)(?=[^\n;&|]*f)[^\n;&|]*/i,
    reason: 'forced recursive deletion',
  },
  {
    pattern: /\b(?:mkfs(?:\.\w+)?|wipefs|fdisk|parted|sgdisk|gdisk|cfdisk|sfdisk|cryptsetup\s+luksFormat)\b/i,
    reason: 'disk partitioning, formatting, or wipe operation',
  },
  {
    pattern: /(^|[\s;&|])dd\s+[^;\n]*(?:of=\/dev\/|if=\/dev\/)/i,
    reason: 'raw block-device copy',
  },
  {
    pattern: /\b(?:curl|wget)\b[^\n|;&]*(?:\||\s+-O\s+-|\s+-qO\s+-|\s+-q\s+-O\s+-)[^\n]*(?:sh|bash|zsh|fish)\b/i,
    reason: 'remote script piped into a shell',
  },
  {
    pattern: /\bchmod\s+-R\b[^\n;&|]*\b777\b/i,
    reason: 'recursive world-writable permission change',
  },
  {
    pattern: /\bchown\s+-R\b/i,
    reason: 'recursive ownership change',
  },
  {
    pattern: /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/,
    reason: 'fork-bomb pattern',
  },
  {
    pattern: /(^|[\s;&|])sudo\b/i,
    reason: 'privilege escalation through sudo',
  },
  {
    pattern: /\b(?:apt(?:-get)?|dnf|yum|zypper)\s+(?:install|remove|purge|upgrade|dist-upgrade|autoremove)\b/i,
    reason: 'system package install, removal, or upgrade',
  },
  {
    pattern: /\bpacman\s+-(?:S|R|Syu|Sy|Rc|Rns)\b/i,
    reason: 'system package install, removal, or upgrade',
  },
  {
    pattern: /\b(?:brew|npm|pnpm|yarn|pip|pipx|cargo)\s+(?:install|remove|uninstall|update|upgrade)\b/i,
    reason: 'package install, removal, or upgrade',
  },
  {
    pattern: /\bsystemctl\s+(?:enable|disable|start|stop|restart|reload|mask|unmask)\b/i,
    reason: 'service state change',
  },
];

export function detectCommandRisks(command: string): string[] {
  const reasons = new Set<string>();
  for (const rule of COMMAND_RISK_RULES) {
    if (rule.pattern.test(command)) {
      reasons.add(rule.reason);
    }
  }
  return Array.from(reasons);
}

export function isDangerousCommand(command: string): boolean {
  return detectCommandRisks(command).length > 0;
}
