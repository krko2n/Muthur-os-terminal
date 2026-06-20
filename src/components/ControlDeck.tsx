import { ReactNode, useEffect, useMemo, useState } from 'react';
import { playSound } from '../audio';
import {
  FONT_PRESETS,
  FontId,
  InterfaceSettings,
  LAYOUT_PRESETS,
  LayoutPresetId,
  THEME_PRESETS,
  ThemeId,
} from '../theme';
import { GameIcon, LayoutIcon, PaletteIcon, SoundIcon } from './SystemIcons';

interface ControlDeckProps {
  settings: InterfaceSettings;
  deckSplit: number;
  onDeckSplitChange: (value: number) => void;
  onLayoutPresetChange: (id: LayoutPresetId) => void;
  onSettingsChange: (patch: Partial<InterfaceSettings>) => void;
}

type DeckTab = 'theme' | 'layout' | 'sim';

const GAME_IDEAS = [
  { name: 'ORBITAL LOCK', signal: 'align satellite windows under pressure', stat: '30s' },
  { name: 'DRONE TRACE', signal: 'predict patrol turns across a silent grid', stat: '45s' },
  { name: 'CIPHER RAIN', signal: 'match falling code fragments into keys', stat: '60s' },
  { name: 'REACTOR PULSE', signal: 'hold power output inside a moving band', stat: '40s' },
  { name: 'EVA THREAD', signal: 'plot oxygen-safe paths through hull breaches', stat: '90s' },
];

export default function ControlDeck({
  settings,
  deckSplit,
  onDeckSplitChange,
  onLayoutPresetChange,
  onSettingsChange,
}: ControlDeckProps) {
  const [tab, setTab] = useState<DeckTab>('theme');

  const selectTab = (next: DeckTab) => {
    setTab(next);
    playSound('switch', 0.08);
  };

  return (
    <div className="h-full flex flex-col min-w-0 bg-[rgba(5,8,13,0.78)] border-r border-[rgba(0,255,65,0.15)]">
      <div className="flex items-center justify-between px-[1vh] py-[0.5vh] border-b border-[rgba(0,255,65,0.15)] shrink-0">
        <div className="text-[1.2vh] tracking-widest opacity-70 flex items-center gap-[0.6vh] font-display">
          <LayoutIcon size={14} color="var(--color-accent)" />
          CONTROL DECK
        </div>
        <div className="flex gap-[0.4vh]">
          <DeckTabButton active={tab === 'theme'} onClick={() => selectTab('theme')} label="THEME" icon={<PaletteIcon size={12} />} />
          <DeckTabButton active={tab === 'layout'} onClick={() => selectTab('layout')} label="LAYOUT" icon={<LayoutIcon size={12} />} />
          <DeckTabButton active={tab === 'sim'} onClick={() => selectTab('sim')} label="SIM" icon={<GameIcon size={12} />} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin p-[1vh]">
        {tab === 'theme' && (
          <ThemeControls
            settings={settings}
            onThemeChange={(themeId) => onSettingsChange({ themeId })}
            onFontChange={(fontId) => onSettingsChange({ fontId })}
            onAudioChange={(patch) => onSettingsChange(patch)}
          />
        )}
        {tab === 'layout' && (
          <LayoutControls
            settings={settings}
            deckSplit={deckSplit}
            onLayoutPresetChange={onLayoutPresetChange}
            onDeckSplitChange={onDeckSplitChange}
          />
        )}
        {tab === 'sim' && <SignalLockGame />}
      </div>
    </div>
  );
}

function DeckTabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-[2.4vh] px-[0.7vh] flex items-center gap-[0.4vh] border text-[0.95vh] tracking-wider font-mono transition-all ${
        active
          ? 'bg-muthur-primary text-muthur-bg border-muthur-primary'
          : 'text-muthur-secondary border-[rgba(0,255,65,0.16)] opacity-60 hover:opacity-100 hover:border-[rgba(0,255,65,0.35)]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ThemeControls({
  settings,
  onThemeChange,
  onFontChange,
  onAudioChange,
}: {
  settings: InterfaceSettings;
  onThemeChange: (themeId: ThemeId) => void;
  onFontChange: (fontId: FontId) => void;
  onAudioChange: (patch: Partial<InterfaceSettings>) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-[1vh] min-h-full">
      <section className="min-w-0">
        <ControlHeader icon={<PaletteIcon size={13} />} label="COLOR" />
        <div className="grid grid-cols-2 gap-[0.6vh]">
          {THEME_PRESETS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                onThemeChange(theme.id);
                playSound('switch', 0.1);
              }}
              className={`h-[4.4vh] border text-left px-[0.7vh] transition-all ${
                settings.themeId === theme.id
                  ? 'border-muthur-primary bg-[rgba(0,255,65,0.08)]'
                  : 'border-[rgba(0,255,65,0.12)] hover:border-[rgba(0,255,65,0.35)]'
              }`}
            >
              <div className="flex items-center gap-[0.6vh]">
                <span
                  className="block w-[1.3vh] h-[1.3vh] rounded-sm border border-white/20"
                  style={{ background: theme.accent }}
                />
                <span className="text-[1.05vh] tracking-wider text-muthur-primary truncate">{theme.label}</span>
              </div>
              <div className="mt-[0.5vh] h-[0.4vh] grid grid-cols-4 gap-[0.2vh]">
                {[theme.background, theme.panel, theme.text, theme.danger].map((color) => (
                  <span key={color} style={{ background: color }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="min-w-0">
        <ControlHeader icon={<SoundIcon size={13} />} label="TYPE / AUDIO" />
        <div className="grid grid-cols-2 gap-[0.6vh]">
          {FONT_PRESETS.map((font) => (
            <button
              key={font.id}
              onClick={() => {
                onFontChange(font.id);
                playSound('folder', 0.08);
              }}
              className={`h-[3.2vh] px-[0.7vh] border text-[0.95vh] tracking-wider transition-colors truncate ${
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

        <div className="mt-[1vh] border border-[rgba(0,255,65,0.12)] p-[0.8vh]">
          <div className="flex items-center justify-between mb-[0.7vh]">
            <span className="text-[1vh] tracking-wider text-muthur-secondary opacity-70">AUDIO</span>
            <button
              onClick={() => {
                onAudioChange({ audioEnabled: !settings.audioEnabled });
                playSound(settings.audioEnabled ? 'denied' : 'granted', 0.1);
              }}
              className={`px-[0.7vh] py-[0.2vh] border text-[0.9vh] tracking-wider ${
                settings.audioEnabled
                  ? 'border-muthur-primary text-muthur-primary'
                  : 'border-[rgba(255,59,83,0.45)] text-muthur-accent'
              }`}
            >
              {settings.audioEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.audioVolume}
            onChange={(event) => onAudioChange({ audioVolume: Number(event.target.value) })}
            onPointerUp={() => playSound('scroll', 0.08)}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>
      </section>
    </div>
  );
}

function LayoutControls({
  settings,
  deckSplit,
  onLayoutPresetChange,
  onDeckSplitChange,
}: {
  settings: InterfaceSettings;
  deckSplit: number;
  onLayoutPresetChange: (id: LayoutPresetId) => void;
  onDeckSplitChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1.1fr_0.9fr] gap-[1vh] h-full">
      <section className="min-w-0">
        <ControlHeader icon={<LayoutIcon size={13} />} label="LAYOUT" />
        <div className="grid grid-cols-2 gap-[0.7vh]">
          {LAYOUT_PRESETS.filter((preset) => preset.id !== 'custom').map((preset) => (
            <button
              key={preset.id}
              onClick={() => onLayoutPresetChange(preset.id)}
              className={`border p-[0.7vh] h-[7.4vh] transition-all ${
                settings.layoutPreset === preset.id
                  ? 'border-muthur-primary bg-[rgba(0,255,65,0.08)]'
                  : 'border-[rgba(0,255,65,0.12)] hover:border-[rgba(0,255,65,0.35)]'
              }`}
            >
              <div className="text-[1vh] tracking-widest text-muthur-primary mb-[0.5vh]">{preset.label}</div>
              <LayoutDiagram layout={preset.layout} />
            </button>
          ))}
        </div>
      </section>

      <section className="min-w-0">
        <ControlHeader icon={<LayoutIcon size={13} />} label="DECK" />
        <div className="border border-[rgba(0,255,65,0.12)] p-[1vh] h-[calc(100%-2.1vh)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[1vh] text-muthur-secondary opacity-70 mb-[0.7vh]">
              <span>BALANCE</span>
              <span className="tabular-nums text-muthur-primary">{Math.round(deckSplit)}%</span>
            </div>
            <input
              type="range"
              min={25}
              max={65}
              step={1}
              value={deckSplit}
              onChange={(event) => onDeckSplitChange(Number(event.target.value))}
              onPointerUp={() => playSound('scroll', 0.08)}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
          <div className="grid grid-cols-[var(--deck-split)_1fr] gap-[0.5vh] h-[6vh]" style={{ ['--deck-split' as string]: `${deckSplit}%` }}>
            <div className="border border-muthur-border bg-[rgba(0,255,65,0.05)]" />
            <div className="border border-muthur-border bg-[rgba(0,255,65,0.025)]" />
          </div>
        </div>
      </section>
    </div>
  );
}

function LayoutDiagram({ layout }: { layout: { leftWidth: number; rightWidth: number; bottomHeight: number; deckSplit: number } }) {
  const center = 100 - layout.leftWidth - layout.rightWidth;
  return (
    <div className="h-[4.6vh] border border-[rgba(0,255,65,0.2)] p-[0.3vh] flex flex-col gap-[0.3vh]">
      <div className="flex flex-1 gap-[0.3vh] min-h-0">
        <span className="bg-[rgba(0,255,65,0.18)]" style={{ width: `${layout.leftWidth}%` }} />
        <span className="bg-[rgba(0,255,65,0.36)]" style={{ width: `${center}%` }} />
        <span className="bg-[rgba(0,255,65,0.12)]" style={{ width: `${layout.rightWidth}%` }} />
      </div>
      <div className="bg-[rgba(0,255,65,0.16)]" style={{ height: `${Math.max(18, layout.bottomHeight)}%` }} />
    </div>
  );
}

function ControlHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="text-[1.05vh] tracking-widest opacity-60 mb-[0.7vh] flex items-center gap-[0.5vh] panel-header-bracket border-t border-[rgba(0,255,65,0.15)] pt-[0.5vh]">
      {icon}
      {label}
    </div>
  );
}

function SignalLockGame() {
  const [running, setRunning] = useState(false);
  const [sweep, setSweep] = useState(0);
  const [target, setTarget] = useState(4);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [status, setStatus] = useState('ARMED');

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

  const reset = () => {
    setRunning(true);
    setSweep(0);
    setTarget(targetSeed[Math.floor(Math.random() * targetSeed.length)]);
    setScore(0);
    setTimeLeft(30);
    setStatus('TRACKING');
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
    <div className="grid grid-cols-[1fr_0.9fr_0.72fr] gap-[1vh] h-full">
      <section className="min-w-0 flex flex-col">
        <ControlHeader icon={<GameIcon size={13} />} label="SIGNAL LOCK" />
        <div className="grid grid-cols-3 gap-[0.6vh] flex-1 min-h-0">
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
      </section>

      <section className="min-w-0 flex flex-col">
        <ControlHeader icon={<GameIcon size={13} />} label="RUN" />
        <div className="border border-[rgba(0,255,65,0.12)] p-[1vh] flex-1 min-h-0 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-[0.6vh] text-[1vh]">
            <Metric label="STATE" value={status} />
            <Metric label="TIME" value={`${timeLeft}s`} />
            <Metric label="SCORE" value={String(score)} />
            <Metric label="TARGET" value={String(target + 1)} />
          </div>
          <div className="h-[0.8vh] bg-[rgba(0,255,65,0.08)] overflow-hidden">
            <div className="h-full bg-muthur-primary transition-all" style={{ width: `${(timeLeft / 30) * 100}%` }} />
          </div>
          <button
            onClick={running ? lock : reset}
            className="h-[3.3vh] border border-muthur-primary text-muthur-primary tracking-widest text-[1.1vh] hover:bg-[rgba(0,255,65,0.08)] transition-colors"
          >
            {running ? 'LOCK' : 'ARM'}
          </button>
        </div>
      </section>

      <section className="min-w-0 flex flex-col">
        <ControlHeader icon={<GameIcon size={13} />} label="CONCEPTS" />
        <div className="border border-[rgba(0,255,65,0.12)] p-[0.7vh] flex-1 min-h-0 overflow-hidden">
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[rgba(0,255,65,0.1)] px-[0.6vh] py-[0.4vh] min-w-0">
      <div className="text-[0.8vh] tracking-wider text-muthur-secondary opacity-40">{label}</div>
      <div className="text-[1.2vh] tracking-wider text-muthur-primary truncate">{value}</div>
    </div>
  );
}
