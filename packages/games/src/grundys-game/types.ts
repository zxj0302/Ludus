import type { GameState, Move } from '@ludus/core';

export interface GrundysGameState extends GameState {
  piles: number[];
  currentPlayer: 0 | 1;
  initialPiles: number[];
  phase: 'choosing' | 'playing';
}

/** Split pile `pileIndex` of size n into `left` and `right` (unequal, both ≥ 1). */
export interface GrundysGameMove extends Move {
  pileIndex: number;
  /** Smaller part of the split; must satisfy 1 ≤ left ≤ ⌊(n−1)/2⌋ */
  left: number;
  /** Larger part (= n − left); stored for UI / education */
  right: number;
}
