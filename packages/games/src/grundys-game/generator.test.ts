import { describe, expect, it } from 'vitest';
import { computeGrundysDifficulty } from './difficulty';
import { generateGrundysGameLevel } from './generator';
import { isOwnState } from './rules';
import { computeGrundyXor, isPPosition } from './solver';
import type { GrundysGameState } from './types';

describe('computeGrundysDifficulty', () => {
  it('scores larger multi-heap layouts higher', () => {
    const easy = computeGrundysDifficulty([3, 4], true);
    const hard = computeGrundysDifficulty([12, 15, 18, 20], false);
    expect(hard.score).toBeGreaterThan(easy.score);
  });
});

describe('generateGrundysGameLevel', () => {
  it('produces valid choosing state with splittable heaps', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const level = generateGrundysGameLevel({ seed, difficultyRange: [1, 100] });
      const state = level.initialState as unknown as GrundysGameState;
      expect(isOwnState(state)).toBe(true);
      expect(state.phase).toBe('choosing');
      expect(state.piles.length).toBeGreaterThanOrEqual(2);
      expect(state.piles.some(n => n >= 3)).toBe(true);
      expect(Math.max(...state.piles)).toBeLessThanOrEqual(24);
      expect(level.gameId).toBe('grundys-game');
    }
  });

  it('is reproducible for the same seed', () => {
    const a = generateGrundysGameLevel({ seed: 42, difficultyRange: [34, 66] });
    const b = generateGrundysGameLevel({ seed: 42, difficultyRange: [34, 66] });
    expect(a.initialState).toEqual(b.initialState);
    expect(a.levelId).toBe(b.levelId);
  });

  it('biases hard range toward P-positions', () => {
    let pCount = 0;
    for (let seed = 1; seed <= 40; seed += 1) {
      const level = generateGrundysGameLevel({ seed, difficultyRange: [67, 100] });
      const state = level.initialState as unknown as GrundysGameState;
      if (isPPosition(state.piles) && computeGrundyXor(state.piles) === 0) pCount += 1;
      expect(state.piles.every(n => n <= 2)).toBe(false);
    }
    expect(pCount).toBeGreaterThan(18);
  });

  it('biases easy range toward N-positions', () => {
    let nCount = 0;
    for (let seed = 1; seed <= 40; seed += 1) {
      const level = generateGrundysGameLevel({ seed, difficultyRange: [1, 33] });
      const state = level.initialState as unknown as GrundysGameState;
      if (computeGrundyXor(state.piles) !== 0) nCount += 1;
    }
    expect(nCount).toBeGreaterThan(18);
  });
});
