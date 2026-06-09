import { useState, useEffect } from 'react';
import MuthurLogo from './MuthurLogo';

const ASCII_LOGO = `
 ███╗   ███╗██╗   ██╗████████╗██╗  ██╗██╗   ██╗██████╗
 ████╗ ████║██║   ██║╚══██╔══╝██║  ██║██║   ██║██╔══██╗
 ██╔████╔██║██║   ██║   ██║   ███████║██║   ██║██████╔╝
 ██║╚██╔╝██║██║   ██║   ██║   ██╔══██║██║   ██║██╔══██╗
 ██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║╚██████╔╝██║  ██║
 ╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝`;

const BOOT_MESSAGES = [
  'BIOS POST CHECK..................OK',
  'MEMORY TEST......................64GB OK',
  'CPU IDENTIFICATION...............VERIFIED',
  'SECURE BOOT.....................ENABLED',
  '',
  'MUTHUR CORE v0.1.0',
  'BUILD: 2026.06.09-STABLE',
  '',
  'LOADING KERNEL MODULES...........',
  '  [pty]     pseudoterminal.......OK',
  '  [sysmon]  system monitor.......OK',
  '  [ai]      neural interface.....OK',
  '  [net]     network stack........OK',
  '  [fs]      filesystem driver....OK',
  '  [gpu]     render pipeline......OK',
  '',
  'INITIALIZING SUBSYSTEMS..........',
  '  TERMINAL EMULATOR.............READY',
  '  AI CORE.......................STANDBY',
  '  GLOBAL NETWORK MAP............SYNCING',
  '',
  'AUTHENTICATION REQUIRED',
  '',
  '> MUTHUR AI TERMINAL',
  '> CORE SYSTEM INITIALIZED',
  '> AWAITING USER AUTHENTICATION...',
];

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showLogo, setShowLogo] = useState(true);
  const [logoOpacity, setLogoOpacity] = useState(0);

  useEffect(() => {
    // Fade in logo
    const fadeIn = setTimeout(() => setLogoOpacity(1), 100);

    // Start boot text after logo display
    const startBoot = setTimeout(() => {
      setShowLogo(false);
    }, 2000);

    return () => {
      clearTimeout(fadeIn);
      clearTimeout(startBoot);
    };
  }, []);

  useEffect(() => {
    if (showLogo) return;

    if (visibleLines >= BOOT_MESSAGES.length) {
      const done = setTimeout(onComplete, 800);
      return () => clearTimeout(done);
    }

    const delay = BOOT_MESSAGES[visibleLines] === '' ? 100 :
                  BOOT_MESSAGES[visibleLines].startsWith('>') ? 300 : 50;

    const timer = setTimeout(() => {
      setVisibleLines(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleLines, showLogo, onComplete]);

  return (
    <div className="w-screen h-screen bg-[#05080d] flex items-center justify-center overflow-hidden">
      {showLogo ? (
        <div
          className="flex flex-col items-center gap-6"
          style={{ opacity: logoOpacity, transition: 'opacity 0.8s ease-in' }}
        >
          <MuthurLogo size="12vh" color="#00ff41" shadowColor="rgba(0,255,65,0.08)" />
          <pre className="text-muthur-primary font-mono text-[1.4vh] leading-tight text-center">
            {ASCII_LOGO}
          </pre>
        </div>
      ) : (
        <div className="w-full max-w-[80ch] px-8 font-mono text-[1.3vh] leading-relaxed">
          {BOOT_MESSAGES.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={`${
                line.startsWith('>')
                  ? 'text-muthur-primary'
                  : line.startsWith('  [')
                  ? 'text-muthur-secondary'
                  : line.includes('OK') || line.includes('READY') || line.includes('ENABLED')
                  ? 'text-muthur-primary opacity-80'
                  : 'text-muthur-secondary opacity-60'
              }`}
            >
              {line || ' '}
            </div>
          ))}
          {visibleLines < BOOT_MESSAGES.length && (
            <span className="inline-block w-[1ch] h-[1.5vh] bg-muthur-primary animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}
