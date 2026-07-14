import type { GameState, Move } from '@ludus/core';

export type PegGoal = 'le3' | 'one-any' | 'one-center';

export interface PegSolitaireState extends GameState {
  /** bit i = 1 means fixed English-board hole i contains a peg. */
  pegs: number;
  goal: PegGoal;
  status: 'playing' | 'won' | 'stuck';
}

export interface PegSolitaireMove extends Move {
  from: number;
  over: number;
  to: number;
}
