import type { GameState, Move } from './plugin';

export interface WythoffState extends GameState {
  piles: [number, number];
  currentPlayer: 0 | 1;
  initialPiles: [number, number];
  phase: 'choosing' | 'playing';
}

export interface WythoffMove extends Move {
  type: 'single' | 'both';
  /** Which pile for 'single' move (0 or 1). Undefined for 'both'. */
  pileIndex?: number;
  removeCount: number;
}
