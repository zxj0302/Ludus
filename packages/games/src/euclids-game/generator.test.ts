import { describe, expect, it } from 'vitest';
import { computeEuclidsDifficulty } from './difficulty';
import { generateEuclidsGameLevel } from './generator';
import { isOwnState } from './rules';
import { isPPosition } from './solver';
import type { EuclidsGameState } from './types';

describe('computeEuclidsDifficulty', () => {
  it('scores larger piles higher', () => {
    const easy = computeEuclidsDifficulty([4, 3], true);
    const hard = computeEuclidsDifficulty([18, 11], false);
    expect(hard.score).toBeGreaterThan(easy.score);
  });
});

describe('generateEuclidsGameLevel', () => {
  it('produces valid choosing state with ordered piles', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const level = generateEuclidsGameLevel({ seed, difficultyRange: [1, 100] });
      const state = level.initialState as unknown as EuclidsGameState;
      expect(isOwnState(state)).toBe(true);
      expect(state.phase).toBe('choosing');
      expect(state.piles[0]).toBeGreaterThanOrEqual(state.piles[1]);
      expect(state.piles[1]).toBeGreaterThanOrEqual(1);
    }
  });

  it('is reproducible for the same seed', () => {
    const a = generateEuclidsGameLevel({ seed: 99, difficultyRange: [34, 66] });
    const b = generateEuclidsGameLevel({ seed: 99, difficultyRange: [34, 66] });
    expect(a.initialState).toEqual(b.initialState);
  });

  it('biases hard range toward P-positions', () => {
    let pCount = 0;
    for (let seed = 1; seed <= 40; seed += 1) {
      const level = generateEuclidsGameLevel({ seed, difficultyRange: [67, 100] });
      const state = level.initialState as unknown as EuclidsGameState;
      if (isPPosition(state.piles)) pCount += 1;
      expect(state.piles[0]).toBeGreaterThan(state.piles[1]);
    }
    expect(pCount).toBeGreaterThan(20);
  });
});
