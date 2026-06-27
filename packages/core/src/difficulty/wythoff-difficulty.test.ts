import { describe, it, expect } from 'vitest';
import { computeWythoffDifficulty } from './wythoff-difficulty';

describe('computeWythoffDifficulty', () => {
  it('returns easy for maxStone=1', () => {
    const d = computeWythoffDifficulty(1);
    expect(d.score).toBe(10);
    expect(d.labelKey).toBe('difficulty.easy');
  });

  it('returns hard for maxStone=10', () => {
    const d = computeWythoffDifficulty(10);
    expect(d.score).toBe(100);
    expect(d.labelKey).toBe('difficulty.hard');
  });

  it('returns medium for intermediate values', () => {
    const d = computeWythoffDifficulty(5);
    expect(d.score).toBe(50);
    expect(d.labelKey).toBe('difficulty.medium');
  });

  it('clamps score to 0-100', () => {
    expect(computeWythoffDifficulty(-5).score).toBe(0);
    expect(computeWythoffDifficulty(100).score).toBe(100);
  });

  it('difficulty increases with maxStone', () => {
    const d1 = computeWythoffDifficulty(2);
    const d2 = computeWythoffDifficulty(8);
    expect(d2.score).toBeGreaterThan(d1.score);
  });

  it('factors contain maxStone', () => {
    const d = computeWythoffDifficulty(7);
    expect(d.factors.maxStone).toBe(7);
  });
});
