import { useState, useEffect, useRef } from 'react';
import MuthurLogo from './MuthurLogo';

const BOOT_LOG = [
  'Welcome to MUTHUR-OS!',
  'vm_page_bootstrap: 987323 free pages and 53061 wired pages',
  'kext submap [0xffffff7f8072e000 - 0xffffff8000000000]',
  'zone leak detection enabled',
  'standard timeslicing quantum is 10000 us',
  'TSC Deadline Timer supported and enabled',
  'MUTHURACPICPU: ProcessorId=1 LocalApicId=0 Enabled',
  'MUTHURACPICPU: ProcessorId=2 LocalApicId=2 Enabled',
  'MUTHURACPICPU: ProcessorId=3 LocalApicId=1 Enabled',
  'MUTHURACPICPU: ProcessorId=4 LocalApicId=3 Enabled',
  'calling mpo_policy_init for SecurityNet',
  'Security policy loaded: Seatbelt sandbox policy (Sandbox)',
  'Security policy loaded: Quarantine policy (Quarantine)',
  '',
  'HN_ Framework successfully initialized',
  'using 16384 buffer headers and 10240 cluster IO buffer headers',
  'IOAPIC: Version 0x20 Vectors 64:87',
  'ACPI: System State [S0 S3 S4 S5] (S3)',
  '[ PCI configuration begin ]',
  'MUTHURIntelCPUPowerManagement: Turbo Ratios 0046',
  'MUTHURIntelCPUPowerManagement: initialization complete',
  '[ PCI configuration end, bridges 12 devices 16 ]',
  'mbinit: done [64 MB total pool size, (42/21) split]',
  'com.MUTHUR.FSCompressionTypeZlib kmod start',
  'com.MUTHUR.FSCompressionTypeZlib load succeeded',
  '',
  'MUTHURIntelCPUPowerManagementClient: ready',
  'wl0: Broadcom BCM4331 802.11 Wireless Controller',
  'FireWire (OHCI) built-in now active; max speed s800.',
  'BSD root: disk0s2, major 14, minor 2',
  'Kernel is LP64',
  '',
  'IOThunderboltSwitch: status = 0x00000000',
  'AirPort: Link Up on en1',
  '',
  '===================================================',
  '  MUTHUR-OS KERNEL v0.1.0 - BUILD 2026.06.19',
  '  Neural Interface Active',
  '  All Systems Nominal',
  '===================================================',
  '',
  'Boot Complete',
];

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'boot'>('logo');
  const [visibleLines, setVisibleLines] = useState(0);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const audio = new Audio('/audio/theme.wav');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    const fadeIn = setTimeout(() => setLogoOpacity(1), 100);
    const startBoot = setTimeout(() => setPhase('boot'), 2500);
    return () => { clearTimeout(fadeIn); clearTimeout(startBoot); };
  }, []);

  useEffect(() => {
    if (phase !== 'boot') return;

    if (visibleLines >= BOOT_LOG.length) {
      try {
        const granted = new Audio('/audio/granted.wav');
        granted.volume = 0.4;
        granted.play().catch(() => {});
      } catch {}
      const done = setTimeout(onComplete, 1000);
      return () => clearTimeout(done);
    }

    const line = BOOT_LOG[visibleLines];
    const delay = line === '' ? 80 :
                  line.startsWith('===') ? 150 :
                  line === 'Boot Complete' ? 400 : 22;

    const timer = setTimeout(() => {
      setVisibleLines(prev => prev + 1);
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleLines, phase, onComplete]);

  return (
    <div className="w-screen h-screen bg-[#05080d] flex items-center justify-center overflow-hidden">
      {phase === 'logo' ? (
        <div
          className="flex flex-col items-center gap-6"
          style={{ opacity: logoOpacity, transition: 'opacity 1s ease-in' }}
        >
          <MuthurLogo size="12vh" color="#00ff41" shadowColor="rgba(0,255,65,0.08)" />
          <div className="text-muthur-primary font-mono text-[1.2vh] tracking-[0.5em] uppercase opacity-60 animate-pulse">
            INITIALIZING SYSTEM
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full h-full p-6 font-mono text-[11px] leading-[1.6] overflow-hidden"
        >
          {BOOT_LOG.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={`${
                line.startsWith('===')
                  ? 'text-muthur-primary font-bold'
                  : line === 'Boot Complete'
                  ? 'text-muthur-primary text-glow'
                  : line.includes('Enabled') || line.includes('succeeded') || line.includes('ready') || line.includes('complete')
                  ? 'text-[#00ff41] opacity-70'
                  : line.includes('MUTHUR-OS KERNEL')
                  ? 'text-muthur-primary'
                  : 'text-[#aacfd1] opacity-50'
              }`}
            >
              {line || ' '}
            </div>
          ))}
          {visibleLines < BOOT_LOG.length && (
            <span className="inline-block w-[8px] h-[13px] bg-muthur-primary animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}
