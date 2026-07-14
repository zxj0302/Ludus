import { describe, expect, it } from 'vitest';
import { CENTER_HOLE } from './geometry';
import { createClassicState } from './rules';
import { getDifficulty } from './difficulty';
import type { PegSolitaireState } from './types';

function bit(hole: number): number {
  return 2 ** hole;
}

describe('Peg Solitaire difficulty', () => {
  it('returns finite normalized scores for classic and small states', () => {
    const states: PegSolitaireState[] = [
      createClassicState('one-center'),
      { pegs: bit(4) + bit(14) + bit(15) + bit(23), goal: 'one-center', status: 'playing' },
      { pegs: bit(CENTER_HOLE), goal: 'one-center', status: 'won' },
    ];

    for (const state of states) {
      const difficulty = getDifficulty(state, 3);
      expect(Number.isFinite(difficulty.score)).toBe(true);
      expect(difficulty.score).toBeGreaterThanOrEqual(0);
      expect(difficulty.score).toBeLessThanOrEqual(100);
      expect(difficulty.labelKey).toMatch(/^difficulty\./);
    }
  });

  it('rates one-center higher than one-any on the same board', () => {
    const pegs = bit(4) + bit(14) + bit(15) + bit(23);
    expect(getDifficulty({ pegs, goal: 'one-center', status: 'playing' }, 3).score).toBeGreaterThan(
      getDifficulty({ pegs, goal: 'one-any', status: 'playing' }, 3).score,
    );
  });

  it('scores classic one-center as hard', () => {
    const difficulty = getDifficulty(createClassicState('one-center'), 31);
    expect(difficulty.score).toBeGreaterThan(66);
    expect(difficulty.labelKey).toBe('difficulty.hard');
  });
});
