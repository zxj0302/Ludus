import { describe, it, expect } from 'vitest';
import { computeNonogramDifficulty } from './difficulty';

describe('Nonogram — difficulty', () => {
  it('5×5 fully line-solvable: score ≤ 33 (easy)', () => {
    const diff = computeNonogramDifficulty(5, 5, 25, 25, 0, 10);
    expect(diff.score).toBeLessThanOrEqual(33);
    expect(diff.labelKey).toBe('difficulty.easy');
  });

  it('12×12 medium complexity: score 34-66 (medium)', () => {
    const diff = computeNonogramDifficulty(12, 12, 40, 144, 10, 24);
    expect(diff.labelKey).toBe('difficulty.medium');
    expect(diff.score).toBeGreaterThanOrEqual(34);
    expect(diff.score).toBeLessThanOrEqual(66);
  });

  it('20×20 high backtracking: score ≥ 67 (hard)', () => {
    const diff = computeNonogramDifficulty(20, 20, 40, 400, 18, 40);
    expect(diff.score).toBeGreaterThanOrEqual(67);
    expect(diff.labelKey).toBe('difficulty.hard');
  });

  it('score is within 0-100 range', () => {
    const diff = computeNonogramDifficulty(10, 10, 50, 100, 10, 30);
    expect(diff.score).toBeGreaterThanOrEqual(0);
    expect(diff.score).toBeLessThanOrEqual(100);
  });

  it('factors include all dimensional scores', () => {
    const diff = computeNonogramDifficulty(8, 8, 30, 64, 3, 16);
    expect(diff.factors.width).toBe(8);
    expect(diff.factors.height).toBe(8);
    expect(diff.factors.totalCells).toBe(64);
    expect(diff.factors.lineSolveCells).toBe(30);
    expect(diff.factors.maxBacktrackDepth).toBe(3);
    expect(diff.factors.totalClues).toBe(16);
    expect(diff.factors.sizeScore).toBeGreaterThanOrEqual(0);
    expect(diff.factors.lineSolveScore).toBeGreaterThanOrEqual(0);
    expect(diff.factors.depthScore).toBeGreaterThanOrEqual(0);
    expect(diff.factors.clueScore).toBeGreaterThanOrEqual(0);
  });

  it('larger grid → higher size score', () => {
    const small = computeNonogramDifficulty(5, 5, 25, 25, 0, 10);
    const large = computeNonogramDifficulty(15, 15, 100, 225, 5, 30);
    expect(large.factors.sizeScore!).toBeGreaterThan(small.factors.sizeScore!);
  });

  it('more line solving → lower line-solve score', () => {
    const easy = computeNonogramDifficulty(10, 10, 95, 100, 0, 20);
    const hard = computeNonogramDifficulty(10, 10, 10, 100, 5, 20);
    expect(hard.factors.lineSolveScore!).toBeGreaterThan(easy.factors.lineSolveScore!);
  });
});
