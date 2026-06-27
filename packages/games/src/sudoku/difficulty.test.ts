import { describe, it, expect } from 'vitest';
import { computeSudokuDifficulty } from './difficulty';

describe('computeSudokuDifficulty', () => {
  it('17 clues = score 100 (hardest)', () => {
    expect(computeSudokuDifficulty(17).score).toBe(100);
    expect(computeSudokuDifficulty(17).labelKey).toBe('difficulty.hard');
  });

  it('36 clues = score 0 (easiest)', () => {
    expect(computeSudokuDifficulty(36).score).toBe(0);
    expect(computeSudokuDifficulty(36).labelKey).toBe('difficulty.easy');
  });

  it('clamps values below 17', () => {
    expect(computeSudokuDifficulty(10).score).toBe(100);
  });

  it('clamps values above 36', () => {
    expect(computeSudokuDifficulty(50).score).toBe(0);
  });
});
