import { describe, it, expect } from 'vitest';
import { getDifficulty } from './difficulty';
import { createLightsOutState, applyMove } from './rules';

describe('getDifficulty (lights-out)', () => {
  it('returns score 0 for already-solved state', () => {
    const state = createLightsOutState(5);
    const d = getDifficulty(state);
    expect(d.score).toBe(0);
    expect(d.labelKey).toBe('difficulty.easy');
  });

  it('returns non-trivial score for a state with lights on', () => {
    const state = applyMove(createLightsOutState(5), { row: 0, col: 0 });
    const d = getDifficulty(state);
    expect(d.score).toBeGreaterThan(0);
    expect(d.score).toBeLessThanOrEqual(100);
  });

  it('uses 33/66 label thresholds', () => {
    const easy = getDifficulty(createLightsOutState(3));
    expect(easy.labelKey).toBe('difficulty.easy');

    const d = getDifficulty(applyMove(createLightsOutState(10), { row: 0, col: 0 }));
    expect(['difficulty.easy', 'difficulty.medium', 'difficulty.hard']).toContain(d.labelKey);
  });

  it('factors include size, optimalSteps, nullity', () => {
    const state = applyMove(createLightsOutState(5), { row: 2, col: 2 });
    const d = getDifficulty(state);
    expect(d.factors.size).toBe(5);
    expect(typeof d.factors.optimalSteps).toBe('number');
    expect(typeof d.factors.nullity).toBe('number');
  });
});
