import { useMemo, useState } from 'react';
import { InterfaceSettings, THEME_PRESETS } from '../theme';
import { playSound } from '../audio';

interface CommandPaletteProps {
  open: boolean;
  settings: InterfaceSettings;
  onClose: () => void;
  onSettingsChange: (patch: Partial<InterfaceSettings>) => void;
  onOpenShutdown: () => void;
}

export default function CommandPalette({ open, settings, onClose, onSettingsChange, onOpenShutdown }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  const commands = useMemo(() => [
    ...THEME_PRESETS.map(theme => ({
      id: `theme-${theme.id}`,
      title: `Theme: ${theme.label}`,
      body: 'switch interface color theme',
      run: () => onSettingsChange({ themeId: theme.id, customTheme: { ...settings.customTheme, enabled: false } }),
    })),
    {
      id: 'cinematic',
      title: settings.cinematicMode ? 'Disable Cinematic Mode' : 'Enable Cinematic Mode',
      body: 'focus the command core',
      run: () => onSettingsChange({ cinematicMode: !settings.cinematicMode }),
    },
    {
      id: 'performance',
      title: settings.performanceMode ? 'Disable Performance Mode' : 'Enable Performance Mode',
      body: 'reduce glow and motion',
      run: () => onSettingsChange({ performanceMode: !settings.performanceMode }),
    },
    {
      id: 'offline',
      title: 'Enable Offline Pack Plan',
      body: 'mark AI/wiki/docs pack for voluntary install',
      run: () => onSettingsChange({ offlinePack: { ...settings.offlinePack, enabled: true, ai: true, wiki: true, docs: true } }),
    },
    {
      id: 'setup',
      title: 'Open First-Run Setup',
      body: 'run the setup utility again',
      run: () => onSettingsChange({ firstRunComplete: false }),
    },
    {
      id: 'shutdown',
      title: 'Open Shutdown Screen',
      body: 'show safe power-down sequence',
      run: onOpenShutdown,
    },
  ], [settings, onSettingsChange, onOpenShutdown]);

  const filtered = commands.filter(command => `${command.title} ${command.body}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  if (!open) return null;

  const run = (command: typeof commands[number]) => {
    command.run();
    playSound('granted', 0.1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9600] bg-[rgba(0,0,0,0.55)] flex items-start justify-center pt-[12vh]">
      <div className="w-[min(720px,88vw)] border border-muthur-primary bg-[var(--color-panel)] shadow-[0_0_28px_rgba(var(--color-r),var(--color-g),var(--color-b),0.2)]">
        <div className="border-b border-[rgba(0,255,65,0.18)] px-[1vh] py-[0.8vh] flex items-center gap-[1vh]">
          <span className="text-muthur-primary text-[1.2vh] tracking-widest">COMMAND</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose();
              if (event.key === 'Enter' && filtered[0]) run(filtered[0]);
            }}
            className="flex-1 bg-transparent outline-none text-muthur-secondary text-[1.4vh]"
            placeholder="type theme, offline, shutdown..."
          />
          <button onClick={onClose} className="text-muthur-secondary opacity-55 text-[1vh]">ESC</button>
        </div>
        <div className="p-[0.8vh] space-y-[0.45vh]">
          {filtered.map(command => (
            <button
              key={command.id}
              onClick={() => run(command)}
              className="w-full text-left border border-[rgba(0,255,65,0.1)] hover:border-muthur-primary px-[0.8vh] py-[0.65vh]"
            >
              <div className="text-[1.05vh] text-muthur-primary tracking-wider">{command.title}</div>
              <div className="text-[0.82vh] text-muthur-secondary opacity-45">{command.body}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
