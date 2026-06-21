export { default as SignalLock } from './SignalLock';
export { default as SectorTactics } from './SectorTactics';
export { default as VoidCards } from './VoidCards';

export type GameId = 'signal-lock' | 'sector-tactics' | 'void-cards';

export interface GameDefinition {
  id: GameId;
  name: string;
  filename: string;
  description: string;
}

export const GAME_REGISTRY: GameDefinition[] = [
  { id: 'signal-lock', name: 'SIGNAL LOCK', filename: 'signal-lock.game', description: 'Hit the sweep exactly on the target' },
  { id: 'sector-tactics', name: 'SECTOR TACTICS', filename: 'sector-tactics.game', description: 'Chess-like board duel against station logic' },
  { id: 'void-cards', name: 'VOID CARDS', filename: 'void-cards.game', description: 'Offline card run with streak scoring' },
];

export const VIRTUAL_GAMES_PATH = '/usr/share/muthur/games';
