import { CENTER_HOLE } from './geometry';
import { legalMoves, meetsGoal, popcount } from './rules';
import type { PegGoal, PegSolitaireState } from './types';

export interface PegPuzzle {
  id: string;
  title: string;
  state: PegSolitaireState;
  knownSolutionLength: number | null;
}

function bit(hole: number): number {
  return 2 ** hole;
}

function state(pegs: number, goal: PegGoal): PegSolitaireState {
  const draft: PegSolitaireState = { pegs, goal, status: 'playing' };
  if (meetsGoal(pegs, goal)) return { ...draft, status: 'won' };
  if (legalMoves(draft).length === 0) return { ...draft, status: 'stuck' };
  return draft;
}

const CLASSIC_PEGS = 2 ** 33 - 1 - bit(CENTER_HOLE);

/**
 * Classic English-board start: 32 pegs, center empty.
 * Goal: traditionally one-center; known optimal length is 31 jumps.
 */
export const CLASSIC_CENTER_EMPTY: PegPuzzle = {
  id: 'classic-center-empty',
  title: 'Classic center empty',
  state: state(CLASSIC_PEGS, 'one-center'),
  knownSolutionLength: 31,
};

export const CURATED_PEG_PUZZLES: readonly PegPuzzle[] = [
  /**
   * One-jump row-top micro puzzle.
   * Goal: one-any; known length 1 (0 jumps over 1 into 2, or mirrored).
   */
  {
    id: 'row-top-one-jump',
    title: 'Row top one jump',
    state: state(bit(0) + bit(1), 'one-any'),
    knownSolutionLength: 1,
  },
  /**
   * One-jump easy target for the relaxed le3 goal.
   * Goal: le3; known length 1, useful for fast generator fallback.
   */
  {
    id: 'center-entry-le3',
    title: 'Center entry le3',
    state: state(bit(4) + bit(9) + bit(14) + bit(15), 'le3'),
    knownSolutionLength: 1,
  },
  /**
   * Three-jump center finish used by solver tests.
   * Goal: one-center; known length 3.
   */
  {
    id: 'three-jump-center-finish',
    title: 'Three jump center finish',
    state: state(bit(4) + bit(14) + bit(15) + bit(23), 'one-center'),
    knownSolutionLength: 3,
  },
  /**
   * Four-peg middle-band puzzle that can end at any single peg.
   * Goal: one-any; known length 3.
   */
  {
    id: 'middle-band-one-any',
    title: 'Middle band one any',
    state: state(bit(3) + bit(4) + bit(14) + bit(15), 'one-any'),
    knownSolutionLength: 3,
  },
];

export function puzzlesForGoal(goal: PegGoal): PegPuzzle[] {
  return CURATED_PEG_PUZZLES
    .filter(puzzle => puzzle.state.goal === goal)
    .sort((a, b) => popcount(a.state.pegs) - popcount(b.state.pegs));
}
