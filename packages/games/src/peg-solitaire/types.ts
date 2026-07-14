import type { GameState, Move } from '@ludus/core';

/** Play goals only (spec v1.1). `le3` is teaching history, not a playable goal. */
export type PegGoal = 'one-any' | 'one-center';

export type PegCatalogTier = 'easy' | 'medium' | 'hard';

export interface PegSolitaireState extends GameState {
  /** bit i = 1 means fixed English-board hole i contains a peg. */
  pegs: number;
  goal: PegGoal;
  status: 'playing' | 'won' | 'stuck';
  /** Catalog entry id when dealt from the classic set (optional). */
  catalogId?: string;
}

export interface PegSolitaireMove extends Move {
  from: number;
  over: number;
  to: number;
}
