import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playSound } from '../../audio';

interface VoidCardsProps {
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
  name: 'VOID CARDS',
  objective: 'Predict whether the next card rank will be HIGHER, LOWER, or EQUAL to build streaks and score.',
  controls: [
    { key: 'HIGHER', action: 'Predict next card has a higher rank' },
    { key: 'EQUAL', action: 'Predict next card has the same rank' },
    { key: 'LOWER', action: 'Predict next card has a lower rank' },
    { key: 'SHUFFLE', action: 'Reset the deck and start over' },
  ],
};

const sessionTutorialShown = new Set<string>();

function TutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    sessionTutorialShown.add('cards');
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

const CARD_SUITS = ['SYS', 'ORB', 'BIO', 'SEC'] as const;

interface ArcadeCard {
  suit: string;
  rank: number;
}

function createArcadeDeck() {
  const cards: ArcadeCard[] = [];
  CARD_SUITS.forEach((suit) => {
    for (let rank = 1; rank <= 12; rank += 1) {
      cards.push({ suit, rank });
    }
  });
  return shuffleArcadeDeck(cards);
}

function shuffleArcadeDeck(cards: ArcadeCard[]) {
  const next = [...cards];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function cardLabel(card: ArcadeCard) {
  const rank = card.rank === 1 ? 'A' : card.rank === 11 ? 'J' : card.rank === 12 ? 'Q' : String(card.rank);
  return `${card.suit}-${rank}`;
}

export default function VoidCards({ fullscreen }: VoidCardsProps) {
  const [showTutorial, setShowTutorial] = useState(() => !sessionTutorialShown.has('cards'));
  const initialDeck = useMemo(() => createArcadeDeck(), []);
  const [deck, setDeck] = useState<ArcadeCard[]>(initialDeck.slice(1));
  const [current, setCurrent] = useState<ArcadeCard>(initialDeck[0]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [status, setStatus] = useState('PREDICT NEXT');
  const [lastCard, setLastCard] = useState<ArcadeCard | null>(null);

  const reset = () => {
    const nextDeck = createArcadeDeck();
    setCurrent(nextDeck[0]);
    setDeck(nextDeck.slice(1));
    setScore(0);
    setStreak(0);
    setRound(1);
    setStatus('PREDICT NEXT');
    setLastCard(null);
    playSound('granted', 0.1);
  };

  const predict = (choice: 'hi' | 'lo' | 'eq') => {
    const source = deck.length ? deck : createArcadeDeck();
    const nextCard = source[0];
    const remaining = source.slice(1);
    const diff = nextCard.rank - current.rank;
    const correct = (choice === 'hi' && diff > 0) || (choice === 'lo' && diff < 0) || (choice === 'eq' && diff === 0);

    setLastCard(current);
    setCurrent(nextCard);
    setDeck(remaining.length ? remaining : createArcadeDeck());
    setRound((prev) => prev + 1);

    if (correct) {
      const nextStreak = streak + 1;
      const nextScore = score + 10 + nextStreak * 5;
      setStreak(nextStreak);
      setScore(nextScore);
      setStatus(`GOOD ${nextStreak}`);
      playSound('game', 0.1);
    } else {
      setStreak(0);
      const nextScore = Math.max(0, score - 8);
      setScore(nextScore);
      setStatus('BAD READ');
      playSound('error', 0.07);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${fullscreen ? 'w-full h-full p-[3vh]' : 'w-full h-full'}`}>
      {showTutorial && <TutorialOverlay onDismiss={() => setShowTutorial(false)} />}

      <div className="text-[1.6vh] tracking-[0.3em] font-display mb-[2vh] text-muthur-primary opacity-80">
        VOID CARDS
      </div>

      <div className={`grid ${fullscreen ? 'grid-cols-[1fr_0.5fr] gap-[3vh] max-w-[80vh] w-full' : 'grid-cols-[1fr_0.72fr] gap-[0.7vh] w-full'} flex-1 min-h-0`}>
        <div className="grid grid-rows-[1fr_auto] gap-[0.7vh] min-h-0">
          <div className="grid grid-cols-2 gap-[1vh] min-h-0">
            <div className={`border border-[rgba(0,255,65,0.18)] bg-[rgba(0,255,65,0.05)] flex flex-col items-center justify-center ${fullscreen ? 'min-h-[28vh]' : 'min-h-[18vh]'}`}>
              <div className="text-[0.8vh] text-muthur-secondary opacity-45 tracking-widest">CURRENT</div>
              <div className={`${fullscreen ? 'text-[5vh]' : 'text-[3.2vh]'} text-muthur-primary font-display tracking-widest`}>{cardLabel(current)}</div>
              <div className="text-[0.9vh] text-muthur-secondary opacity-50">RANK {current.rank}</div>
            </div>
            <div className={`border border-[rgba(0,255,65,0.1)] bg-[rgba(0,255,65,0.025)] flex flex-col items-center justify-center ${fullscreen ? 'min-h-[28vh]' : 'min-h-[18vh]'}`}>
              <div className="text-[0.8vh] text-muthur-secondary opacity-45 tracking-widest">PREVIOUS</div>
              <div className={`${fullscreen ? 'text-[3.5vh]' : 'text-[2.2vh]'} text-muthur-secondary opacity-70 font-display tracking-widest`}>{lastCard ? cardLabel(lastCard) : 'NONE'}</div>
              <div className="text-[0.9vh] text-muthur-secondary opacity-35">LOCAL DECK</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-[0.7vh]">
            <button onClick={() => predict('hi')} className={`${fullscreen ? 'h-[5vh]' : 'h-[3vh]'} border border-muthur-primary text-muthur-primary tracking-widest text-[1vh]`}>HIGHER [H]</button>
            <button onClick={() => predict('eq')} className={`${fullscreen ? 'h-[5vh]' : 'h-[3vh]'} border border-[rgba(0,255,65,0.28)] text-muthur-secondary tracking-widest text-[1vh]`}>EQUAL [E]</button>
            <button onClick={() => predict('lo')} className={`${fullscreen ? 'h-[5vh]' : 'h-[3vh]'} border border-muthur-accent text-muthur-accent tracking-widest text-[1vh]`}>LOWER [L]</button>
          </div>
        </div>
        <div className="border border-[rgba(0,255,65,0.12)] p-[1.2vh] min-w-0 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-[0.6vh]">
            <Metric label="STATE" value={status} />
            <Metric label="ROUND" value={String(round)} />
            <Metric label="SCORE" value={String(score)} />
            <Metric label="STREAK" value={String(streak)} />
          </div>
          <div className="h-[0.7vh] bg-[rgba(0,255,65,0.08)] overflow-hidden my-[1vh]">
            <div className="h-full bg-muthur-primary transition-all" style={{ width: `${Math.max(3, (deck.length / 47) * 100)}%` }} />
          </div>
          <Metric label="DECK" value={`${deck.length} CARDS`} />
          <button onClick={reset} className="h-[4vh] border border-muthur-primary text-muthur-primary tracking-widest text-[1.1vh] mt-[0.8vh]">
            SHUFFLE [CLICK]
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
