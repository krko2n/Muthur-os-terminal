import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playSound } from '../../audio';

interface SignalLockProps {
  fullscreen?: boolean;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[rgba(0,255,65,0.1)] px-[0.6vh] py-[0.45vh] min-w-0">
      <div className="text-[0.8vh] tracking-wider text-muthur-secondary opacity-55">{label}</div>
      <div className="text-[1.08vh] tracking-wider text-muthur-primary truncate">{value}</div>
    </div>
  );
}

interface GameTutorial {
  name: string;
  objective: string;
  controls: Array<{ key: string; action: string }>;
}

const TUTORIAL: GameTutorial = {
  name: 'SIGNAL LOCK',
  objective: 'Hit the sweep exactly when it lands on the red target cell to score points within 30 seconds.',
  controls: [
    { key: 'CLICK / ARM', action: 'Start the game or lock the signal' },
    { key: 'LEFT CLICK', action: 'Click any grid cell to attempt a lock' },
    { key: 'TIMING', action: 'Green sweep moves across 9 cells -- hit it on the red target' },
  ],
};

const sessionTutorialShown = new Set<string>();

function TutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    sessionTutorialShown.add('signal');
    onDismiss();
    playSound('switch', 0.06);
  }, [onDismiss]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      event.preventDefault();
      dismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dismiss]);

  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      onClick={dismiss}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(2, 4, 8, 0.92)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        className="border p-[2vh] max-w-[42vh] w-full"
        style={{
          borderColor: 'var(--color-accent)',
          background: 'rgba(5, 8, 13, 0.96)',
          boxShadow: '0 0 18px rgba(var(--color-r, 0), var(--color-g, 255), var(--color-b, 65), 0.15), inset 0 0 30px rgba(0,0,0,0.5)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="text-[1.4vh] tracking-[0.3em] font-display mb-[0.8vh] pb-[0.6vh] border-b"
          style={{ color: 'var(--color-accent)', borderColor: 'rgba(var(--color-r, 0), var(--color-g, 255), var(--color-b, 65), 0.25)' }}
        >
          HOW TO PLAY
        </div>
        <div className="text-[1.3vh] tracking-widest font-display mb-[1vh]" style={{ color: 'var(--color-accent)' }}>
          {TUTORIAL.name}
        </div>
        <div className="text-[1vh] leading-relaxed mb-[1.2vh] opacity-80" style={{ color: 'var(--color-text, #b8c4b0)' }}>
          {TUTORIAL.objective}
        </div>
        <div className="text-[0.9vh] tracking-widest mb-[0.8vh] opacity-60" style={{ color: 'var(--color-accent)' }}>
          CONTROLS
        </div>
        <div className="space-y-[0.5vh] mb-[1.5vh]">
          {TUTORIAL.controls.map((control) => (
            <div key={control.key} className="grid grid-cols-[11vh_1fr] gap-[1vh] items-start">
              <span
                className="text-[0.9vh] tracking-wider px-[0.5vh] py-[0.2vh] border text-center"
                style={{
                  borderColor: 'rgba(var(--color-r, 0), var(--color-g, 255), var(--color-b, 65), 0.3)',
                  color: 'var(--color-accent)',
                }}
              >
                {control.key}
              </span>
              <span className="text-[0.88vh] opacity-70" style={{ color: 'var(--color-text, #b8c4b0)' }}>
                {control.action}
              </span>
            </div>
          ))}
        </div>
        <div
          className="text-[0.95vh] tracking-widest text-center py-[0.8vh] border animate-pulse"
          style={{
            borderColor: 'rgba(var(--color-r, 0), var(--color-g, 255), var(--color-b, 65), 0.25)',
            color: 'var(--color-accent)',
          }}
        >
          PRESS ANY KEY OR CLICK TO START
        </div>
      </div>
    </div>
  );
}

export default function SignalLock({ fullscreen }: SignalLockProps) {
  const [showTutorial, setShowTutorial] = useState(() => !sessionTutorialShown.has('signal'));
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

  const gridSize = fullscreen ? 'h-[8vh]' : 'h-auto';

  return (
    <div className={`relative flex flex-col items-center justify-center ${fullscreen ? 'w-full h-full p-[3vh]' : 'w-full h-full'}`}>
      {showTutorial && <TutorialOverlay onDismiss={() => setShowTutorial(false)} />}

      <div className="text-[1.6vh] tracking-[0.3em] font-display mb-[2vh] text-muthur-primary opacity-80">
        SIGNAL LOCK
      </div>

      <div className={`grid ${fullscreen ? 'grid-cols-[1fr_0.6fr] gap-[3vh] max-w-[80vh] w-full' : 'grid-cols-[1fr_0.72fr] gap-[0.7vh] w-full'} flex-1 min-h-0`}>
        <div className={`grid grid-cols-3 gap-[0.8vh] min-h-0 ${fullscreen ? 'max-h-[50vh]' : ''}`}>
          {Array.from({ length: 9 }, (_, index) => {
            const isSweep = index === sweep;
            const isTarget = index === target;
            return (
              <button
                key={index}
                onClick={lock}
                className={`border transition-all ${gridSize} ${
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
        <div className="border border-[rgba(0,255,65,0.12)] p-[1.2vh] min-w-0 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-[0.6vh]">
            <Metric label="STATE" value={status} />
            <Metric label="TIME" value={`${timeLeft}s`} />
            <Metric label="SCORE" value={String(score)} />
            <Metric label="TARGET" value={String(target + 1)} />
          </div>
          <div className="h-[0.7vh] bg-[rgba(0,255,65,0.08)] overflow-hidden my-[1vh]">
            <div className="h-full bg-muthur-primary transition-all" style={{ width: `${(timeLeft / 30) * 100}%` }} />
          </div>
          <button onClick={running ? lock : reset} className="h-[4vh] border border-muthur-primary text-muthur-primary tracking-widest text-[1.1vh]">
            {running ? 'LOCK [CLICK]' : 'ARM [CLICK]'}
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            className="mt-[0.8vh] h-[3vh] border border-[rgba(0,255,65,0.25)] text-muthur-secondary tracking-widest text-[0.9vh] hover:border-muthur-primary transition-colors"
          >
            HELP
          </button>
        </div>
      </div>
    </div>
  );
}
