interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function TerminalIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="none" opacity="0.3" />
      <polyline points="6,9 10,12 6,15" />
      <line x1="12" y1="15" x2="18" y2="15" />
    </svg>
  );
}

export function NetworkIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="none" opacity="0.3" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="9" opacity="0.5" />
      <line x1="12" y1="15" x2="12" y2="22" opacity="0.5" />
      <line x1="2" y1="7" x2="9" y2="10.5" opacity="0.5" />
      <line x1="15" y1="13.5" x2="22" y2="17" opacity="0.5" />
    </svg>
  );
}

export function CpuIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="none" opacity="0.3" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <line x1="10" y1="6" x2="10" y2="8" />
      <line x1="14" y1="6" x2="14" y2="8" />
      <line x1="10" y1="16" x2="10" y2="18" />
      <line x1="14" y1="16" x2="14" y2="18" />
      <line x1="6" y1="10" x2="8" y2="10" />
      <line x1="6" y1="14" x2="8" y2="14" />
      <line x1="16" y1="10" x2="18" y2="10" />
      <line x1="16" y1="14" x2="18" y2="14" />
    </svg>
  );
}

export function MemoryIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="none" opacity="0.3" />
      <rect x="5" y="8" width="14" height="8" rx="1" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="11" y1="10" x2="11" y2="14" />
      <line x1="14" y1="10" x2="14" y2="14" />
      <line x1="17" y1="10" x2="17" y2="14" />
    </svg>
  );
}

export function FileSystemIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="none" opacity="0.3" />
      <path d="M4 8v8a1 1 0 001 1h14a1 1 0 001-1v-6a1 1 0 00-1-1h-7l-1.5-2H5a1 1 0 00-1 1z" />
    </svg>
  );
}

export function AIIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="none" opacity="0.3" />
      <circle cx="12" cy="10" r="3" />
      <path d="M8 18c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      <circle cx="12" cy="10" r="1" fill={color} />
    </svg>
  );
}

export function GlobeIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="none" opacity="0.3" />
      <circle cx="12" cy="12" r="6" />
      <ellipse cx="12" cy="12" rx="3" ry="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

export function KeyboardIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="none" opacity="0.3" />
      <rect x="4" y="8" width="16" height="9" rx="1" />
      <line x1="7" y1="11" x2="9" y2="11" />
      <line x1="11" y1="11" x2="13" y2="11" />
      <line x1="15" y1="11" x2="17" y2="11" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  );
}
