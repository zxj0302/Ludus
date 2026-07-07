import { describe, it, expect } from 'vitest';
import { generateFifteenLevel } from './generator';
import { isSolved } from './rules';
import { solveFifteen } from './solver';
import type { FifteenState } from './types';

describe('Fifteen generator', () => {
  it('generates a non-solved state', () => {
    const level = generateFifteenLevel({ difficultyRange: [20, 80] });
    const state = level.initialState as unknown as FifteenState;
    expect(isSolved(state)).toBe(false);
  });

  it('generated state is solvable', () => {
    const level = generateFifteenLevel({ difficultyRange: [10, 50] });
    const state = level.initialState as unknown as FifteenState;
    const sol = solveFifteen(state);
    expect(sol.solvable).toBe(true);
    expect(sol.moves.length).toBeGreaterThan(0);
  });

  it('respects gameParams.scrambleDepth', () => {
    const level = generateFifteenLevel({
      difficultyRange: [10, 50],
      gameParams: { scrambleDepth: 15 },
    });
    const state = level.initialState as unknown as FifteenState;
    const sol = solveFifteen(state);
    // Solution length should be <= scramble depth
    expect(sol.stats.solutionLength).toBeLessThanOrEqual(15);
  });

  it('generates different states on successive calls', () => {
    const level1 = generateFifteenLevel({ difficultyRange: [20, 80] });
    const level2 = generateFifteenLevel({ difficultyRange: [20, 80] });
    const grid1 = (level1.initialState as unknown as FifteenState).grid;
    const grid2 = (level2.initialState as unknown as FifteenState).grid;
    const same = grid1.every((v, i) => v === grid2[i]);
    expect(same).toBe(false);
  });

  it('easy difficulty produces low scramble depth', () => {
    const level = generateFifteenLevel({ difficultyRange: [0, 20] });
    const state = level.initialState as unknown as FifteenState;
    const sol = solveFifteen(state);
    // Easy should be <= 20 moves from solved
    expect(sol.stats.solutionLength).toBeLessThanOrEqual(20);
  });

  it('difficulty label is set', () => {
    const level = generateFifteenLevel({ difficultyRange: [20, 50] });
    expect(level.difficulty.labelKey).toBeDefined();
    expect(level.difficulty.score).toBeGreaterThanOrEqual(0);
    expect(level.difficulty.score).toBeLessThanOrEqual(100);
  });
});
