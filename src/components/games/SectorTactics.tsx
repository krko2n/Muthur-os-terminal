import { useCallback, useEffect, useRef, useState } from 'react';
import { playSound } from '../../audio';

interface SectorTacticsProps {
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

const TUTORIAL = {
  name: 'SECTOR TACTICS',
  objective: 'Move your crew units to capture the enemy CORE (X) before drones eliminate your COMMAND (C).',
  controls: [
    { key: 'CLICK UNIT', action: 'Select a crew unit (C, S, or L)' },
    { key: 'CLICK CELL', action: 'Move selected unit to a highlighted legal cell' },
    { key: 'C = COMMAND', action: 'Moves 1 step in any direction (including diagonal)' },
    { key: 'S = SCOUT', action: 'Moves 1 step orthogonally (up/down/left/right)' },
    { key: 'L = LANCE', action: 'Moves up to 2 steps orthogonally' },
  ],
};

const sessionTutorialShown = new Set<string>();

function TutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    sessionTutorialShown.add('tactics');
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

export default function SectorTactics({ fullscreen }: SectorTacticsProps) {
  const [showTutorial, setShowTutorial] = useState(() => !sessionTutorialShown.has('tactics'));
  const [units, setUnits] = useState<TacticalUnit[]>(() => createTacticsUnits());
  const [selectedId, setSelectedId] = useState('cmd');
  const [status, setStatus] = useState('CAPTURE X CORE');
  const [moves, setMoves] = useState(0);
  const [over, setOver] = useState(false);
  const selected = units.find((unit) => unit.id === selectedId && unit.side === 'crew') ?? units.find((unit) => unit.side === 'crew');
  const legalMoves = selected ? getLegalTacticalMoves(selected, units) : [];
  const crewCount = units.filter((unit) => unit.side === 'crew').length;
  const systemCount = units.filter((unit) => unit.side === 'system').length;

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
      setUnits(afterCrewMove);
      setStatus('CORE CAPTURED');
      setOver(true);
      playSound('game', 0.14);
      return;
    }

    const systemTurn = advanceSystemTurn(afterCrewMove);
    setUnits(systemTurn.units);
    setStatus(systemTurn.over ? 'COMMAND LOST' : systemTurn.status);
    setOver(systemTurn.over);
    playSound(systemTurn.over ? 'error' : 'scan', 0.08);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${fullscreen ? 'w-full h-full p-[3vh]' : 'w-full h-full'}`}>
      {showTutorial && <TutorialOverlay onDismiss={() => setShowTutorial(false)} />}

      <div className="text-[1.6vh] tracking-[0.3em] font-display mb-[2vh] text-muthur-primary opacity-80">
        SECTOR TACTICS
      </div>

      <div className={`grid ${fullscreen ? 'grid-cols-[1fr_0.5fr] gap-[3vh] max-w-[80vh] w-full' : 'grid-cols-[1fr_0.72fr] gap-[0.7vh] w-full'} flex-1 min-h-0`}>
        <div className={`grid grid-cols-6 gap-[0.5vh] min-h-0 content-start ${fullscreen ? 'max-h-[55vh]' : ''}`}>
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
                className={`${fullscreen ? 'h-[8vh]' : 'h-[4.25vh]'} border text-[1.3vh] font-display tracking-wider transition-all ${
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
        <div className="border border-[rgba(0,255,65,0.12)] p-[1.2vh] min-w-0 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-[0.6vh]">
            <Metric label="STATE" value={status} />
            <Metric label="MOVES" value={String(moves)} />
            <Metric label="CREW" value={String(crewCount)} />
            <Metric label="SYSTEM" value={String(systemCount)} />
          </div>
          <div className="text-[0.9vh] text-muthur-secondary opacity-55 leading-relaxed my-[1vh]">
            [CLICK] unit to select, [CLICK] highlighted cell to move. Capture X before drones pin C.
          </div>
          <button onClick={reset} className="h-[4vh] border border-muthur-primary text-muthur-primary tracking-widest text-[1.1vh]">
            RESET [CLICK]
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
