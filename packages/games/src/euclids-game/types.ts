import type { GameState, Move } from '@ludus/core';

/** Sorted piles: [larger, smaller], smaller > 0 while playing */
export type EuclidPiles = [number, number];

export interface EuclidsGameState extends GameState {
  piles: EuclidPiles;
  currentPlayer: 0 | 1;
  phase: 'choosing' | 'playing';
  /** Snapshot at hand selection for reset/difficulty */
  initialPiles?: EuclidPiles;
}

/** Subtract `multiple` × smaller pile from larger pile */
export interface EuclidsGameMove extends Move {
  multiple: number;
}
