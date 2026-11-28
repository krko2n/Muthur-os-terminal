import { ReactNode, useEffect } from 'react';
import {
  BOOT_PRESETS,
  FONT_PRESETS,
  getStatusColors,
  InterfaceSettings,
  LAYOUT_PRESETS,
  SOUND_PACKS,
  THEME_PRESETS,
} from '../theme';
import { playSound, SoundPack } from '../audio';

interface SetupCardProps {
  settings: InterfaceSettings;
  onSettingsChange: (patch: Partial<InterfaceSettings>) => void;
  onComplete: () => void;
}

// First-boot configuration, shown as the content of the SETTINGS tab instead of
// a floating window. Every choice applies live, so the operator sees the theme,
// font and layout change behind the card before committing.
export default function SetupCard({ settings, onSettingsChange, onComplete }: SetupCardProps) {
  const finish = () => {
    playSound('granted', 0.18);
    onComplete();
  };

  useEffect(() => {
    // GTK reserves F10 for menus on Linux, so Ctrl+S is the shortcut that always works.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F10' || (event.ctrlKey && event.key.toLowerCase() === 's')) {
        event.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const choose = (patch: Partial<InterfaceSettings>, sound: Parameters<typeof playSound>[0] = 'keyboard') => {
    onSettingsChange(patch);
    playSound(sound, 0.12);
  };

  return (
    <div className="setup-card h-full min-h-0 overflow-y-auto scrollbar-thin">
      <header className="setup-card-header">
        <div>
          <div className="setup-card-kicker">MUTHUR // FIRST BOOT</div>
          <div className="setup-card-title">OPERATOR CONFIGURATION</div>
        </div>
        <div className="setup-card-hint">CHANGES APPLY LIVE // CTRL+S SAVE</div>
      </header>

      <div className="setup-card-grid">
        <SetupSection index="01" title="COLOUR SCHEME" wide>
          <div className="setup-swatches">
            {THEME_PRESETS.map((theme) => {
              const status = getStatusColors(theme);
              const active = settings.themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose({ themeId: theme.id, customTheme: { ...settings.customTheme, enabled: false } }, 'theme')}
                  className={`setup-swatch ${active ? 'setup-chip-active' : ''}`}
                >
                  <span className="setup-swatch-preview" style={{ background: theme.background, borderColor: theme.accent }}>
                    <span style={{ background: theme.accent }} />
                    <span style={{ background: status.ok }} />
                    <span style={{ background: status.warn }} />
                    <span style={{ background: status.danger }} />
                  </span>
                  <span className="setup-swatch-label">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </SetupSection>

        <SetupSection index="02" title="TYPEFACE">
          <ChipRow
            options={FONT_PRESETS.map((font) => ({ id: font.id, label: font.label }))}
            value={settings.fontId}
            onChange={(fontId) => choose({ fontId: fontId as InterfaceSettings['fontId'] })}
          />
        </SetupSection>

        <SetupSection index="03" title="PANEL LAYOUT">
          <ChipRow
            options={LAYOUT_PRESETS.filter((preset) => preset.id !== 'custom').map((preset) => ({ id: preset.id, label: preset.label }))}
            value={settings.layoutPreset}
            onChange={(layoutPreset) => choose({ layoutPreset: layoutPreset as InterfaceSettings['layoutPreset'] }, 'panels')}
          />
        </SetupSection>

        <SetupSection index="04" title="BOOT SEQUENCE">
          <ChipRow
            options={BOOT_PRESETS.map((preset) => ({ id: preset.id, label: preset.label, hint: preset.description }))}
            value={settings.bootPreset}
            onChange={(bootPreset) => choose({ bootPreset: bootPreset as InterfaceSettings['bootPreset'] })}
          />
        </SetupSection>

        <SetupSection index="05" title="SOUND">
          <ChipRow
            options={SOUND_PACKS.map((pack) => ({ id: pack.id, label: pack.label, hint: pack.description }))}
            value={settings.soundPack}
            onChange={(soundPack) => choose({ soundPack: soundPack as SoundPack }, 'granted')}
          />
          <div className="setup-row">
            <button
              type="button"
              aria-pressed={settings.audioEnabled}
              onClick={() => choose({ audioEnabled: !settings.audioEnabled })}
              className={`setup-chip ${settings.audioEnabled ? 'setup-chip-active' : ''}`}
            >
              {settings.audioEnabled ? 'AUDIO ON' : 'AUDIO OFF'}
            </button>
            <label className="setup-volume">
              <span>VOL {Math.round(settings.audioVolume * 100)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.audioVolume}
                onChange={(event) => onSettingsChange({ audioVolume: Number(event.target.value) })}
                onPointerUp={() => playSound('keyboard', 0.2)}
              />
            </label>
          </div>
        </SetupSection>

        <SetupSection index="06" title="OFFLINE PACK (OPTIONAL)">
          <div className="setup-row">
            {(['ai', 'wiki', 'maps'] as const).map((module) => {
              const active = settings.offlinePack[module];
              return (
                <button
                  key={module}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose({ offlinePack: { ...settings.offlinePack, enabled: true, [module]: !active } })}
                  className={`setup-chip ${active ? 'setup-chip-active' : ''}`}
                >
                  {module === 'ai' ? 'AI MODEL' : module === 'wiki' ? 'WIKI' : 'MAPS'} {active ? '[ON]' : '[SKIP]'}
                </button>
              );
            })}
          </div>
          <p className="setup-note">Nothing is downloaded now. Install and update ask before fetching large files.</p>
        </SetupSection>
      </div>

      <footer className="setup-card-footer">
        <span>CLICK: SELECT // CTRL+S: SAVE // + SETTINGS REOPENS THE DECK</span>
        <button type="button" onClick={finish} className="setup-commit">
          SAVE AND ENTER
        </button>
      </footer>
    </div>
  );
}

function SetupSection({ index, title, wide = false, children }: { index: string; title: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={`setup-section ${wide ? 'setup-section-wide' : ''}`}>
      <div className="setup-section-title">
        <span className="setup-section-index">{index}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; hint?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="setup-row">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          title={option.hint}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`setup-chip ${value === option.id ? 'setup-chip-active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
