import { useEffect, useState } from 'react';
import { playSound } from '../audio';

interface ShutdownScreenProps {
  open: boolean;
  onCancel: () => void;
}

const STEPS = [
  'closing web channel',
  'parking orbital display',
  'saving interface registers',
  'flushing mission log',
  'standing by for system power command',
];

export default function ShutdownScreen({ open, onCancel }: ShutdownScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }
    playSound('orbit', 0.08);
    const timer = window.setInterval(() => {
      setProgress(prev => Math.min(100, prev + 4));
    }, 160);
    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const activeStep = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));

  return (
    <div className="fixed inset-0 z-[9700] bg-[var(--color-bg)] flex items-center justify-center p-[5vh]">
      <div className="w-full max-w-[760px] border-2 border-muthur-primary p-[2vh] bg-[rgba(0,0,0,0.2)] bios-window">
        <div className="text-center text-[3.4vh] font-display tracking-[0.18em] text-muthur-primary text-glow">
          SYSTEM POWERDOWN
        </div>
        <div className="mt-[1.2vh] text-center text-[1.1vh] text-muthur-secondary opacity-55 tracking-[0.22em]">
          SAFE SHUTDOWN SEQUENCE
        </div>

        <div className="mt-[2vh] h-[1.1vh] bg-[rgba(0,255,65,0.08)] border border-[rgba(0,255,65,0.22)]">
          <div className="h-full bg-muthur-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-[1.5vh] grid grid-cols-1 gap-[0.55vh]">
          {STEPS.map((step, index) => (
            <div key={step} className={`flex justify-between border px-[0.8vh] py-[0.45vh] text-[1vh] ${
              index <= activeStep ? 'border-muthur-primary text-muthur-primary' : 'border-[rgba(0,255,65,0.12)] text-muthur-secondary opacity-45'
            }`}>
              <span>{String(index + 1).padStart(2, '0')} {step}</span>
              <span>{index < activeStep ? 'DONE' : index === activeStep ? 'RUN' : 'WAIT'}</span>
            </div>
          ))}
        </div>

        <div className="mt-[2vh] grid grid-cols-2 gap-[1vh]">
          <button onClick={onCancel} className="h-[3.4vh] border border-muthur-primary text-muthur-primary tracking-widest">
            CANCEL
          </button>
          <div className="h-[3.4vh] border border-[rgba(0,255,65,0.2)] text-muthur-secondary opacity-65 flex items-center justify-center tracking-widest text-[1vh]">
            RUN TERMINAL COMMAND: kys
          </div>
        </div>
      </div>
    </div>
  );
}
