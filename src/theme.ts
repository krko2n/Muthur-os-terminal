export type ThemeId = 'mother' | 'amber' | 'cryo' | 'surgical' | 'noir';
export type FontId = 'sharetech' | 'orbitron' | 'rajdhani' | 'audiowide';
export type LayoutPresetId = 'command' | 'focus' | 'wide' | 'simulation' | 'custom';

export interface ThemePreset {
  id: ThemeId;
  label: string;
  accent: string;
  background: string;
  panel: string;
  grey: string;
  text: string;
  danger: string;
}

export interface FontPreset {
  id: FontId;
  label: string;
  ui: string;
  display: string;
  mono: string;
}

export interface LayoutSettings {
  leftWidth: number;
  rightWidth: number;
  bottomHeight: number;
  deckSplit: number;
}

export interface LayoutPreset {
  id: LayoutPresetId;
  label: string;
  layout: LayoutSettings;
}

export interface InterfaceSettings {
  themeId: ThemeId;
  fontId: FontId;
  layoutPreset: LayoutPresetId;
  audioEnabled: boolean;
  audioVolume: number;
  layout: LayoutSettings;
}

const STORAGE_KEY = 'muthur-interface-settings';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'mother',
    label: 'MOTHER',
    accent: '#00ff41',
    background: '#05080d',
    panel: '#081017',
    grey: '#1a1e22',
    text: '#aacfd1',
    danger: '#ff3b53',
  },
  {
    id: 'amber',
    label: 'AMBER',
    accent: '#ffb13b',
    background: '#070705',
    panel: '#16110a',
    grey: '#21190d',
    text: '#f0d2a0',
    danger: '#ff4d2f',
  },
  {
    id: 'cryo',
    label: 'CRYO',
    accent: '#48ddff',
    background: '#03090d',
    panel: '#061822',
    grey: '#10242d',
    text: '#bcefff',
    danger: '#ff4b6a',
  },
  {
    id: 'surgical',
    label: 'SURGICAL',
    accent: '#98ffd3',
    background: '#04100d',
    panel: '#071813',
    grey: '#102620',
    text: '#dcfff1',
    danger: '#ff5570',
  },
  {
    id: 'noir',
    label: 'NOIR',
    accent: '#f6f1dc',
    background: '#050505',
    panel: '#0c0c0c',
    grey: '#1c1c1c',
    text: '#d4d0bd',
    danger: '#ff364f',
  },
];

export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'sharetech',
    label: 'SHARE TECH',
    ui: "'Share Tech', 'Rajdhani', sans-serif",
    display: "'Share Tech Mono', 'Orbitron', monospace",
    mono: "'Share Tech Mono', 'Courier New', monospace",
  },
  {
    id: 'orbitron',
    label: 'ORBITRON',
    ui: "'Rajdhani', 'Share Tech', sans-serif",
    display: "'Orbitron', 'Share Tech Mono', sans-serif",
    mono: "'Orbitron', 'Share Tech Mono', 'Courier New', monospace",
  },
  {
    id: 'rajdhani',
    label: 'RAJDHANI',
    ui: "'Rajdhani', 'Share Tech', sans-serif",
    display: "'Rajdhani', 'Orbitron', sans-serif",
    mono: "'Rajdhani', 'Share Tech Mono', 'Courier New', monospace",
  },
  {
    id: 'audiowide',
    label: 'AUDIOWIDE',
    ui: "'Rajdhani', 'Share Tech', sans-serif",
    display: "'Audiowide', 'Orbitron', sans-serif",
    mono: "'Audiowide', 'Share Tech Mono', 'Courier New', monospace",
  },
];

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: 'command', label: 'COMMAND', layout: { leftWidth: 22, rightWidth: 22, bottomHeight: 35, deckSplit: 43 } },
  { id: 'focus', label: 'FOCUS', layout: { leftWidth: 16, rightWidth: 18, bottomHeight: 28, deckSplit: 36 } },
  { id: 'wide', label: 'WIDE', layout: { leftWidth: 19, rightWidth: 16, bottomHeight: 32, deckSplit: 30 } },
  { id: 'simulation', label: 'SIM', layout: { leftWidth: 20, rightWidth: 24, bottomHeight: 42, deckSplit: 46 } },
  { id: 'custom', label: 'CUSTOM', layout: { leftWidth: 22, rightWidth: 22, bottomHeight: 35, deckSplit: 43 } },
];

export const DEFAULT_SETTINGS: InterfaceSettings = {
  themeId: 'mother',
  fontId: 'sharetech',
  layoutPreset: 'command',
  audioEnabled: true,
  audioVolume: 0.65,
  layout: { ...LAYOUT_PRESETS[0].layout },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const value = parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function isThemeId(value: unknown): value is ThemeId {
  return THEME_PRESETS.some((theme) => theme.id === value);
}

function isFontId(value: unknown): value is FontId {
  return FONT_PRESETS.some((font) => font.id === value);
}

function isLayoutPresetId(value: unknown): value is LayoutPresetId {
  return LAYOUT_PRESETS.some((preset) => preset.id === value);
}

function normalizeLayout(value: Partial<LayoutSettings> | undefined): LayoutSettings {
  return {
    leftWidth: clamp(Number(value?.leftWidth ?? DEFAULT_SETTINGS.layout.leftWidth), 14, 32),
    rightWidth: clamp(Number(value?.rightWidth ?? DEFAULT_SETTINGS.layout.rightWidth), 14, 32),
    bottomHeight: clamp(Number(value?.bottomHeight ?? DEFAULT_SETTINGS.layout.bottomHeight), 24, 48),
    deckSplit: clamp(Number(value?.deckSplit ?? DEFAULT_SETTINGS.layout.deckSplit), 25, 65),
  };
}

export function loadInterfaceSettings(): InterfaceSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<InterfaceSettings>;
    return {
      themeId: isThemeId(parsed.themeId) ? parsed.themeId : DEFAULT_SETTINGS.themeId,
      fontId: isFontId(parsed.fontId) ? parsed.fontId : DEFAULT_SETTINGS.fontId,
      layoutPreset: isLayoutPresetId(parsed.layoutPreset) ? parsed.layoutPreset : DEFAULT_SETTINGS.layoutPreset,
      audioEnabled: typeof parsed.audioEnabled === 'boolean' ? parsed.audioEnabled : DEFAULT_SETTINGS.audioEnabled,
      audioVolume: clamp(Number(parsed.audioVolume ?? DEFAULT_SETTINGS.audioVolume), 0, 1),
      layout: normalizeLayout(parsed.layout),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveInterfaceSettings(settings: InterfaceSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getThemePreset(id: ThemeId) {
  return THEME_PRESETS.find((theme) => theme.id === id) ?? THEME_PRESETS[0];
}

export function getFontPreset(id: FontId) {
  return FONT_PRESETS.find((font) => font.id === id) ?? FONT_PRESETS[0];
}

export function getLayoutPreset(id: LayoutPresetId) {
  return LAYOUT_PRESETS.find((preset) => preset.id === id) ?? LAYOUT_PRESETS[0];
}

export function applyInterfaceSettings(settings: InterfaceSettings) {
  if (typeof document === 'undefined') return;

  const theme = getThemePreset(settings.themeId);
  const font = getFontPreset(settings.fontId);
  const root = document.documentElement;
  const [r, g, b] = hexToRgb(theme.accent);
  const [tr, tg, tb] = hexToRgb(theme.text);

  root.style.setProperty('--color-r', String(r));
  root.style.setProperty('--color-g', String(g));
  root.style.setProperty('--color-b', String(b));
  root.style.setProperty('--color-text-r', String(tr));
  root.style.setProperty('--color-text-g', String(tg));
  root.style.setProperty('--color-text-b', String(tb));
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-accent-dim', `rgba(${r}, ${g}, ${b}, 0.3)`);
  root.style.setProperty('--color-accent-faint', `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.style.setProperty('--color-bg', theme.background);
  root.style.setProperty('--color-panel', theme.panel);
  root.style.setProperty('--color-grey', theme.grey);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-danger', theme.danger);
  root.style.setProperty('--font-ui', font.ui);
  root.style.setProperty('--font-display', font.display);
  root.style.setProperty('--font-mono', font.mono);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('muthur-theme-change'));
  }
}
