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
      createClassicState('le3'),
      { pegs: bit(4) + bit(14) + bit(15) + bit(23), goal: 'one-center', status: 'playing' },
      { pegs: bit(CENTER_HOLE), goal: 'one-center', status: 'won' },
    ];

    for (const state of states) {
      const difficulty = getDifficulty(state);

      expect(Number.isFinite(difficulty.score)).toBe(true);
      expect(difficulty.score).toBeGreaterThanOrEqual(0);
      expect(difficulty.score).toBeLessThanOrEqual(100);
      expect(difficulty.labelKey).toMatch(/^difficulty\./);
      expect(Number.isFinite(difficulty.factors.pegCount)).toBe(true);
      expect(Number.isFinite(difficulty.factors.legalMoves)).toBe(true);
    }
  });

  it('rates stricter goals higher for the same board', () => {
    const pegs = bit(4) + bit(14) + bit(15) + bit(23);

    expect(getDifficulty({ pegs, goal: 'one-center', status: 'playing' }).score).toBeGreaterThan(
      getDifficulty({ pegs, goal: 'le3', status: 'playing' }).score,
    );
  });
});
