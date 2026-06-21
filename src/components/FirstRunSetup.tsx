import { ReactNode } from 'react';
import { BOOT_PRESETS, FONT_PRESETS, InterfaceSettings, LAYOUT_PRESETS, SOUND_PACKS, THEME_PRESETS } from '../theme';
import { playSound } from '../audio';

interface FirstRunSetupProps {
  settings: InterfaceSettings;
  onSettingsChange: (patch: Partial<InterfaceSettings>) => void;
  onComplete: () => void;
}

export default function FirstRunSetup({ settings, onSettingsChange, onComplete }: FirstRunSetupProps) {
  const finish = () => {
    playSound('granted', 0.14);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9500] bg-[rgba(0,0,0,0.78)] flex items-center justify-center p-[4vh]">
      <div className="w-full max-w-[980px] max-h-[86vh] overflow-hidden border-2 border-muthur-primary bg-[var(--color-panel)] text-muthur-secondary shadow-[0_0_36px_rgba(var(--color-r),var(--color-g),var(--color-b),0.24)] bios-window">
        <div className="h-[4vh] flex items-center justify-center border-b border-muthur-primary bg-[rgba(0,255,65,0.08)] font-display text-[1.4vh] tracking-[0.25em] text-muthur-primary">
          MUTHUR SETUP UTILITY
        </div>
        <div className="grid grid-cols-[1fr_1fr_0.9fr] gap-[1.2vh] p-[1.4vh]">
          <SetupSection title="STANDARD INTERFACE FEATURES">
            <SetupSelect
              label="Theme"
              value={settings.themeId}
              options={THEME_PRESETS.map(theme => ({ id: theme.id, label: theme.label }))}
              onChange={(themeId) => onSettingsChange({ themeId: themeId as InterfaceSettings['themeId'] })}
            />
            <SetupSelect
              label="Font"
              value={settings.fontId}
              options={FONT_PRESETS.map(font => ({ id: font.id, label: font.label }))}
              onChange={(fontId) => onSettingsChange({ fontId: fontId as InterfaceSettings['fontId'] })}
            />
            <SetupSelect
              label="Layout"
              value={settings.layoutPreset}
              options={LAYOUT_PRESETS.filter(preset => preset.id !== 'custom').map(preset => ({ id: preset.id, label: preset.label }))}
              onChange={(layoutPreset) => onSettingsChange({ layoutPreset: layoutPreset as InterfaceSettings['layoutPreset'] })}
            />
          </SetupSection>

          <SetupSection title="BOOT / AUDIO">
            <SetupSelect
              label="Boot"
              value={settings.bootPreset}
              options={BOOT_PRESETS.map(preset => ({ id: preset.id, label: preset.label }))}
              onChange={(bootPreset) => onSettingsChange({ bootPreset: bootPreset as InterfaceSettings['bootPreset'] })}
            />
            <SetupSelect
              label="Sound"
              value={settings.soundPack}
              options={SOUND_PACKS.map(pack => ({ id: pack.id, label: pack.label }))}
              onChange={(soundPack) => onSettingsChange({ soundPack: soundPack as InterfaceSettings['soundPack'] })}
            />
            <label className="grid grid-cols-[7vh_1fr] items-center gap-[1vh] text-[1.1vh]">
              <span className="text-muthur-primary">Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.audioVolume}
                onChange={(event) => onSettingsChange({ audioVolume: Number(event.target.value) })}
                className="accent-[var(--color-accent)]"
              />
            </label>
          </SetupSection>

          <SetupSection title="OPTIONAL OFFLINE PACK">
            <SetupToggle
              label="AI model"
              active={settings.offlinePack.ai}
              onClick={() => onSettingsChange({ offlinePack: { ...settings.offlinePack, enabled: true, ai: !settings.offlinePack.ai } })}
            />
            <SetupToggle
              label="Wiki archive"
              active={settings.offlinePack.wiki}
              onClick={() => onSettingsChange({ offlinePack: { ...settings.offlinePack, enabled: true, wiki: !settings.offlinePack.wiki } })}
            />
            <SetupToggle
              label="Maps"
              active={settings.offlinePack.maps}
              onClick={() => onSettingsChange({ offlinePack: { ...settings.offlinePack, enabled: true, maps: !settings.offlinePack.maps } })}
            />
            <div className="text-[0.95vh] leading-relaxed opacity-65">
              Offline packs are voluntary. Install/update will ask before downloading large AI, wiki, or map files.
            </div>
          </SetupSection>
        </div>
        <div className="h-[4.2vh] border-t border-muthur-primary flex items-center justify-between px-[1.2vh] text-[1vh]">
          <span className="opacity-55">F10:SAVE  ESC:LATER  ENTER:SELECT</span>
          <button onClick={finish} className="h-[2.8vh] px-[1.4vh] border border-muthur-primary bg-muthur-primary text-muthur-bg tracking-widest">
            SAVE AND ENTER
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-muthur-primary p-[1vh] min-w-0 min-h-[22vh]">
      <div className="text-[1.05vh] tracking-widest text-muthur-primary mb-[1vh]">{title}</div>
      <div className="space-y-[0.8vh]">{children}</div>
    </section>
  );
}

function SetupSelect({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <label className="grid grid-cols-[7vh_1fr] items-center gap-[1vh] text-[1.1vh]">
      <span className="text-muthur-primary">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent border border-[rgba(0,255,65,0.28)] text-muthur-secondary px-[0.5vh] py-[0.35vh] focus:outline-none"
      >
        {options.map(option => <option key={option.id} value={option.id} className="bg-[#05080d]">{option.label}</option>)}
      </select>
    </label>
  );
}

function SetupToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between border border-[rgba(0,255,65,0.18)] px-[0.7vh] py-[0.45vh] text-[1vh]">
      <span>{label}</span>
      <span className={active ? 'text-muthur-primary' : 'text-muthur-accent'}>{active ? '[Enabled]' : '[Skipped]'}</span>
    </button>
  );
}
