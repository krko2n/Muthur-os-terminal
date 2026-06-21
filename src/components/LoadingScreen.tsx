import { useState, useEffect, useRef } from 'react';
import MuthurLogo from './MuthurLogo';
import { playSound } from '../audio';
import { BootPresetId } from '../theme';

const CORE_BOOT_LOG = [
  'MUTHUR CORE // COLD START',
  'Power bus accepted',
  'Display plane sealed',
  'Input matrix armed',
  'Audio bus calibrated',
  'Operator profile resolved',
  'Theme register loaded',
  'Layout register loaded',
  'Terminal bridge attached',
  'Local command channel ready',
  'Structured web channel ready',
  'Orbital display cache verified',
  'Control deck online',
  'Micro-sim module armed',
  'AI endpoint handshake queued',
  'Session watchdog armed',
  'Native shell handoff prepared',
  'MUTHUR interface nominal',
  'Boot Complete',
];

const BIOS_BOOT_LOG = [
  'CMOS SETUP UTILITY // MUTHUR BOARD',
  'Standard CMOS features',
  'Date register synchronized',
  'Time register synchronized',
  'IDE channel 0 master: native shell',
  'IDE channel 0 slave: structured web',
  'IDE channel 2 master: orbital cache',
  'Drive A: disabled',
  'Floppy 3 mode: disabled',
  'Keyboard: all native keys accepted',
  'Base memory: sealed interface',
  'Extended memory: control deck',
  'Theme: BIOS BLUE',
  'F10 save profile queued',
  'ESC exit to MUTHUR shell',
  'Boot Complete',
];

const CRT_BOOT_LOG = [
  'REC // GPU MONITOR v2.7.1',
  'System overview probe',
  'CPU load channel ready',
  'Storage monitor ready',
  'Active process table ready',
  'Command console bridged',
  'System alerts armed',
  'Signal lock game armed',
  'Mission log mounted',
  'Offline pack manifest scanned',
  'Threat level: orange',
  'Integrity: nominal',
  'Boot Complete',
];

const SILENT_BOOT_LOG = [
  'MUTHUR SESSION',
  'Runtime ready',
  'Panels ready',
  'Boot Complete',
];

const BOOT_LOGS: Record<BootPresetId, string[]> = {
  core: CORE_BOOT_LOG,
  bios: BIOS_BOOT_LOG,
  crt: CRT_BOOT_LOG,
  silent: SILENT_BOOT_LOG,
};

interface LoadingScreenProps {
  onComplete: () => void;
  bootPreset?: BootPresetId;
}

export default function LoadingScreen({ onComplete, bootPreset = 'core' }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'boot' | 'title'>('logo');
  const [visibleLines, setVisibleLines] = useState(0);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stdoutAudio = useRef<HTMLAudioElement | null>(null);
  const bootLog = BOOT_LOGS[bootPreset] ?? CORE_BOOT_LOG;

  useEffect(() => {
    try {
      stdoutAudio.current = new Audio('/audio/ui-click.ogg');
      stdoutAudio.current.volume = 0.04;
    } catch {}
  }, []);

  useEffect(() => {
    playSound('boot', 0.12);
    const fadeIn = setTimeout(() => setLogoOpacity(1), 100);
    const startBoot = setTimeout(() => setPhase('boot'), 1800);
    return () => { clearTimeout(fadeIn); clearTimeout(startBoot); };
  }, []);

  useEffect(() => {
    if (phase !== 'boot') return;

    if (visibleLines >= bootLog.length) {
      playSound('granted', 0.4);
      const toTitle = setTimeout(() => setPhase('title'), 600);
      return () => clearTimeout(toTitle);
    }

    const line = bootLog[visibleLines];
    const progress = visibleLines / bootLog.length;
    const baseDelay = line === '' ? 80 :
                      line.startsWith('===') ? 150 :
                      line === 'Boot Complete' ? 400 :
                      Math.max(45, 190 * Math.pow(1 - progress, 2));

    const timer = setTimeout(() => {
      setVisibleLines(prev => prev + 1);
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
      if (stdoutAudio.current && line && !line.startsWith('===')) {
        stdoutAudio.current.currentTime = 0;
        stdoutAudio.current.play().catch(() => {});
      }
    }, baseDelay);

    return () => clearTimeout(timer);
  }, [visibleLines, phase]);

  useEffect(() => {
    if (phase !== 'title') return;
    playSound('theme', 0.18);
    const glitchStart = setTimeout(() => setGlitchActive(true), 500);
    const glitchEnd = setTimeout(() => setGlitchActive(false), 1200);
    const done = setTimeout(onComplete, 2000);
    return () => { clearTimeout(glitchStart); clearTimeout(glitchEnd); clearTimeout(done); };
  }, [phase, onComplete]);

  const bootProgress = Math.min(100, Math.round((visibleLines / bootLog.length) * 100));
  const title = bootPreset === 'bios' ? 'CMOS SETUP UTILITY' : bootPreset === 'crt' ? 'GPU MONITOR' : 'MUTHUR CORE';
  const subtitle = bootPreset === 'silent' ? 'SESSION HANDOFF' : bootPreset === 'bios' ? 'STANDARD CMOS FEATURES' : bootPreset === 'crt' ? 'SYSTEM OVERVIEW' : 'SESSION HANDOFF';

  if (phase === 'logo') {
    return (
      <div className="w-screen h-screen bg-[#05080d] flex items-center justify-center overflow-hidden">
        <div
          className="flex flex-col items-center gap-6"
          style={{ opacity: logoOpacity, transition: 'opacity 1s ease-in' }}
        >
          <MuthurLogo size="12vh" color="var(--color-accent)" shadowColor="rgba(0,255,65,0.08)" />
          <div className="text-muthur-primary font-display text-[1.2vh] tracking-[0.5em] uppercase opacity-70 animate-pulse">
            CORE WAKE
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'title') {
    return (
      <div className="w-screen h-screen bg-[#05080d] flex items-center justify-center overflow-hidden">
        <div className={`title-glitch ${glitchActive ? 'active' : ''}`}>
          <h1 className="text-[10vh] font-display font-bold text-muthur-primary tracking-[0.2em] text-glow">
            MUTHUR
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#05080d] flex items-center justify-center overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full p-8 font-mono overflow-hidden flex flex-col"
      >
        <div className="shrink-0 flex items-center justify-between border-b border-[rgba(0,255,65,0.18)] pb-4 mb-5">
          <div>
            <div className="text-muthur-primary font-display text-[2.2vh] tracking-[0.25em]">{title}</div>
            <div className="text-muthur-secondary text-[1.1vh] tracking-[0.25em] opacity-50 mt-1">{subtitle}</div>
          </div>
          <div className="text-muthur-primary tabular-nums text-[1.4vh]">{bootProgress}%</div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden text-[12px] leading-[1.7]">
          {bootLog.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={`${
                line === 'Boot Complete'
                  ? 'text-muthur-primary text-glow'
                  : line.toLowerCase().includes('ready') || line.toLowerCase().includes('online') || line.toLowerCase().includes('loaded')
                  ? 'text-muthur-primary opacity-80'
                  : 'text-muthur-secondary opacity-55'
              }`}
            >
              <span className="opacity-35 mr-3 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              {line || ' '}
            </div>
          ))}
          {visibleLines < bootLog.length && (
            <span className="inline-block w-[8px] h-[13px] bg-muthur-primary animate-pulse" />
          )}
        </div>

        <div className="shrink-0 mt-5">
          <div className="h-[0.9vh] bg-[rgba(0,255,65,0.08)] border border-[rgba(0,255,65,0.18)] overflow-hidden">
            <div
              className="h-full bg-muthur-primary transition-all duration-200"
              style={{ width: `${bootProgress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[1vh] text-muthur-secondary opacity-45 tracking-[0.2em]">
            <span>WAKE</span>
            <span>VERIFY</span>
            <span>HANDOFF</span>
          </div>
        </div>
      </div>
    </div>
  );
}
