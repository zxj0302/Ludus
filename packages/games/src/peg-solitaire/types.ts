export type PegGoal = 'le3' | 'one-any' | 'one-center';

export interface PegSolitaireState {
  /** bit i = 1 means fixed English-board hole i contains a peg. */
  pegs: number;
  goal: PegGoal;
  status: 'playing' | 'won' | 'stuck';
}

export type PegSolitaireMove = { from: number; over: number; to: number };
