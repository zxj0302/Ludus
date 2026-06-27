import type { GameState, Move } from '@ludus/core';

export interface NimState extends GameState {
  piles: number[];
  currentPlayer: 0 | 1;
  initialPiles: number[];
  phase: 'choosing' | 'playing';
}

export interface NimMove extends Move {
  pileIndex: number;
  removeCount: number;
}
