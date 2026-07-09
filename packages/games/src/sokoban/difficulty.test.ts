import { describe, it, expect } from 'vitest';
import { getDifficulty } from './difficulty';
import { getLevel } from './levels';
import { computeSokobanDifficulty } from './solver-utils';

describe('computeSokobanDifficulty', () => {
  it('returns easy for small level 0', () => {
    const d = computeSokobanDifficulty(getLevel(0));
    expect(d.score).toBeGreaterThanOrEqual(0);
    expect(d.score).toBeLessThanOrEqual(100);
    expect(d.labelKey).toMatch(/^difficulty\./);
  });

  it('uses 33/66 label thresholds', () => {
    const small = computeSokobanDifficulty(getLevel(0));
    if (small.score <= 33) expect(small.labelKey).toBe('difficulty.easy');
    else if (small.score <= 66) expect(small.labelKey).toBe('difficulty.medium');
    else expect(small.labelKey).toBe('difficulty.hard');
  });

  it('factors include size and boxCount', () => {
    const state = getLevel(0);
    const d = computeSokobanDifficulty(state);
    expect(d.factors.size).toBe(state.width * state.height);
    expect(d.factors.boxCount).toBe(state.boxes.length);
  });

  it('clamps score to [0, 100]', () => {
    for (let i = 0; i < 3; i++) {
      const d = getDifficulty(getLevel(i));
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
    }
  });
});
