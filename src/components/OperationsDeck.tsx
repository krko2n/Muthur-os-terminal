import { ReactNode, useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { playSound } from '../audio';
import {
  BOOT_PRESETS,
  FONT_PRESETS,
  InterfaceSettings,
  KEYBOARD_PRESETS,
  LayoutPresetId,
  LAYOUT_PRESETS,
  OfflinePackSettings,
  SOUND_PACKS,
  SYSTEM_LOADOUTS,
  TERMINAL_PROFILES,
  THEME_PRESETS,
  exportInterfaceSettings,
  importInterfaceSettings,
} from '../theme';
import { GameIcon, KeyboardIcon, LayoutIcon, PaletteIcon, SoundIcon, StorageIcon, TerminalIcon } from './SystemIcons';

interface OperationsDeckProps {
  settings: InterfaceSettings;
  deckSplit: number;
  onDeckSplitChange: (value: number) => void;
  onLayoutPresetChange: (id: LayoutPresetId) => void;
  onLayoutChange: (patch: Partial<InterfaceSettings['layout']>) => void;
  onSettingsChange: (patch: Partial<InterfaceSettings>) => void;
  onReplaceSettings: (settings: InterfaceSettings) => void;
  onOpenPalette: () => void;
  onOpenShutdown: () => void;
}

type DeckTab = 'style' | 'layout' | 'ops' | 'offline' | 'games' | 'log';
type GameMode = 'signal' | 'tactics' | 'cards';

interface OfflineMapEntry {
  name: string;
  path: string;
  sizeBytes: number;
  modified?: number;
  metadata?: {
    metadata?: Record<string, string>;
    tileCount?: number;
    zoomRange?: string;
    metadataReadable?: boolean;
  };
}

interface OfflinePackRuntimeStatus {
  exists: boolean;
  path: string;
  manifestPath: string;
  status: 'missing' | 'current' | 'stale';
  currentVersion: string;
  version: string;
  updatedAt?: string;
  sizeBytes: number;
  modules: Record<'ai' | 'wiki' | 'maps' | 'docs', boolean>;
  aiModel: string;
  wikiPack: string;
  mapRegion: string;
  maps: OfflineMapEntry[];
}

interface GameResult {
  game: GameMode;
  score: number;
  moves?: number;
  streak?: number;
  summary: string;
}

interface GameRecord {
  plays: number;
  highScore: number;
  bestMoves?: number;
  bestStreak?: number;
  lastSummary: string;
  lastPlayed: string;
}

interface GameSlot {
  id: string;
  label: string;
  game: GameMode;
  score: number;
  summary: string;
  savedAt: string;
}

interface GameMemory {
  records: Partial<Record<GameMode, GameRecord>>;
  slots: GameSlot[];
}

const PLAYABLE_GAMES: Array<{ id: GameMode; name: string; signal: string; stat: string }> = [
  { id: 'signal', name: 'SIGNAL LOCK', signal: 'hit the sweep exactly on the target', stat: '30s' },
  { id: 'tactics', name: 'SECTOR TACTICS', signal: 'chess-like board duel against station logic', stat: 'long' },
  { id: 'cards', name: 'VOID CARDS', signal: 'offline card run with streak scoring', stat: 'endless' },
];

const GAME_IDEAS = [
  { name: 'ORBITAL LOCK', signal: 'align satellite windows under pressure', stat: '30s' },
  { name: 'DRONE TRACE', signal: 'predict patrol turns across a silent grid', stat: '45s' },
  { name: 'CIPHER RAIN', signal: 'match falling code fragments into keys', stat: '60s' },
  { name: 'REACTOR PULSE', signal: 'hold power output inside a moving band', stat: '40s' },
  { name: 'EVA THREAD', signal: 'plot oxygen-safe paths through hull breaches', stat: '90s' },
];

const GAME_MEMORY_KEY = 'muthur-game-memory';

const EMPTY_GAME_MEMORY: GameMemory = {
  records: {},
  slots: [
    { id: 'slot-a', label: 'SLOT A', game: 'signal', score: 0, summary: 'EMPTY', savedAt: '' },
    { id: 'slot-b', label: 'SLOT B', game: 'tactics', score: 0, summary: 'EMPTY', savedAt: '' },
    { id: 'slot-c', label: 'SLOT C', game: 'cards', score: 0, summary: 'EMPTY', savedAt: '' },
  ],
};

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size >= 10 || unit === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`;
}

function formatStamp(value?: string | number) {
  if (!value) return 'UNKNOWN';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).toUpperCase();
}

function loadGameMemory(): GameMemory {
  if (typeof window === 'undefined') return EMPTY_GAME_MEMORY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GAME_MEMORY_KEY) || '{}') as Partial<GameMemory>;
    return {
      records: parsed.records ?? {},
      slots: parsed.slots?.length ? parsed.slots : EMPTY_GAME_MEMORY.slots,
    };
  } catch {
    return EMPTY_GAME_MEMORY;
  }
}

function saveGameMemory(memory: GameMemory) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GAME_MEMORY_KEY, JSON.stringify(memory));
}

function applyGameResult(memory: GameMemory, result: GameResult): GameMemory {
  const previous = memory.records[result.game] ?? {
    plays: 0,
    highScore: 0,
    lastSummary: 'NONE',
    lastPlayed: '',
  };
  const nextRecord: GameRecord = {
    ...previous,
    plays: previous.plays + 1,
    highScore: Math.max(previous.highScore, result.score),
    bestMoves: result.moves == null ? previous.bestMoves : Math.min(previous.bestMoves ?? result.moves, result.moves),
    bestStreak: result.streak == null ? previous.bestStreak : Math.max(previous.bestStreak ?? 0, result.streak),
    lastSummary: result.summary,
    lastPlayed: new Date().toISOString(),
  };

  return {
    ...memory,
    records: { ...memory.records, [result.game]: nextRecord },
  };
}

export default function OperationsDeck({
  settings,
  deckSplit,
  onDeckSplitChange,
  onLayoutPresetChange,
  onLayoutChange,
  onSettingsChange,
  onReplaceSettings,
  onOpenPalette,
  onOpenShutdown,
}: OperationsDeckProps) {
  const [tab, setTab] = useState<DeckTab>('style');

  const selectTab = (next: DeckTab) => {
    setTab(next);
    playSound('switch', 0.08);
  };

  return (
    <div className="h-full flex flex-col min-w-0 bg-[rgba(5,8,13,0.78)] border-r border-[rgba(0,255,65,0.15)]">
      <div className="flex items-center justify-between px-[1vh] py-[0.5vh] border-b border-[rgba(0,255,65,0.15)] shrink-0 deck-title">
        <div className="text-[1.2vh] tracking-widest opacity-75 flex items-center gap-[0.6vh] font-display">
          <LayoutIcon size={14} color="var(--color-accent)" />
          OPS DECK
        </div>
        <div className="grid grid-cols-6 gap-[0.35vh]">
          <DeckTabButton active={tab === 'style'} onClick={() => selectTab('style')} label="F1" icon={<PaletteIcon size={11} />} title="STYLE" />
          <DeckTabButton active={tab === 'layout'} onClick={() => selectTab('layout')} label="F2" icon={<LayoutIcon size={11} />} title="LAYOUT" />
          <DeckTabButton active={tab === 'ops'} onClick={() => selectTab('ops')} label="F3" icon={<TerminalIcon size={11} />} title="OPS" />
          <DeckTabButton active={tab === 'offline'} onClick={() => selectTab('offline')} label="F4" icon={<StorageIcon size={11} />} title="OFFLINE" />
          <DeckTabButton active={tab === 'games'} onClick={() => selectTab('games')} label="F5" icon={<GameIcon size={11} />} title="GAMES" />
          <DeckTabButton active={tab === 'log'} onClick={() => selectTab('log')} label="F6" icon={<KeyboardIcon size={11} />} title="LOG" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin p-[1vh]">
        {tab === 'style' && <StyleTab settings={settings} onSettingsChange={onSettingsChange} />}
        {tab === 'layout' && (
          <LayoutTab
            settings={settings}
            deckSplit={deckSplit}
            onDeckSplitChange={onDeckSplitChange}
            onLayoutPresetChange={onLayoutPresetChange}
            onLayoutChange={onLayoutChange}
            onSettingsChange={onSettingsChange}
          />
        )}
        {tab === 'ops' && (
          <OpsTab
            settings={settings}
            onSettingsChange={onSettingsChange}
            onReplaceSettings={onReplaceSettings}
            onOpenPalette={onOpenPalette}
            onOpenShutdown={onOpenShutdown}
          />
        )}
        {tab === 'offline' && <OfflineTab settings={settings} onSettingsChange={onSettingsChange} />}
        {tab === 'games' && <GamesTab />}
        {tab === 'log' && <LogTab settings={settings} onSettingsChange={onSettingsChange} />}
      </div>
    </div>
  );
}

function StyleTab({ settings, onSettingsChange }: { settings: InterfaceSettings; onSettingsChange: (patch: Partial<InterfaceSettings>) => void }) {
  const updateCustom = (patch: Partial<InterfaceSettings['customTheme']>) => {
    onSettingsChange({ customTheme: { ...settings.customTheme, ...patch } });
  };
  const applyLoadout = (loadout: (typeof SYSTEM_LOADOUTS)[number]) => {
    onSettingsChange({
      ...loadout.settings,
      customTheme: { ...settings.customTheme, enabled: false },
    });
    playSound('theme', 0.12);
    window.setTimeout(() => playSound('panels', 0.08), 130);
  };

  return (
    <div className="grid grid-cols-[1.1fr_0.9fr] gap-[1vh] min-h-full">
      <section className="min-w-0">
        <ControlHeader icon={<PaletteIcon size={13} />} label="PREBUILT LOADOUTS" />
        <div className="grid grid-cols-2 gap-[0.6vh] mb-[1vh]">
          {SYSTEM_LOADOUTS.map((loadout) => {
            const theme = THEME_PRESETS.find((preset) => preset.id === loadout.settings.themeId) ?? THEME_PRESETS[0];
            const active = settings.themeId === loadout.settings.themeId
              && settings.soundPack === loadout.settings.soundPack
              && settings.bootPreset === loadout.settings.bootPreset
              && settings.terminalProfile === loadout.settings.terminalProfile;
            return (
              <button
                key={loadout.id}
                onClick={() => applyLoadout(loadout)}
                className={`min-h-[5.4vh] border text-left px-[0.75vh] py-[0.55vh] transition-all ${
                  active
                    ? 'border-muthur-primary bg-[rgba(0,255,65,0.09)]'
                    : 'border-[rgba(0,255,65,0.12)] hover:border-[rgba(0,255,65,0.35)]'
                }`}
              >
                <div className="flex items-center justify-between gap-[0.6vh]">
                  <span className="text-[0.98vh] tracking-wider text-muthur-primary truncate">{loadout.label}</span>
                  <span className="grid grid-cols-3 gap-[0.18vh] w-[3.3vh] shrink-0">
                    {[theme.accent, theme.panel, theme.danger].map((color) => (
                      <span key={color} className="h-[0.65vh]" style={{ background: color }} />
                    ))}
                  </span>
                </div>
                <div className="text-[0.78vh] text-muthur-secondary opacity-62 leading-tight mt-[0.35vh] line-clamp-2">
                  {loadout.description}
                </div>
              </button>
            );
          })}
        </div>

        <ControlHeader icon={<PaletteIcon size={13} />} label="COLOR / THEME" />
        <div className="grid grid-cols-2 gap-[0.6vh]">
          {THEME_PRESETS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                onSettingsChange({ themeId: theme.id, customTheme: { ...settings.customTheme, enabled: false } });
                playSound('theme', 0.09);
              }}
              className={`h-[4.6vh] border text-left px-[0.7vh] transition-all ${
                settings.themeId === theme.id && !settings.customTheme.enabled
                  ? 'border-muthur-primary bg-[rgba(0,255,65,0.08)]'
                  : 'border-[rgba(0,255,65,0.12)] hover:border-[rgba(0,255,65,0.35)]'
              }`}
            >
              <div className="flex items-center gap-[0.6vh]">
                <span className="block w-[1.3vh] h-[1.3vh] border border-white/20" style={{ background: theme.accent }} />
                <span className="text-[1.02vh] tracking-wider text-muthur-primary truncate">{theme.label}</span>
              </div>
              <div className="mt-[0.45vh] h-[0.45vh] grid grid-cols-4 gap-[0.2vh]">
                {[theme.background, theme.panel, theme.text, theme.danger].map((color) => (
                  <span key={color} style={{ background: color }} />
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-[1vh] border border-[rgba(0,255,65,0.12)] p-[0.8vh]">
          <div className="flex items-center justify-between mb-[0.7vh]">
            <span className="text-[1vh] tracking-wider text-muthur-secondary opacity-70">CUSTOM THEME</span>
            <Toggle
              enabled={settings.customTheme.enabled}
              label={settings.customTheme.enabled ? 'ON' : 'OFF'}
              onClick={() => updateCustom({ enabled: !settings.customTheme.enabled })}
            />
          </div>
          <div className="grid grid-cols-5 gap-[0.45vh]">
            {(['accent', 'background', 'panel', 'text', 'danger'] as const).map((key) => (
              <label key={key} className="text-[0.75vh] text-muthur-secondary opacity-55 uppercase">
                {key.slice(0, 4)}
                <input
                  type="color"
                  value={settings.customTheme[key]}
                  onChange={(event) => updateCustom({ [key]: event.target.value } as Partial<InterfaceSettings['customTheme']>)}
                  className="block w-full h-[2.4vh] mt-[0.2vh] bg-transparent border-0"
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="min-w-0">
        <ControlHeader icon={<SoundIcon size={13} />} label="TYPE / AUDIO" />
        <div className="grid grid-cols-2 gap-[0.6vh]">
          {FONT_PRESETS.map((font) => (
            <button
              key={font.id}
              onClick={() => {
                onSettingsChange({ fontId: font.id });
                playSound('folder', 0.08);
              }}
              className={`h-[3.2vh] px-[0.7vh] border text-[0.92vh] tracking-wider transition-colors truncate ${
                settings.fontId === font.id
                  ? 'border-muthur-primary text-muthur-bg bg-muthur-primary'
                  : 'border-[rgba(0,255,65,0.12)] text-muthur-secondary hover:border-[rgba(0,255,65,0.35)]'
              }`}
              style={{ fontFamily: font.display }}
            >
              {font.label}
            </button>
          ))}
        </div>

        <div className="mt-[1vh] grid gap-[0.6vh]">
          {SOUND_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => {
                onSettingsChange({ soundPack: pack.id });
                playSound('switch', 0.1);
              }}
              className={`border px-[0.7vh] py-[0.45vh] text-left ${
                settings.soundPack === pack.id ? 'border-muthur-primary bg-[rgba(0,255,65,0.08)]' : 'border-[rgba(0,255,65,0.12)]'
              }`}
            >
              <div className="text-[0.95vh] tracking-wider text-muthur-primary">{pack.label}</div>
              <div className="text-[0.78vh] text-muthur-secondary opacity-45 truncate">{pack.description}</div>
            </button>
          ))}
        </div>

        <div className="mt-[1vh] border border-[rgba(0,255,65,0.12)] p-[0.8vh]">
          <div className="flex items-center justify-between mb-[0.7vh]">
            <span className="text-[1vh] tracking-wider text-muthur-secondary opacity-70">AUDIO BUS</span>
            <Toggle
              enabled={settings.audioEnabled}
              label={settings.audioEnabled ? 'ON' : 'OFF'}
              onClick={() => {
                onSettingsChange({ audioEnabled: !settings.audioEnabled });
                playSound(settings.audioEnabled ? 'denied' : 'granted', 0.1);
              }}
            />
          </div>
          <Slider value={settings.audioVolume} min={0} max={1} step={0.01} onChange={(audioVolume) => onSettingsChange({ audioVolume })} />
          <div className="grid grid-cols-4 gap-[0.45vh] mt-[0.7vh]">
            {[
              ['KEY', 'keyboard'],
              ['PANEL', 'panels'],
              ['SCAN', 'scan'],
              ['ALERT', 'error'],
            ].map(([label, sound]) => (
              <button
                key={label}
                onClick={() => playSound(sound as Parameters<typeof playSound>[0], 0.18)}
                className="h-[2.5vh] border border-[rgba(0,255,65,0.18)] text-[0.78vh] tracking-wider text-muthur-secondary hover:text-muthur-primary hover:border-muthur-primary transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function LayoutTab({
  settings,
  deckSplit,
  onDeckSplitChange,
  onLayoutPresetChange,
  onLayoutChange,
  onSettingsChange,
}: {
  settings: InterfaceSettings;
  deckSplit: number;
  onDeckSplitChange: (value: number) => void;
  onLayoutPresetChange: (id: LayoutPresetId) => void;
  onLayoutChange: (patch: Partial<InterfaceSettings['layout']>) => void;
  onSettingsChange: (patch: Partial<InterfaceSettings>) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-[1vh] h-full">
      <section className="min-w-0">
        <ControlHeader icon={<LayoutIcon size={13} />} label="LAYOUT PRESETS" />
        <div className="grid grid-cols-2 gap-[0.6vh]">
          {LAYOUT_PRESETS.filter((preset) => preset.id !== 'custom').map((preset) => (
            <button
              key={preset.id}
              onClick={() => onLayoutPresetChange(preset.id)}
              className={`border p-[0.65vh] h-[6.9vh] transition-all ${
                settings.layoutPreset === preset.id
                  ? 'border-muthur-primary bg-[rgba(0,255,65,0.08)]'
                  : 'border-[rgba(0,255,65,0.12)] hover:border-[rgba(0,255,65,0.35)]'
              }`}
            >
              <div className="text-[0.95vh] tracking-widest text-muthur-primary mb-[0.4vh]">{preset.label}</div>
              <LayoutDiagram layout={preset.layout} />
            </button>
          ))}
        </div>
      </section>

      <section className="min-w-0">
        <ControlHeader icon={<LayoutIcon size={13} />} label="DRAG-FREE EDITOR" />
        <div className="border border-[rgba(0,255,65,0.12)] p-[0.9vh] space-y-[0.75vh]">
          <LabeledSlider label="LEFT" value={settings.layout.leftWidth} min={14} max={32} step={1} onChange={(leftWidth) => onLayoutChange({ leftWidth })} />
          <LabeledSlider label="RIGHT" value={settings.layout.rightWidth} min={14} max={32} step={1} onChange={(rightWidth) => onLayoutChange({ rightWidth })} />
          <LabeledSlider label="BOTTOM" value={settings.layout.bottomHeight} min={24} max={50} step={1} onChange={(bottomHeight) => onLayoutChange({ bottomHeight })} />
          <LabeledSlider label="DECK" value={deckSplit} min={25} max={65} step={1} onChange={onDeckSplitChange} />
        </div>

        <div className="mt-[1vh] grid grid-cols-2 gap-[0.6vh]">
          <ToggleBox
            title="PERFORMANCE"
            body="reduce flicker, glow, and heavy overlays"
            active={settings.performanceMode}
            onClick={() => onSettingsChange({ performanceMode: !settings.performanceMode })}
          />
          <ToggleBox
            title="CINEMATIC"
            body="hide visual noise and focus the command core"
            active={settings.cinematicMode}
            onClick={() => onSettingsChange({ cinematicMode: !settings.cinematicMode })}
          />
        </div>
      </section>
    </div>
  );
}

function OpsTab({
  settings,
  onSettingsChange,
  onReplaceSettings,
  onOpenPalette,
  onOpenShutdown,
}: {
  settings: InterfaceSettings;
  onSettingsChange: (patch: Partial<InterfaceSettings>) => void;
  onReplaceSettings: (settings: InterfaceSettings) => void;
  onOpenPalette: () => void;
  onOpenShutdown: () => void;
}) {
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const runExport = () => {
    const data = exportInterfaceSettings(settings);
    setExportText(data);
    navigator.clipboard?.writeText(data).catch(() => {});
    playSound('granted', 0.1);
  };

  const runImport = () => {
    const imported = importInterfaceSettings(importText);
    if (imported) {
      onReplaceSettings(imported);
      setImportStatus('IMPORTED');
      playSound('granted', 0.1);
    } else {
      setImportStatus('BAD JSON');
      playSound('error', 0.1);
    }
  };

  return (
    <div className="grid grid-cols-[0.95fr_1.05fr] gap-[1vh] min-h-full">
      <section className="min-w-0">
        <ControlHeader icon={<TerminalIcon size={13} />} label="BOOT / TERMINAL" />
        <div className="grid grid-cols-2 gap-[0.55vh]">
          {BOOT_PRESETS.map((preset) => (
            <SmallChoice
              key={preset.id}
              active={settings.bootPreset === preset.id}
              title={preset.label}
              body={preset.description}
              onClick={() => onSettingsChange({ bootPreset: preset.id })}
            />
          ))}
        </div>

        <ControlHeader icon={<TerminalIcon size={13} />} label="TERMINAL PROFILES" />
        <div className="grid grid-cols-2 gap-[0.55vh]">
          {TERMINAL_PROFILES.map((profile) => (
            <SmallChoice
              key={profile.id}
              active={settings.terminalProfile === profile.id}
              title={profile.label}
              body={profile.description}
              onClick={() => onSettingsChange({ terminalProfile: profile.id })}
            />
          ))}
        </div>

        <ControlHeader icon={<KeyboardIcon size={13} />} label="KEYBOARD REMAPPER" />
        <div className="grid grid-cols-3 gap-[0.5vh]">
          {KEYBOARD_PRESETS.map((preset) => (
            <SmallChoice
              key={preset.id}
              active={settings.keyboardPreset === preset.id}
              title={preset.label}
              body={preset.description}
              onClick={() => onSettingsChange({ keyboardPreset: preset.id })}
            />
          ))}
        </div>
      </section>

      <section className="min-w-0">
        <ControlHeader icon={<TerminalIcon size={13} />} label="COMMANDS / UPDATE" />
        <div className="grid grid-cols-2 gap-[0.6vh]">
          <CommandButton title="COMMAND PALETTE" body="Ctrl+K / F1 command search" onClick={onOpenPalette} />
          <CommandButton title="SHUTDOWN SCREEN" body="safe cinematic power-down" onClick={onOpenShutdown} />
          <CommandButton title="FIRST-RUN SETUP" body="show setup wizard again" onClick={() => onSettingsChange({ firstRunComplete: false })} />
          <CommandButton title="AI CMD HELPER" body="right AI panel: start with # command" onClick={() => playSound('info', 0.08)} />
        </div>

        <div className="mt-[1vh] grid grid-cols-2 gap-[0.6vh]">
          <StatusCard title="UPDATE WINDOW" value="make update" body="progress bar, build log, install verify" />
          <StatusCard title="HEALTH CHECK" value="scripts/muthur-health-check.sh" body="toolchain, disk, deps, session" />
        </div>

        <ControlHeader icon={<StorageIcon size={13} />} label="BACKUP / RESTORE" />
        <div className="grid grid-cols-2 gap-[0.6vh]">
          <div className="border border-[rgba(0,255,65,0.12)] p-[0.7vh] min-w-0">
            <button onClick={runExport} className="w-full h-[2.7vh] border border-muthur-primary text-muthur-primary text-[0.95vh] tracking-widest">
              EXPORT
            </button>
            <textarea readOnly value={exportText} className="mt-[0.5vh] h-[5.5vh] w-full bg-transparent border border-[rgba(0,255,65,0.1)] text-[0.72vh] text-muthur-secondary opacity-60 p-[0.4vh]" />
          </div>
          <div className="border border-[rgba(0,255,65,0.12)] p-[0.7vh] min-w-0">
            <button onClick={runImport} className="w-full h-[2.7vh] border border-[rgba(0,255,65,0.28)] text-muthur-secondary text-[0.95vh] tracking-widest">
              IMPORT {importStatus}
            </button>
            <textarea value={importText} onChange={(event) => setImportText(event.target.value)} className="mt-[0.5vh] h-[5.5vh] w-full bg-transparent border border-[rgba(0,255,65,0.1)] text-[0.72vh] text-muthur-secondary p-[0.4vh]" />
          </div>
        </div>
      </section>
    </div>
  );
}

function OfflineTab({ settings, onSettingsChange }: { settings: InterfaceSettings; onSettingsChange: (patch: Partial<InterfaceSettings>) => void }) {
  const offline = settings.offlinePack;
  const update = (patch: Partial<OfflinePackSettings>) => onSettingsChange({ offlinePack: { ...offline, ...patch } });
  const [packStatus, setPackStatus] = useState<OfflinePackRuntimeStatus | null>(null);
  const [packError, setPackError] = useState('');
  const [loadingPack, setLoadingPack] = useState(false);
  const selected = [
    offline.ai ? `MUTHUR_AI_MODEL=${offline.aiModel}` : '',
    offline.wiki ? `MUTHUR_WIKI_PACK=${offline.wikiPack}` : '',
    offline.maps ? `MUTHUR_MAP_REGION=${offline.mapRegion}` : '',
  ].filter(Boolean).join(' ');

  const refreshPack = () => {
    setLoadingPack(true);
    setPackError('');
    invoke('get_offline_pack_status')
      .then((result) => {
        setPackStatus(result as OfflinePackRuntimeStatus);
        playSound('scan', 0.06);
      })
      .catch((error) => {
        setPackError(String(error));
        playSound('error', 0.08);
      })
      .finally(() => setLoadingPack(false));
  };

  useEffect(() => {
    refreshPack();
  }, []);

  return (
    <div className="grid grid-cols-[0.9fr_1.05fr_1.05fr] gap-[1vh] min-h-full">
      <section className="min-w-0">
        <ControlHeader icon={<StorageIcon size={13} />} label="VOLUNTARY OFFLINE PACK" />
        <div className="grid grid-cols-2 gap-[0.6vh]">
          <ToggleBox title="AI MODEL" body="download local Ollama model" active={offline.ai} onClick={() => update({ ai: !offline.ai, enabled: true })} />
          <ToggleBox title="WIKI ZIM" body="offline wiki/knowledge archive" active={offline.wiki} onClick={() => update({ wiki: !offline.wiki, enabled: true })} />
          <ToggleBox title="MAPS" body="offline world or region map data" active={offline.maps} onClick={() => update({ maps: !offline.maps, enabled: true })} />
          <ToggleBox title="DOCS" body="local manual and command help" active={offline.docs} onClick={() => update({ docs: !offline.docs, enabled: true })} />
        </div>

        <div className="mt-[1vh] space-y-[0.65vh]">
          <TextField label="AI MODEL" value={offline.aiModel} onChange={(aiModel) => update({ aiModel, enabled: true })} />
          <TextField label="WIKI PACK" value={offline.wikiPack} onChange={(wikiPack) => update({ wikiPack, enabled: true })} />
          <TextField label="MAP REGION" value={offline.mapRegion} onChange={(mapRegion) => update({ mapRegion, enabled: true })} />
        </div>
      </section>

      <section className="min-w-0 flex flex-col">
        <ControlHeader icon={<StorageIcon size={13} />} label="PACK MANAGER" />
        <div className="border border-[rgba(0,255,65,0.12)] p-[0.75vh] flex-1 min-h-0 flex flex-col">
          <div className="grid grid-cols-3 gap-[0.5vh]">
            <Metric label="STATUS" value={packStatus?.status?.toUpperCase() ?? (loadingPack ? 'SCANNING' : 'UNKNOWN')} />
            <Metric label="SIZE" value={formatBytes(packStatus?.sizeBytes ?? 0)} />
            <Metric label="VERSION" value={packStatus?.version || 'NONE'} />
          </div>
          <div className="mt-[0.7vh] grid grid-cols-4 gap-[0.45vh]">
            {(['ai', 'wiki', 'maps', 'docs'] as const).map((module) => (
              <div
                key={module}
                className={`border px-[0.45vh] py-[0.35vh] text-center text-[0.75vh] tracking-wider ${
                  packStatus?.modules?.[module] ? 'border-muthur-primary text-muthur-primary' : 'border-[rgba(0,255,65,0.1)] text-muthur-secondary opacity-45'
                }`}
              >
                {module.toUpperCase()}
              </div>
            ))}
          </div>
          <div className="mt-[0.7vh] grid grid-cols-2 gap-[0.5vh]">
            <StatusCard title="CURRENT" value={packStatus?.currentVersion ?? 'UNKNOWN'} body="bundled pack format" />
            <StatusCard title="UPDATED" value={formatStamp(packStatus?.updatedAt)} body="manifest timestamp" />
          </div>
          <pre className="mt-[0.8vh] flex-1 min-h-0 overflow-auto bg-[rgba(0,255,65,0.035)] border border-[rgba(0,255,65,0.1)] p-[0.65vh] text-[0.78vh] text-muthur-primary whitespace-pre-wrap">
{`${selected || '# choose modules on the left'}
scripts/muthur-offline-pack.sh --status
scripts/muthur-offline-pack.sh --install
scripts/muthur-offline-pack.sh --update`}
          </pre>
          {packError && <div className="mt-[0.5vh] text-[0.75vh] text-muthur-accent truncate">{packError}</div>}
          <div className="grid grid-cols-[1fr_auto] gap-[0.5vh] mt-[0.6vh]">
            <div className="text-[0.72vh] text-muthur-secondary opacity-45 truncate">{packStatus?.path ?? '~/.local/share/muthur/offline'}</div>
            <button onClick={refreshPack} className="px-[0.7vh] border border-muthur-primary text-muthur-primary text-[0.75vh] tracking-wider">
              {loadingPack ? 'SCAN' : 'REFRESH'}
            </button>
          </div>
        </div>
      </section>

      <LocalMapViewer maps={packStatus?.maps ?? []} configuredRegion={offline.mapRegion} />
    </div>
  );
}

function LocalMapViewer({ maps, configuredRegion }: { maps: OfflineMapEntry[]; configuredRegion: string }) {
  const [selectedPath, setSelectedPath] = useState('');
  const [zoom, setZoom] = useState(3);
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);
  const selectedMap = maps.find((map) => map.path === selectedPath) ?? maps[0];
  const metadata = selectedMap?.metadata?.metadata ?? {};
  const bounds = metadata.bounds || metadata.center || configuredRegion;

  useEffect(() => {
    if (!selectedPath && maps[0]) setSelectedPath(maps[0].path);
  }, [maps, selectedPath]);

  const x = Math.round(((lon + 180) / 360) * Math.pow(2, zoom));
  const y = Math.round(((90 - lat) / 180) * Math.pow(2, zoom));

  return (
    <section className="min-w-0 flex flex-col">
      <ControlHeader icon={<StorageIcon size={13} />} label="LOCAL MAP VIEWER" />
      <div className="border border-[rgba(0,255,65,0.12)] p-[0.75vh] flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[1fr_auto] gap-[0.5vh]">
          <select
            value={selectedMap?.path ?? ''}
            onChange={(event) => setSelectedPath(event.target.value)}
            className="min-w-0 bg-transparent border border-[rgba(0,255,65,0.18)] px-[0.45vh] py-[0.25vh] text-[0.8vh] text-muthur-primary"
          >
            {maps.length === 0 && <option value="">NO MBTILES</option>}
            {maps.map((map) => <option key={map.path} value={map.path}>{map.name}</option>)}
          </select>
          <div className="text-[0.75vh] text-muthur-secondary opacity-50 tabular-nums">{formatBytes(selectedMap?.sizeBytes ?? 0)}</div>
        </div>

        <div className="mt-[0.6vh] relative h-[13vh] border border-[rgba(0,255,65,0.16)] bg-[rgba(0,255,65,0.025)] overflow-hidden">
          <div className="absolute inset-0 opacity-35" style={{
            backgroundImage: 'linear-gradient(rgba(var(--color-r), var(--color-g), var(--color-b), 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--color-r), var(--color-g), var(--color-b), 0.16) 1px, transparent 1px)',
            backgroundSize: '16.6% 20%, 16.6% 20%',
          }} />
          <div className="absolute inset-x-0 top-1/2 border-t border-muthur-primary opacity-70" />
          <div className="absolute inset-y-0 left-1/2 border-l border-muthur-primary opacity-70" />
          <div className="absolute left-[calc(50%-0.45vh)] top-[calc(50%-0.45vh)] w-[0.9vh] h-[0.9vh] border border-muthur-accent bg-[rgba(255,59,83,0.18)]" />
          <div className="absolute left-[0.5vh] top-[0.45vh] text-[0.7vh] text-muthur-secondary opacity-45">Z{zoom} X{x} Y{y}</div>
          <div className="absolute right-[0.5vh] bottom-[0.45vh] text-[0.7vh] text-muthur-primary opacity-70 truncate max-w-[70%]">{selectedMap?.name ?? 'NO LOCAL MAP'}</div>
        </div>

        <div className="mt-[0.65vh] space-y-[0.45vh]">
          <LabeledSlider label="ZOOM" value={zoom} min={1} max={14} step={1} onChange={setZoom} suffix="" />
          <LabeledSlider label="LAT" value={lat} min={-85} max={85} step={1} onChange={setLat} suffix="" />
          <LabeledSlider label="LON" value={lon} min={-180} max={180} step={1} onChange={setLon} suffix="" />
        </div>

        <div className="mt-[0.55vh] grid grid-cols-2 gap-[0.45vh]">
          <StatusCard title="TILES" value={String(selectedMap?.metadata?.tileCount ?? 0)} body={selectedMap?.metadata?.zoomRange || 'zoom unknown'} />
          <StatusCard title="BOUNDS" value={String(bounds || 'UNKNOWN')} body={selectedMap?.metadata?.metadataReadable ? 'metadata read' : 'file scan only'} />
        </div>
      </div>
    </section>
  );
}

function GamesTab() {
  const [mode, setMode] = useState<GameMode>('signal');
  const [memory, setMemory] = useState<GameMemory>(() => loadGameMemory());
  const [snapshot, setSnapshot] = useState<GameResult>({ game: 'signal', score: 0, summary: 'SIGNAL READY' });
  const selectGame = (next: GameMode) => {
    setMode(next);
    setSnapshot({ game: next, score: 0, summary: 'READY' });
    playSound('switch', 0.08);
  };

  const recordResult = (result: GameResult) => {
    setSnapshot(result);
    setMemory((prev) => {
      const next = applyGameResult(prev, result);
      saveGameMemory(next);
      return next;
    });
  };

  const saveSlot = (slotId: string) => {
    setMemory((prev) => {
      const next = {
        ...prev,
        slots: prev.slots.map((slot) => slot.id === slotId
          ? {
              ...slot,
              game: snapshot.game,
              score: snapshot.score,
              summary: snapshot.summary,
              savedAt: new Date().toISOString(),
            }
          : slot),
      };
      saveGameMemory(next);
      return next;
    });
    playSound('granted', 0.08);
  };

  return (
    <div className="grid grid-cols-[1fr_0.86fr] gap-[1vh] h-full">
      {mode === 'signal' && <SignalLockGame onResult={recordResult} onSnapshot={setSnapshot} />}
      {mode === 'tactics' && <SectorTacticsGame onResult={recordResult} onSnapshot={setSnapshot} />}
      {mode === 'cards' && <VoidCardsGame onResult={recordResult} onSnapshot={setSnapshot} />}
      <section className="min-w-0 flex flex-col">
        <ControlHeader icon={<GameIcon size={13} />} label="OFFLINE ARCADE" />
        <div className="border border-[rgba(0,255,65,0.12)] p-[0.7vh] flex-1 min-h-0 overflow-auto">
          <div className="grid grid-cols-1 gap-[0.45vh]">
            {PLAYABLE_GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => selectGame(game.id)}
                className={`border px-[0.6vh] py-[0.5vh] text-left transition-all ${
                  mode === game.id
                    ? 'border-muthur-primary bg-[rgba(0,255,65,0.08)]'
                    : 'border-[rgba(0,255,65,0.1)] bg-[rgba(0,255,65,0.025)] hover:border-[rgba(0,255,65,0.32)]'
                }`}
              >
                <div className="flex items-center justify-between gap-[0.5vh]">
                  <span className="text-[0.9vh] tracking-wider text-muthur-primary truncate">{game.name}</span>
                  <span className="text-[0.75vh] text-muthur-secondary opacity-45 tabular-nums">{game.stat}</span>
                </div>
                <div className="text-[0.78vh] leading-tight text-muthur-secondary opacity-50 truncate">{game.signal}</div>
              </button>
            ))}
          </div>

          <ControlHeader icon={<GameIcon size={13} />} label="HIGH SCORES / SLOTS" />
          <div className="grid grid-cols-3 gap-[0.45vh]">
            {PLAYABLE_GAMES.map((game) => {
              const record = memory.records[game.id];
              return (
                <div key={game.id} className="border border-[rgba(0,255,65,0.1)] p-[0.45vh] min-w-0">
                  <div className="text-[0.7vh] text-muthur-secondary opacity-40 truncate">{game.name}</div>
                  <div className="text-[0.9vh] text-muthur-primary tabular-nums">{record?.highScore ?? 0}</div>
                  <div className="text-[0.65vh] text-muthur-secondary opacity-45 truncate">
                    {record?.bestMoves ? `${record.bestMoves} moves` : record?.bestStreak ? `${record.bestStreak} streak` : `${record?.plays ?? 0} plays`}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-[0.5vh] grid grid-cols-3 gap-[0.45vh]">
            {memory.slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => saveSlot(slot.id)}
                className="border border-[rgba(0,255,65,0.12)] p-[0.45vh] text-left hover:border-muthur-primary transition-colors"
              >
                <div className="text-[0.72vh] text-muthur-primary tracking-wider">{slot.label}</div>
                <div className="text-[0.65vh] text-muthur-secondary opacity-45 truncate">{slot.summary}</div>
                <div className="text-[0.65vh] text-muthur-secondary opacity-35 truncate">{slot.savedAt ? formatStamp(slot.savedAt) : 'EMPTY'}</div>
              </button>
            ))}
          </div>

          <ControlHeader icon={<GameIcon size={13} />} label="FUTURE MODULES" />
          <div className="space-y-[0.45vh]">
            {GAME_IDEAS.map((idea, index) => (
              <div key={idea.name} className="border border-[rgba(0,255,65,0.1)] bg-[rgba(0,255,65,0.025)] px-[0.6vh] py-[0.45vh]">
                <div className="flex items-center justify-between gap-[0.5vh]">
                  <span className="text-[0.9vh] tracking-wider text-muthur-primary truncate">{idea.name}</span>
                  <span className="text-[0.75vh] text-muthur-secondary opacity-45 tabular-nums">{idea.stat}</span>
                </div>
                <div className="text-[0.78vh] leading-tight text-muthur-secondary opacity-50 truncate">
                  {String(index + 1).padStart(2, '0')} / {idea.signal}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function LogTab({ settings, onSettingsChange }: { settings: InterfaceSettings; onSettingsChange: (patch: Partial<InterfaceSettings>) => void }) {
  const [missionInput, setMissionInput] = useState('');
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [bookmarkUrl, setBookmarkUrl] = useState('');

  const setMissionDone = (id: string) => {
    onSettingsChange({ missionLog: settings.missionLog.map(item => item.id === id ? { ...item, done: !item.done } : item) });
  };

  const addMission = () => {
    const text = missionInput.trim();
    if (!text) return;
    onSettingsChange({ missionLog: [...settings.missionLog, { id: `mission-${Date.now()}`, text, done: false }].slice(-12) });
    setMissionInput('');
  };

  const addBookmark = () => {
    const label = bookmarkLabel.trim();
    const url = bookmarkUrl.trim();
    if (!label || !url) return;
    onSettingsChange({ bookmarks: [...settings.bookmarks, { id: `bookmark-${Date.now()}`, label, url }].slice(-8) });
    setBookmarkLabel('');
    setBookmarkUrl('');
  };

  return (
    <div className="grid grid-cols-[1fr_1fr_0.8fr] gap-[1vh] h-full">
      <section className="min-w-0 flex flex-col">
        <ControlHeader icon={<KeyboardIcon size={13} />} label="MISSION LOG" />
        <div className="flex-1 min-h-0 overflow-auto border border-[rgba(0,255,65,0.12)] p-[0.7vh] space-y-[0.45vh]">
          {settings.missionLog.map(item => (
            <button key={item.id} onClick={() => setMissionDone(item.id)} className="w-full text-left flex gap-[0.5vh] text-[0.9vh] text-muthur-secondary">
              <span className="text-muthur-primary">{item.done ? '[x]' : '[ ]'}</span>
              <span className={item.done ? 'line-through opacity-40' : 'opacity-75'}>{item.text}</span>
            </button>
          ))}
        </div>
        <div className="mt-[0.6vh] flex gap-[0.4vh]">
          <input value={missionInput} onChange={(event) => setMissionInput(event.target.value)} className="flex-1 min-w-0 bg-transparent border border-[rgba(0,255,65,0.18)] px-[0.5vh] text-[0.9vh] text-muthur-primary" />
          <button onClick={addMission} className="px-[0.8vh] border border-muthur-primary text-muthur-primary text-[0.9vh]">ADD</button>
        </div>
      </section>

      <section className="min-w-0 flex flex-col">
        <ControlHeader icon={<StorageIcon size={13} />} label="BOOKMARKS / HELP" />
        <div className="flex-1 min-h-0 overflow-auto border border-[rgba(0,255,65,0.12)] p-[0.7vh] space-y-[0.45vh]">
          {settings.bookmarks.map(bookmark => (
            <div key={bookmark.id} className="border border-[rgba(0,255,65,0.08)] p-[0.45vh]">
              <div className="text-[0.9vh] tracking-wider text-muthur-primary truncate">{bookmark.label}</div>
              <div className="text-[0.75vh] text-muthur-secondary opacity-45 truncate">{bookmark.url}</div>
            </div>
          ))}
          <div className="text-[0.82vh] text-muthur-secondary opacity-55 leading-relaxed pt-[0.5vh]">
            OFFLINE HELP: command basics, setup, update, themes, AI, maps, wiki pack.
          </div>
        </div>
        <div className="mt-[0.6vh] grid grid-cols-[0.55fr_1fr_auto] gap-[0.35vh]">
          <input value={bookmarkLabel} onChange={(event) => setBookmarkLabel(event.target.value)} placeholder="LABEL" className="min-w-0 bg-transparent border border-[rgba(0,255,65,0.18)] px-[0.45vh] text-[0.78vh] text-muthur-primary" />
          <input value={bookmarkUrl} onChange={(event) => setBookmarkUrl(event.target.value)} placeholder="URL" className="min-w-0 bg-transparent border border-[rgba(0,255,65,0.18)] px-[0.45vh] text-[0.78vh] text-muthur-primary" />
          <button onClick={addBookmark} className="px-[0.6vh] border border-muthur-primary text-muthur-primary text-[0.8vh]">ADD</button>
        </div>
      </section>

      <section className="min-w-0 flex flex-col">
        <ControlHeader icon={<LayoutIcon size={13} />} label="PLUGIN SLOTS" />
        <div className="flex-1 min-h-0 overflow-auto border border-[rgba(0,255,65,0.12)] p-[0.7vh] space-y-[0.5vh]">
          {settings.pluginSlots.map(slot => (
            <button
              key={slot.id}
              onClick={() => onSettingsChange({ pluginSlots: settings.pluginSlots.map(item => item.id === slot.id ? { ...item, enabled: !item.enabled } : item) })}
              className={`w-full text-left border p-[0.55vh] ${slot.enabled ? 'border-muthur-primary bg-[rgba(0,255,65,0.06)]' : 'border-[rgba(0,255,65,0.1)]'}`}
            >
              <div className="text-[0.88vh] text-muthur-primary tracking-wider">{slot.enabled ? 'ON ' : 'OFF'} {slot.label}</div>
              <div className="text-[0.72vh] text-muthur-secondary opacity-45 leading-tight">{slot.description}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

interface GameCallbacks {
  onResult: (result: GameResult) => void;
  onSnapshot: (result: GameResult) => void;
}

function SignalLockGame({ onResult, onSnapshot }: GameCallbacks) {
  const [running, setRunning] = useState(false);
  const [sweep, setSweep] = useState(0);
  const [target, setTarget] = useState(4);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [status, setStatus] = useState('ARMED');
  const [resultSaved, setResultSaved] = useState(false);

  const targetSeed = useMemo(() => [1, 7, 3, 8, 0, 5, 2, 6, 4], []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSweep((prev) => (prev + 1) % 9);
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setStatus('COMPLETE');
          playSound('granted', 0.12);
          return 0;
        }
        return prev - 1;
      });
    }, 450);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    onSnapshot({ game: 'signal', score, summary: `${status} ${score}PTS ${timeLeft}s` });
  }, [onSnapshot, score, status, timeLeft]);

  useEffect(() => {
    if (!running && timeLeft === 0 && status === 'COMPLETE' && !resultSaved) {
      onResult({ game: 'signal', score, summary: `SIGNAL ${score}PTS` });
      setResultSaved(true);
    }
  }, [onResult, resultSaved, running, score, status, timeLeft]);

  const reset = () => {
    setRunning(true);
    setSweep(0);
    setTarget(targetSeed[Math.floor(Math.random() * targetSeed.length)]);
    setScore(0);
    setTimeLeft(30);
    setStatus('TRACKING');
    setResultSaved(false);
    playSound('thrust', 0.08);
  };

  const lock = () => {
    if (!running) {
      reset();
      return;
    }

    const rawDistance = Math.abs(sweep - target);
    const distance = Math.min(rawDistance, 9 - rawDistance);
    if (distance === 0) {
      setScore((prev) => prev + 100);
      setStatus('LOCK');
      playSound('game', 0.14);
    } else if (distance === 1) {
      setScore((prev) => prev + 35);
      setStatus('PARTIAL');
      playSound('scan', 0.08);
    } else {
      setScore((prev) => Math.max(0, prev - 20));
      setStatus('MISS');
      playSound('error', 0.08);
    }
    setTarget(targetSeed[Math.floor(Math.random() * targetSeed.length)]);
  };

  return (
    <section className="min-w-0 flex flex-col">
      <ControlHeader icon={<GameIcon size={13} />} label="SIGNAL LOCK" />
      <div className="grid grid-cols-[1fr_0.72fr] gap-[0.7vh] flex-1 min-h-0">
        <div className="grid grid-cols-3 gap-[0.6vh] min-h-0">
          {Array.from({ length: 9 }, (_, index) => {
            const isSweep = index === sweep;
            const isTarget = index === target;
            return (
              <button
                key={index}
                onClick={lock}
                className={`border transition-all ${
                  isSweep
                    ? 'bg-muthur-primary border-muthur-primary'
                    : isTarget
                    ? 'border-muthur-accent bg-[rgba(255,59,83,0.16)]'
                    : 'border-[rgba(0,255,65,0.12)] bg-[rgba(0,255,65,0.03)]'
                }`}
              />
            );
          })}
        </div>
        <div className="border border-[rgba(0,255,65,0.12)] p-[0.8vh] min-w-0 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-[0.45vh] text-[0.88vh]">
            <Metric label="STATE" value={status} />
            <Metric label="TIME" value={`${timeLeft}s`} />
            <Metric label="SCORE" value={String(score)} />
            <Metric label="TARGET" value={String(target + 1)} />
          </div>
          <div className="h-[0.7vh] bg-[rgba(0,255,65,0.08)] overflow-hidden">
            <div className="h-full bg-muthur-primary transition-all" style={{ width: `${(timeLeft / 30) * 100}%` }} />
          </div>
          <button onClick={running ? lock : reset} className="h-[3vh] border border-muthur-primary text-muthur-primary tracking-widest text-[1vh]">
            {running ? 'LOCK' : 'ARM'}
          </button>
        </div>
      </div>
    </section>
  );
}

type TacticalSide = 'crew' | 'system';
type TacticalUnitRole = 'command' | 'scout' | 'lance' | 'core' | 'drone';

interface TacticalUnit {
  id: string;
  side: TacticalSide;
  role: TacticalUnitRole;
  label: string;
  row: number;
  col: number;
}

const TACTICS_SIZE = 6;
const CARD_SUITS = ['SYS', 'ORB', 'BIO', 'SEC'] as const;

interface ArcadeCard {
  suit: string;
  rank: number;
}

function createTacticsUnits(): TacticalUnit[] {
  return [
    { id: 'cmd', side: 'crew', role: 'command', label: 'C', row: 5, col: 2 },
    { id: 'scout-a', side: 'crew', role: 'scout', label: 'S', row: 5, col: 0 },
    { id: 'scout-b', side: 'crew', role: 'scout', label: 'S', row: 5, col: 5 },
    { id: 'lance-a', side: 'crew', role: 'lance', label: 'L', row: 4, col: 1 },
    { id: 'lance-b', side: 'crew', role: 'lance', label: 'L', row: 4, col: 4 },
    { id: 'core', side: 'system', role: 'core', label: 'X', row: 0, col: 2 },
    { id: 'drone-a', side: 'system', role: 'drone', label: 'D', row: 0, col: 0 },
    { id: 'drone-b', side: 'system', role: 'drone', label: 'D', row: 0, col: 5 },
    { id: 'drone-c', side: 'system', role: 'drone', label: 'D', row: 1, col: 2 },
    { id: 'drone-d', side: 'system', role: 'drone', label: 'D', row: 1, col: 3 },
  ];
}

function isInsideTactics(row: number, col: number) {
  return row >= 0 && row < TACTICS_SIZE && col >= 0 && col < TACTICS_SIZE;
}

function tacticalDistance(a: { row: number; col: number }, b: { row: number; col: number }) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function getTacticalUnitAt(units: TacticalUnit[], row: number, col: number) {
  return units.find((unit) => unit.row === row && unit.col === col);
}

function getLegalTacticalMoves(unit: TacticalUnit, units: TacticalUnit[]) {
  const moves: Array<{ row: number; col: number }> = [];
  const addMove = (row: number, col: number) => {
    if (!isInsideTactics(row, col)) return false;
    const occupant = getTacticalUnitAt(units, row, col);
    if (occupant?.side === unit.side) return false;
    moves.push({ row, col });
    return !occupant;
  };

  if (unit.role === 'command') {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
        if (rowOffset !== 0 || colOffset !== 0) addMove(unit.row + rowOffset, unit.col + colOffset);
      }
    }
  }

  if (unit.role === 'scout') {
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([rowOffset, colOffset]) => addMove(unit.row + rowOffset, unit.col + colOffset));
  }

  if (unit.role === 'lance') {
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([rowOffset, colOffset]) => {
      for (let step = 1; step <= 2; step += 1) {
        if (!addMove(unit.row + rowOffset * step, unit.col + colOffset * step)) break;
      }
    });
  }

  return moves;
}

function isLegalTacticalMove(moves: Array<{ row: number; col: number }>, row: number, col: number) {
  return moves.some((move) => move.row === row && move.col === col);
}

function advanceSystemTurn(units: TacticalUnit[]) {
  const crew = units.filter((unit) => unit.side === 'crew');
  const drones = units.filter((unit) => unit.role === 'drone');

  for (const drone of drones) {
    const target = crew
      .slice()
      .sort((a, b) => tacticalDistance(drone, a) - tacticalDistance(drone, b))[0];
    if (!target) break;

    const candidates = [
      { row: drone.row + Math.sign(target.row - drone.row), col: drone.col },
      { row: drone.row, col: drone.col + Math.sign(target.col - drone.col) },
      { row: drone.row - 1, col: drone.col },
      { row: drone.row + 1, col: drone.col },
      { row: drone.row, col: drone.col - 1 },
      { row: drone.row, col: drone.col + 1 },
    ]
      .filter((move) => isInsideTactics(move.row, move.col))
      .sort((a, b) => tacticalDistance(a, target) - tacticalDistance(b, target));

    for (const move of candidates) {
      const occupant = getTacticalUnitAt(units, move.row, move.col);
      if (occupant?.side === 'system') continue;

      const nextUnits = units
        .filter((unit) => !(unit.side === 'crew' && unit.row === move.row && unit.col === move.col))
        .map((unit) => (unit.id === drone.id ? { ...unit, row: move.row, col: move.col } : unit));
      const commandAlive = nextUnits.some((unit) => unit.role === 'command');

      return {
        units: nextUnits,
        over: !commandAlive,
        status: occupant ? `DRONE TOOK ${occupant.label}` : 'SYSTEM ADVANCED',
      };
    }
  }

  return { units, over: false, status: 'SYSTEM WAIT' };
}

function SectorTacticsGame({ onResult, onSnapshot }: GameCallbacks) {
  const [units, setUnits] = useState<TacticalUnit[]>(() => createTacticsUnits());
  const [selectedId, setSelectedId] = useState('cmd');
  const [status, setStatus] = useState('CAPTURE X CORE');
  const [moves, setMoves] = useState(0);
  const [over, setOver] = useState(false);
  const selected = units.find((unit) => unit.id === selectedId && unit.side === 'crew') ?? units.find((unit) => unit.side === 'crew');
  const legalMoves = selected ? getLegalTacticalMoves(selected, units) : [];
  const crewCount = units.filter((unit) => unit.side === 'crew').length;
  const systemCount = units.filter((unit) => unit.side === 'system').length;

  useEffect(() => {
    const score = Math.max(0, 600 - moves * 20 + crewCount * 30 - systemCount * 10);
    onSnapshot({ game: 'tactics', score, moves, summary: `${status} ${moves}M` });
  }, [crewCount, moves, onSnapshot, status, systemCount]);

  const reset = () => {
    setUnits(createTacticsUnits());
    setSelectedId('cmd');
    setStatus('CAPTURE X CORE');
    setMoves(0);
    setOver(false);
    playSound('granted', 0.1);
  };

  const handleCell = (row: number, col: number) => {
    if (over) {
      reset();
      return;
    }

    const occupant = getTacticalUnitAt(units, row, col);
    if (occupant?.side === 'crew') {
      setSelectedId(occupant.id);
      setStatus(`${occupant.label} READY`);
      playSound('folder', 0.06);
      return;
    }

    if (!selected || !isLegalTacticalMove(legalMoves, row, col)) {
      setStatus('NO ROUTE');
      playSound('denied', 0.07);
      return;
    }

    const capturedCore = occupant?.role === 'core';
    const nextMoves = moves + 1;
    const afterCrewMove = units
      .filter((unit) => !(unit.side === 'system' && unit.row === row && unit.col === col))
      .map((unit) => (unit.id === selected.id ? { ...unit, row, col } : unit));
    setMoves(nextMoves);

    if (capturedCore) {
      const score = Math.max(100, 700 - nextMoves * 25 + afterCrewMove.filter((unit) => unit.side === 'crew').length * 35);
      setUnits(afterCrewMove);
      setStatus('CORE CAPTURED');
      setOver(true);
      onResult({ game: 'tactics', score, moves: nextMoves, summary: `CORE ${nextMoves}M ${score}PTS` });
      playSound('game', 0.14);
      return;
    }

    const systemTurn = advanceSystemTurn(afterCrewMove);
    setUnits(systemTurn.units);
    setStatus(systemTurn.over ? 'COMMAND LOST' : systemTurn.status);
    setOver(systemTurn.over);
    if (systemTurn.over) {
      onResult({ game: 'tactics', score: 0, moves: nextMoves, summary: `LOST ${nextMoves}M` });
    }
    playSound(systemTurn.over ? 'error' : 'scan', 0.08);
  };

  return (
    <section className="min-w-0 flex flex-col">
      <ControlHeader icon={<GameIcon size={13} />} label="SECTOR TACTICS" />
      <div className="grid grid-cols-[1fr_0.72fr] gap-[0.7vh] flex-1 min-h-0">
        <div className="grid grid-cols-6 gap-[0.35vh] min-h-0 content-start">
          {Array.from({ length: TACTICS_SIZE * TACTICS_SIZE }, (_, index) => {
            const row = Math.floor(index / TACTICS_SIZE);
            const col = index % TACTICS_SIZE;
            const unit = getTacticalUnitAt(units, row, col);
            const legal = isLegalTacticalMove(legalMoves, row, col);
            const selectedCell = unit?.id === selected?.id;
            return (
              <button
                key={`${row}-${col}`}
                onClick={() => handleCell(row, col)}
                className={`h-[4.25vh] border text-[1.3vh] font-display tracking-wider transition-all ${
                  selectedCell
                    ? 'border-muthur-primary bg-muthur-primary text-muthur-bg'
                    : unit?.side === 'system'
                    ? 'border-muthur-accent text-muthur-accent bg-[rgba(255,59,83,0.12)]'
                    : unit?.side === 'crew'
                    ? 'border-[rgba(0,255,65,0.36)] text-muthur-primary bg-[rgba(0,255,65,0.08)]'
                    : legal
                    ? 'border-muthur-primary bg-[rgba(0,255,65,0.12)]'
                    : 'border-[rgba(0,255,65,0.11)] bg-[rgba(0,255,65,0.025)]'
                }`}
              >
                {unit?.label ?? (legal ? '+' : '')}
              </button>
            );
          })}
        </div>
        <div className="border border-[rgba(0,255,65,0.12)] p-[0.8vh] min-w-0 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-[0.45vh] text-[0.88vh]">
            <Metric label="STATE" value={status} />
            <Metric label="MOVES" value={String(moves)} />
            <Metric label="CREW" value={String(crewCount)} />
            <Metric label="SYSTEM" value={String(systemCount)} />
          </div>
          <div className="text-[0.82vh] text-muthur-secondary opacity-55 leading-relaxed">
            C moves diagonally, S moves one lane, L moves two lanes. Capture X before the drones pin command.
          </div>
          <button onClick={reset} className="h-[3vh] border border-muthur-primary text-muthur-primary tracking-widest text-[1vh]">
            RESET
          </button>
        </div>
      </div>
    </section>
  );
}

function createArcadeDeck() {
  const cards: ArcadeCard[] = [];
  CARD_SUITS.forEach((suit) => {
    for (let rank = 1; rank <= 12; rank += 1) {
      cards.push({ suit, rank });
    }
  });
  return shuffleArcadeDeck(cards);
}

function shuffleArcadeDeck(cards: ArcadeCard[]) {
  const next = [...cards];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function cardLabel(card: ArcadeCard) {
  const rank = card.rank === 1 ? 'A' : card.rank === 11 ? 'J' : card.rank === 12 ? 'Q' : String(card.rank);
  return `${card.suit}-${rank}`;
}

function VoidCardsGame({ onResult, onSnapshot }: GameCallbacks) {
  const initialDeck = useMemo(() => createArcadeDeck(), []);
  const [deck, setDeck] = useState<ArcadeCard[]>(initialDeck.slice(1));
  const [current, setCurrent] = useState<ArcadeCard>(initialDeck[0]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [status, setStatus] = useState('PREDICT NEXT');
  const [lastCard, setLastCard] = useState<ArcadeCard | null>(null);

  useEffect(() => {
    onSnapshot({ game: 'cards', score, streak, summary: `${score}PTS S${streak} R${round}` });
  }, [onSnapshot, round, score, streak]);

  const reset = () => {
    const nextDeck = createArcadeDeck();
    setCurrent(nextDeck[0]);
    setDeck(nextDeck.slice(1));
    setScore(0);
    setStreak(0);
    setRound(1);
    setStatus('PREDICT NEXT');
    setLastCard(null);
    playSound('granted', 0.1);
  };

  const predict = (choice: 'hi' | 'lo' | 'eq') => {
    const source = deck.length ? deck : createArcadeDeck();
    const nextCard = source[0];
    const remaining = source.slice(1);
    const diff = nextCard.rank - current.rank;
    const correct = (choice === 'hi' && diff > 0) || (choice === 'lo' && diff < 0) || (choice === 'eq' && diff === 0);

    setLastCard(current);
    setCurrent(nextCard);
    setDeck(remaining.length ? remaining : createArcadeDeck());
    setRound((prev) => prev + 1);

    if (correct) {
      const nextStreak = streak + 1;
      const nextScore = score + 10 + nextStreak * 5;
      setStreak(nextStreak);
      setScore(nextScore);
      setStatus(`GOOD ${nextStreak}`);
      onResult({ game: 'cards', score: nextScore, streak: nextStreak, summary: `${nextScore}PTS STREAK ${nextStreak}` });
      playSound('game', 0.1);
    } else {
      setStreak(0);
      const nextScore = Math.max(0, score - 8);
      setScore(nextScore);
      setStatus('BAD READ');
      playSound('error', 0.07);
    }
  };

  return (
    <section className="min-w-0 flex flex-col">
      <ControlHeader icon={<GameIcon size={13} />} label="VOID CARDS" />
      <div className="grid grid-cols-[1fr_0.72fr] gap-[0.7vh] flex-1 min-h-0">
        <div className="grid grid-rows-[1fr_auto] gap-[0.7vh] min-h-0">
          <div className="grid grid-cols-2 gap-[0.7vh] min-h-0">
            <div className="border border-[rgba(0,255,65,0.18)] bg-[rgba(0,255,65,0.05)] flex flex-col items-center justify-center min-h-[18vh]">
              <div className="text-[0.8vh] text-muthur-secondary opacity-45 tracking-widest">CURRENT</div>
              <div className="text-[3.2vh] text-muthur-primary font-display tracking-widest">{cardLabel(current)}</div>
              <div className="text-[0.9vh] text-muthur-secondary opacity-50">RANK {current.rank}</div>
            </div>
            <div className="border border-[rgba(0,255,65,0.1)] bg-[rgba(0,255,65,0.025)] flex flex-col items-center justify-center min-h-[18vh]">
              <div className="text-[0.8vh] text-muthur-secondary opacity-45 tracking-widest">PREVIOUS</div>
              <div className="text-[2.2vh] text-muthur-secondary opacity-70 font-display tracking-widest">{lastCard ? cardLabel(lastCard) : 'NONE'}</div>
              <div className="text-[0.9vh] text-muthur-secondary opacity-35">LOCAL DECK</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-[0.55vh]">
            <button onClick={() => predict('hi')} className="h-[3vh] border border-muthur-primary text-muthur-primary tracking-widest text-[0.95vh]">HIGHER</button>
            <button onClick={() => predict('eq')} className="h-[3vh] border border-[rgba(0,255,65,0.28)] text-muthur-secondary tracking-widest text-[0.95vh]">EQUAL</button>
            <button onClick={() => predict('lo')} className="h-[3vh] border border-muthur-accent text-muthur-accent tracking-widest text-[0.95vh]">LOWER</button>
          </div>
        </div>
        <div className="border border-[rgba(0,255,65,0.12)] p-[0.8vh] min-w-0 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-[0.45vh] text-[0.88vh]">
            <Metric label="STATE" value={status} />
            <Metric label="ROUND" value={String(round)} />
            <Metric label="SCORE" value={String(score)} />
            <Metric label="STREAK" value={String(streak)} />
          </div>
          <div className="h-[0.7vh] bg-[rgba(0,255,65,0.08)] overflow-hidden">
            <div className="h-full bg-muthur-primary transition-all" style={{ width: `${Math.max(3, (deck.length / 47) * 100)}%` }} />
          </div>
          <Metric label="DECK" value={`${deck.length} CARDS`} />
          <button onClick={reset} className="h-[3vh] border border-muthur-primary text-muthur-primary tracking-widest text-[1vh]">
            SHUFFLE
          </button>
        </div>
      </div>
    </section>
  );
}

function DeckTabButton({ active, onClick, label, icon, title }: { active: boolean; onClick: () => void; label: string; icon: ReactNode; title: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-[2.7vh] px-[0.55vh] flex items-center justify-center gap-[0.3vh] border text-[0.92vh] tracking-wider font-mono transition-all ${
        active
          ? 'bg-muthur-primary text-muthur-bg border-muthur-primary'
          : 'text-muthur-secondary border-[rgba(0,255,65,0.16)] opacity-60 hover:opacity-100 hover:border-[rgba(0,255,65,0.35)]'
      }`}
      title={title}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ControlHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="text-[1.12vh] tracking-widest opacity-75 mb-[0.75vh] mt-[0.45vh] flex items-center gap-[0.55vh] panel-header-bracket border-t border-[rgba(0,255,65,0.15)] pt-[0.6vh]">
      {icon}
      {label}
    </div>
  );
}

function Toggle({ enabled, label, onClick }: { enabled: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-[0.7vh] py-[0.2vh] border text-[0.86vh] tracking-wider ${
        enabled ? 'border-muthur-primary text-muthur-primary' : 'border-[rgba(255,59,83,0.45)] text-muthur-accent'
      }`}
    >
      {label}
    </button>
  );
}

function Slider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      onPointerUp={() => playSound('scroll', 0.08)}
      className="w-full accent-[var(--color-accent)]"
    />
  );
}

function LabeledSlider(props: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[0.98vh] text-muthur-secondary opacity-75 mb-[0.25vh]">
        <span>{props.label}</span>
        <span className="text-muthur-primary tabular-nums">{Math.round(props.value)}{props.suffix ?? '%'}</span>
      </div>
      <Slider {...props} />
    </div>
  );
}

function LayoutDiagram({ layout }: { layout: { leftWidth: number; rightWidth: number; bottomHeight: number; deckSplit: number } }) {
  const center = 100 - layout.leftWidth - layout.rightWidth;
  return (
    <div className="h-[4vh] border border-[rgba(0,255,65,0.2)] p-[0.3vh] flex flex-col gap-[0.3vh]">
      <div className="flex flex-1 gap-[0.3vh] min-h-0">
        <span className="bg-[rgba(0,255,65,0.18)]" style={{ width: `${layout.leftWidth}%` }} />
        <span className="bg-[rgba(0,255,65,0.36)]" style={{ width: `${center}%` }} />
        <span className="bg-[rgba(0,255,65,0.12)]" style={{ width: `${layout.rightWidth}%` }} />
      </div>
      <div className="bg-[rgba(0,255,65,0.16)]" style={{ height: `${Math.max(18, layout.bottomHeight)}%` }} />
    </div>
  );
}

function ToggleBox({ title, body, active, onClick }: { title: string; body: string; active: boolean; onClick: () => void }) {
  return <SmallChoice active={active} title={`${active ? 'ON ' : 'OFF'}${title}`} body={body} onClick={onClick} />;
}

function SmallChoice({ active, title, body, onClick }: { active: boolean; title: string; body: string; onClick: () => void }) {
  return (
    <button
      onClick={() => {
        onClick();
        playSound('switch', 0.08);
      }}
      className={`min-h-[4.6vh] border px-[0.65vh] py-[0.55vh] text-left transition-all ${
        active ? 'border-muthur-primary bg-[rgba(0,255,65,0.08)]' : 'border-[rgba(0,255,65,0.12)] hover:border-[rgba(0,255,65,0.3)]'
      }`}
    >
      <div className="text-[0.98vh] tracking-wider text-muthur-primary truncate">{title}</div>
      <div className="text-[0.82vh] leading-snug text-muthur-secondary opacity-65">{body}</div>
    </button>
  );
}

function CommandButton({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return <SmallChoice active={false} title={title} body={body} onClick={onClick} />;
}

function StatusCard({ title, value, body }: { title: string; value: string; body: string }) {
  return (
    <div className="border border-[rgba(0,255,65,0.12)] px-[0.75vh] py-[0.65vh] min-w-0">
      <div className="text-[0.88vh] tracking-wider text-muthur-secondary opacity-55">{title}</div>
      <div className="text-[1.02vh] tracking-wider text-muthur-primary truncate">{value}</div>
      <div className="text-[0.82vh] text-muthur-secondary opacity-62 truncate">{body}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[rgba(0,255,65,0.1)] px-[0.6vh] py-[0.45vh] min-w-0">
      <div className="text-[0.8vh] tracking-wider text-muthur-secondary opacity-55">{label}</div>
      <div className="text-[1.08vh] tracking-wider text-muthur-primary truncate">{value}</div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid grid-cols-[8vh_1fr] items-center gap-[0.6vh] text-[0.96vh] text-muthur-secondary opacity-75">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 bg-transparent border border-[rgba(0,255,65,0.18)] px-[0.55vh] py-[0.35vh] text-[1vh] text-muthur-primary focus:outline-none focus:border-muthur-primary"
      />
    </label>
  );
}
