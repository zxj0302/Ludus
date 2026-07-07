import { describe, it, expect } from 'vitest';
import { computeFifteenDifficulty } from './difficulty';

describe('Fifteen difficulty', () => {
  it('score 0 for depth 0', () => {
    const d = computeFifteenDifficulty(0);
    expect(d.score).toBe(0);
    expect(d.labelKey).toBe('difficulty.easy');
  });

  it('score 13 for depth 10', () => {
    const d = computeFifteenDifficulty(10);
    expect(d.score).toBe(13);
  });

  it('score 50 for depth 40', () => {
    const d = computeFifteenDifficulty(40);
    expect(d.score).toBe(50);
  });

  it('score 100 for depth 80', () => {
    const d = computeFifteenDifficulty(80);
    expect(d.score).toBe(100);
  });

  it('caps at 100 for depth > 80', () => {
    const d = computeFifteenDifficulty(100);
    expect(d.score).toBe(100);
    expect(d.labelKey).toBe('difficulty.hard');
  });

  it('factors contains scrambleDepth', () => {
    const d = computeFifteenDifficulty(25);
    expect(d.factors.scrambleDepth).toBe(25);
  });
});
