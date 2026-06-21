export type ThemeId = 'mother' | 'amber' | 'cryo' | 'surgical' | 'noir' | 'bios' | 'crt' | 'phosphor' | 'oxide' | 'void';
export type FontId = 'sharetech' | 'orbitron' | 'rajdhani' | 'audiowide' | 'bios';
export type LayoutPresetId = 'command' | 'focus' | 'wide' | 'simulation' | 'cinema' | 'custom';
export type SoundPackId = 'ship' | 'quiet' | 'retro' | 'horror' | 'combat';
export type BootPresetId = 'core' | 'bios' | 'crt' | 'silent';
export type TerminalProfileId = 'ops' | 'bios' | 'matrix' | 'plain';
export type KeyboardPresetId = 'terminal' | 'bios' | 'gaming';

export interface ThemePreset {
  id: ThemeId;
  label: string;
  accent: string;
  background: string;
  panel: string;
  grey: string;
  text: string;
  danger: string;
  surface?: string;
  vibe?: 'core' | 'bios' | 'crt';
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

export interface CustomThemeSettings {
  enabled: boolean;
  accent: string;
  background: string;
  panel: string;
  text: string;
  danger: string;
}

export interface OfflinePackSettings {
  enabled: boolean;
  ai: boolean;
  wiki: boolean;
  maps: boolean;
  docs: boolean;
  aiModel: string;
  mapRegion: string;
  wikiPack: string;
}

export interface Bookmark {
  id: string;
  label: string;
  url: string;
}

export interface MissionItem {
  id: string;
  text: string;
  done: boolean;
}

export interface PluginSlot {
  id: string;
  label: string;
  enabled: boolean;
  description: string;
}

export interface InterfaceSettings {
  themeId: ThemeId;
  fontId: FontId;
  layoutPreset: LayoutPresetId;
  audioEnabled: boolean;
  audioVolume: number;
  soundPack: SoundPackId;
  bootPreset: BootPresetId;
  terminalProfile: TerminalProfileId;
  keyboardLayout: string;
  keyboardPreset: KeyboardPresetId;
  performanceMode: boolean;
  cinematicMode: boolean;
  firstRunComplete: boolean;
  layout: LayoutSettings;
  customTheme: CustomThemeSettings;
  offlinePack: OfflinePackSettings;
  bookmarks: Bookmark[];
  missionLog: MissionItem[];
  pluginSlots: PluginSlot[];
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
    vibe: 'core',
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
    vibe: 'core',
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
    vibe: 'core',
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
    vibe: 'core',
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
    vibe: 'core',
  },
  {
    id: 'bios',
    label: 'BIOS BLUE',
    accent: '#f6f4df',
    background: '#001aa8',
    panel: '#0525d4',
    grey: '#07127a',
    text: '#c8f7ff',
    danger: '#d9162e',
    surface: '#0013a0',
    vibe: 'bios',
  },
  {
    id: 'crt',
    label: 'CRT REC',
    accent: '#39ff14',
    background: '#020703',
    panel: '#031103',
    grey: '#071a07',
    text: '#70d55e',
    danger: '#ff8f2f',
    surface: '#010301',
    vibe: 'crt',
  },
  {
    id: 'phosphor',
    label: 'PHOSPHOR',
    accent: '#a7ff5c',
    background: '#060805',
    panel: '#0b1308',
    grey: '#16210f',
    text: '#d5ffbe',
    danger: '#ff7040',
    surface: '#020401',
    vibe: 'crt',
  },
  {
    id: 'oxide',
    label: 'OXIDE RED',
    accent: '#ff493f',
    background: '#0a0505',
    panel: '#170707',
    grey: '#281111',
    text: '#ffd8ca',
    danger: '#ffe064',
    surface: '#060303',
    vibe: 'core',
  },
  {
    id: 'void',
    label: 'VOID CYAN',
    accent: '#7df6ff',
    background: '#05070d',
    panel: '#08111c',
    grey: '#151a28',
    text: '#d7f3ff',
    danger: '#ff4d8b',
    surface: '#03050a',
    vibe: 'core',
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
  {
    id: 'bios',
    label: 'BIOS FIXED',
    ui: "'Share Tech Mono', 'Courier New', monospace",
    display: "'Share Tech Mono', 'Courier New', monospace",
    mono: "'Share Tech Mono', 'Courier New', monospace",
  },
];

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: 'command', label: 'COMMAND', layout: { leftWidth: 22, rightWidth: 22, bottomHeight: 35, deckSplit: 43 } },
  { id: 'focus', label: 'FOCUS', layout: { leftWidth: 16, rightWidth: 18, bottomHeight: 28, deckSplit: 36 } },
  { id: 'wide', label: 'WIDE', layout: { leftWidth: 19, rightWidth: 16, bottomHeight: 32, deckSplit: 30 } },
  { id: 'simulation', label: 'SIM', layout: { leftWidth: 20, rightWidth: 24, bottomHeight: 42, deckSplit: 46 } },
  { id: 'cinema', label: 'CINEMA', layout: { leftWidth: 14, rightWidth: 14, bottomHeight: 24, deckSplit: 34 } },
  { id: 'custom', label: 'CUSTOM', layout: { leftWidth: 22, rightWidth: 22, bottomHeight: 35, deckSplit: 43 } },
];

export const SOUND_PACKS = [
  { id: 'ship' as SoundPackId, label: 'SHIP CORE', description: 'balanced cockpit feedback' },
  { id: 'quiet' as SoundPackId, label: 'QUIET', description: 'low-volume utility clicks' },
  { id: 'retro' as SoundPackId, label: 'RETRO BIOS', description: 'short beeps and key ticks' },
  { id: 'horror' as SoundPackId, label: 'HULL DARK', description: 'deeper mechanical alerts' },
  { id: 'combat' as SoundPackId, label: 'COMBAT', description: 'sharper lock and warning hits' },
];

export const BOOT_PRESETS = [
  { id: 'core' as BootPresetId, label: 'CORE WAKE', description: 'current MUTHUR startup sequence' },
  { id: 'bios' as BootPresetId, label: 'CMOS SETUP', description: 'blue setup utility inspired startup' },
  { id: 'crt' as BootPresetId, label: 'GPU MONITOR', description: 'green recorder terminal startup' },
  { id: 'silent' as BootPresetId, label: 'SILENT', description: 'minimal professional handoff' },
];

export const TERMINAL_PROFILES = [
  { id: 'ops' as TerminalProfileId, label: 'OPS', fontSize: 15, cursor: 'block', description: 'dense everyday shell' },
  { id: 'bios' as TerminalProfileId, label: 'BIOS', fontSize: 16, cursor: 'block', description: 'fat old setup terminal' },
  { id: 'matrix' as TerminalProfileId, label: 'MATRIX', fontSize: 14, cursor: 'underline', description: 'fast green monitor' },
  { id: 'plain' as TerminalProfileId, label: 'PLAIN', fontSize: 15, cursor: 'bar', description: 'calmer readable terminal' },
];

export const KEYBOARD_PRESETS = [
  { id: 'terminal' as KeyboardPresetId, label: 'TERMINAL', description: 'normal shell typing' },
  { id: 'bios' as KeyboardPresetId, label: 'BIOS NAV', description: 'setup-screen style controls' },
  { id: 'gaming' as KeyboardPresetId, label: 'WASD NAV', description: 'virtual WASD taps send arrow keys' },
];

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: 'duck', label: 'SEARCH', url: 'https://lite.duckduckgo.com/lite/' },
  { id: 'wiki', label: 'WIKI', url: 'https://en.wikipedia.org/wiki/Main_Page' },
  { id: 'docs', label: 'LOCAL DOCS', url: 'muthur://manual' },
];

export const DEFAULT_MISSION_LOG: MissionItem[] = [
  { id: 'theme', text: 'Tune BIOS/CRT theme to match the cockpit', done: false },
  { id: 'offline', text: 'Prepare voluntary offline AI/wiki/maps pack', done: false },
  { id: 'profiles', text: 'Save terminal profile for shell work', done: false },
];

export const DEFAULT_PLUGIN_SLOTS: PluginSlot[] = [
  { id: 'weather', label: 'WEATHER CELL', enabled: false, description: 'reserved panel slot for local weather feed' },
  { id: 'maps', label: 'MAP TABLE', enabled: true, description: 'reserved panel slot for offline map packs' },
  { id: 'wiki', label: 'WIKI NODE', enabled: true, description: 'reserved panel slot for offline knowledge packs' },
];

export const DEFAULT_SETTINGS: InterfaceSettings = {
  themeId: 'mother',
  fontId: 'sharetech',
  layoutPreset: 'command',
  audioEnabled: true,
  audioVolume: 0.65,
  soundPack: 'ship',
  bootPreset: 'core',
  terminalProfile: 'ops',
  keyboardLayout: 'en-US',
  keyboardPreset: 'terminal',
  performanceMode: false,
  cinematicMode: false,
  firstRunComplete: false,
  layout: { ...LAYOUT_PRESETS[0].layout },
  customTheme: {
    enabled: false,
    accent: '#00ff41',
    background: '#05080d',
    panel: '#081017',
    text: '#aacfd1',
    danger: '#ff3b53',
  },
  offlinePack: {
    enabled: false,
    ai: true,
    wiki: true,
    maps: false,
    docs: true,
    aiModel: 'llama3.2',
    mapRegion: 'world-low',
    wikiPack: 'wikipedia_en_simple_all',
  },
  bookmarks: DEFAULT_BOOKMARKS,
  missionLog: DEFAULT_MISSION_LOG,
  pluginSlots: DEFAULT_PLUGIN_SLOTS,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '#00ff41').replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const value = parseInt(full, 16);
  if (Number.isNaN(value)) return [0, 255, 65];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function normalizeHex(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const clean = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(clean) ? clean : fallback;
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

function isSoundPackId(value: unknown): value is SoundPackId {
  return SOUND_PACKS.some((pack) => pack.id === value);
}

function isBootPresetId(value: unknown): value is BootPresetId {
  return BOOT_PRESETS.some((preset) => preset.id === value);
}

function isTerminalProfileId(value: unknown): value is TerminalProfileId {
  return TERMINAL_PROFILES.some((profile) => profile.id === value);
}

function isKeyboardPresetId(value: unknown): value is KeyboardPresetId {
  return KEYBOARD_PRESETS.some((preset) => preset.id === value);
}

function normalizeLayout(value: Partial<LayoutSettings> | undefined): LayoutSettings {
  return {
    leftWidth: clamp(Number(value?.leftWidth ?? DEFAULT_SETTINGS.layout.leftWidth), 14, 32),
    rightWidth: clamp(Number(value?.rightWidth ?? DEFAULT_SETTINGS.layout.rightWidth), 14, 32),
    bottomHeight: clamp(Number(value?.bottomHeight ?? DEFAULT_SETTINGS.layout.bottomHeight), 24, 50),
    deckSplit: clamp(Number(value?.deckSplit ?? DEFAULT_SETTINGS.layout.deckSplit), 25, 65),
  };
}

function normalizeCustomTheme(value: Partial<CustomThemeSettings> | undefined): CustomThemeSettings {
  return {
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : DEFAULT_SETTINGS.customTheme.enabled,
    accent: normalizeHex(value?.accent, DEFAULT_SETTINGS.customTheme.accent),
    background: normalizeHex(value?.background, DEFAULT_SETTINGS.customTheme.background),
    panel: normalizeHex(value?.panel, DEFAULT_SETTINGS.customTheme.panel),
    text: normalizeHex(value?.text, DEFAULT_SETTINGS.customTheme.text),
    danger: normalizeHex(value?.danger, DEFAULT_SETTINGS.customTheme.danger),
  };
}

function normalizeOfflinePack(value: Partial<OfflinePackSettings> | undefined): OfflinePackSettings {
  return {
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : DEFAULT_SETTINGS.offlinePack.enabled,
    ai: typeof value?.ai === 'boolean' ? value.ai : DEFAULT_SETTINGS.offlinePack.ai,
    wiki: typeof value?.wiki === 'boolean' ? value.wiki : DEFAULT_SETTINGS.offlinePack.wiki,
    maps: typeof value?.maps === 'boolean' ? value.maps : DEFAULT_SETTINGS.offlinePack.maps,
    docs: typeof value?.docs === 'boolean' ? value.docs : DEFAULT_SETTINGS.offlinePack.docs,
    aiModel: typeof value?.aiModel === 'string' && value.aiModel.trim() ? value.aiModel.trim() : DEFAULT_SETTINGS.offlinePack.aiModel,
    mapRegion: typeof value?.mapRegion === 'string' && value.mapRegion.trim() ? value.mapRegion.trim() : DEFAULT_SETTINGS.offlinePack.mapRegion,
    wikiPack: typeof value?.wikiPack === 'string' && value.wikiPack.trim() ? value.wikiPack.trim() : DEFAULT_SETTINGS.offlinePack.wikiPack,
  };
}

function normalizeBookmarks(value: unknown): Bookmark[] {
  if (!Array.isArray(value)) return DEFAULT_BOOKMARKS;
  const valid = value
    .map((item, index) => ({
      id: typeof item?.id === 'string' ? item.id : `bookmark-${index}`,
      label: typeof item?.label === 'string' && item.label.trim() ? item.label.trim().slice(0, 24) : `BOOKMARK ${index + 1}`,
      url: typeof item?.url === 'string' && item.url.trim() ? item.url.trim() : 'https://lite.duckduckgo.com/lite/',
    }))
    .slice(0, 8);
  return valid.length ? valid : DEFAULT_BOOKMARKS;
}

function normalizeMissionLog(value: unknown): MissionItem[] {
  if (!Array.isArray(value)) return DEFAULT_MISSION_LOG;
  const valid = value
    .map((item, index) => ({
      id: typeof item?.id === 'string' ? item.id : `mission-${index}`,
      text: typeof item?.text === 'string' && item.text.trim() ? item.text.trim().slice(0, 90) : `Mission ${index + 1}`,
      done: Boolean(item?.done),
    }))
    .slice(0, 12);
  return valid.length ? valid : DEFAULT_MISSION_LOG;
}

function normalizePluginSlots(value: unknown): PluginSlot[] {
  if (!Array.isArray(value)) return DEFAULT_PLUGIN_SLOTS;
  const valid = value
    .map((item, index) => ({
      id: typeof item?.id === 'string' ? item.id : `plugin-${index}`,
      label: typeof item?.label === 'string' && item.label.trim() ? item.label.trim().slice(0, 22) : `PLUGIN ${index + 1}`,
      enabled: Boolean(item?.enabled),
      description: typeof item?.description === 'string' ? item.description.slice(0, 96) : 'reserved panel slot',
    }))
    .slice(0, 8);
  return valid.length ? valid : DEFAULT_PLUGIN_SLOTS;
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
      soundPack: isSoundPackId(parsed.soundPack) ? parsed.soundPack : DEFAULT_SETTINGS.soundPack,
      bootPreset: isBootPresetId(parsed.bootPreset) ? parsed.bootPreset : DEFAULT_SETTINGS.bootPreset,
      terminalProfile: isTerminalProfileId(parsed.terminalProfile) ? parsed.terminalProfile : DEFAULT_SETTINGS.terminalProfile,
      keyboardLayout: typeof parsed.keyboardLayout === 'string' && parsed.keyboardLayout.trim() ? parsed.keyboardLayout.trim() : DEFAULT_SETTINGS.keyboardLayout,
      keyboardPreset: isKeyboardPresetId(parsed.keyboardPreset) ? parsed.keyboardPreset : DEFAULT_SETTINGS.keyboardPreset,
      performanceMode: typeof parsed.performanceMode === 'boolean' ? parsed.performanceMode : DEFAULT_SETTINGS.performanceMode,
      cinematicMode: typeof parsed.cinematicMode === 'boolean' ? parsed.cinematicMode : DEFAULT_SETTINGS.cinematicMode,
      firstRunComplete: typeof parsed.firstRunComplete === 'boolean' ? parsed.firstRunComplete : DEFAULT_SETTINGS.firstRunComplete,
      layout: normalizeLayout(parsed.layout),
      customTheme: normalizeCustomTheme(parsed.customTheme),
      offlinePack: normalizeOfflinePack(parsed.offlinePack),
      bookmarks: normalizeBookmarks(parsed.bookmarks),
      missionLog: normalizeMissionLog(parsed.missionLog),
      pluginSlots: normalizePluginSlots(parsed.pluginSlots),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveInterfaceSettings(settings: InterfaceSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function exportInterfaceSettings(settings: InterfaceSettings) {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), settings }, null, 2);
}

export function importInterfaceSettings(raw: string): InterfaceSettings | null {
  try {
    const parsed = JSON.parse(raw);
    const settings = parsed?.settings ?? parsed;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return loadInterfaceSettings();
  } catch {
    return null;
  }
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

export function getTerminalProfile(id: TerminalProfileId) {
  return TERMINAL_PROFILES.find((profile) => profile.id === id) ?? TERMINAL_PROFILES[0];
}

export function applyInterfaceSettings(settings: InterfaceSettings) {
  if (typeof document === 'undefined') return;

  const baseTheme = getThemePreset(settings.themeId);
  const theme = settings.customTheme.enabled
    ? {
        ...baseTheme,
        accent: settings.customTheme.accent,
        background: settings.customTheme.background,
        panel: settings.customTheme.panel,
        text: settings.customTheme.text,
        danger: settings.customTheme.danger,
      }
    : baseTheme;
  const font = getFontPreset(settings.fontId);
  const terminal = getTerminalProfile(settings.terminalProfile);
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
  root.style.setProperty('--color-surface', theme.surface ?? theme.background);
  root.style.setProperty('--font-ui', font.ui);
  root.style.setProperty('--font-display', font.display);
  root.style.setProperty('--font-mono', font.mono);
  root.style.setProperty('--terminal-font-size', `${terminal.fontSize}`);
  root.style.setProperty('--terminal-cursor-style', terminal.cursor);
  root.dataset.themeVibe = theme.vibe ?? 'core';
  root.dataset.bootPreset = settings.bootPreset;
  root.dataset.soundPack = settings.soundPack;
  root.dataset.keyboardPreset = settings.keyboardPreset;

  document.body.classList.toggle('muthur-performance', settings.performanceMode);
  document.body.classList.toggle('muthur-cinematic', settings.cinematicMode);
  document.body.classList.toggle('muthur-bios-ui', theme.vibe === 'bios');
  document.body.classList.toggle('muthur-crt-ui', theme.vibe === 'crt');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('muthur-theme-change'));
    window.dispatchEvent(new CustomEvent('muthur-settings-change', { detail: settings }));
  }
}
