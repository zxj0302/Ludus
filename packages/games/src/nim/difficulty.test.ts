import { describe, it, expect } from 'vitest';
import { computeNimDifficulty } from './difficulty';

describe('computeNimDifficulty', () => {
  it('returns easy for 2 piles, small stones', () => {
    const d = computeNimDifficulty(2, 3);
    expect(d.score).toBe(0);
    expect(d.labelKey).toBe('difficulty.easy');
  });

  it('returns hard for 6 piles, large stones', () => {
    const d = computeNimDifficulty(6, 10);
    expect(d.score).toBe(100);
    expect(d.labelKey).toBe('difficulty.hard');
  });

  it('returns medium for mid-range', () => {
    const d = computeNimDifficulty(3, 7);
    expect(d.score).toBeGreaterThan(20);
    expect(d.score).toBeLessThan(80);
  });

  it('clamps score to [0, 100]', () => {
    expect(computeNimDifficulty(1, 1).score).toBe(0);
    expect(computeNimDifficulty(10, 20).score).toBe(100);
  });

  it('factors contain pileCount and maxStones', () => {
    const d = computeNimDifficulty(3, 8);
    expect(d.factors.pileCount).toBe(3);
    expect(d.factors.maxStones).toBe(8);
  });
});
