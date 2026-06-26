import type { GameState, Move } from './plugin';

export interface NimState extends GameState {
  piles: number[];
  currentPlayer: 0 | 1;
  initialPiles: number[];
}

export interface NimMove extends Move {
  pileIndex: number;
  removeCount: number;
}
