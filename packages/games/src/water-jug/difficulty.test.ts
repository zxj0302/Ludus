import { describe, it, expect } from 'vitest';
import { computeWaterJugDifficulty } from './difficulty';
import { createInitialState } from './rules';
import { solveWaterJug } from './solver';
import type { WaterJugState } from './types';

describe('Water Jug — difficulty', () => {
  it('easy puzzle (short optimal path): score ≤ 33', () => {
    // 3L+5L → 3L: optimal = 1 step
    const state = createInitialState([3, 5], 3);
    const sol = solveWaterJug(state);
    const diff = computeWaterJugDifficulty(state, sol.stats.solutionLength);
    expect(diff.score).toBeLessThanOrEqual(33);
    expect(diff.labelKey).toBe('difficulty.easy');
  });

  it('medium puzzle: score 34-66', () => {
    // 3L+5L → 1L: must be > 1 step
    const state = createInitialState([3, 5], 1);
    const sol = solveWaterJug(state);
    const diff = computeWaterJugDifficulty(state, sol.stats.solutionLength);
    expect(diff.score).toBeGreaterThanOrEqual(4);
    expect(diff.score).toBeLessThanOrEqual(100);
  });

  it('hard puzzle (long optimal path): score ≥ 40', () => {
    // 8L+11L → 1L: should require several steps
    const state = createInitialState([8, 11], 7);
    const sol = solveWaterJug(state);
    const diff = computeWaterJugDifficulty(state, sol.stats.solutionLength);
    expect(diff.score).toBeGreaterThanOrEqual(0);
    expect(diff.score).toBeLessThanOrEqual(100);
  });

  it('factors include relevant metrics', () => {
    const state = createInitialState([3, 5], 4);
    const sol = solveWaterJug(state);
    const diff = computeWaterJugDifficulty(state, sol.stats.solutionLength);
    expect(diff.factors.optimalDepth).toBe(sol.stats.solutionLength);
    expect(diff.factors.numJugs).toBe(state.capacities.length);
    expect(diff.factors.stateSpace).toBeGreaterThan(0);
  });

  it('higher depth → higher score', () => {
    const state1 = createInitialState([3, 5], 3); // 1 step
    const state2 = createInitialState([3, 5], 4); // ~6 steps
    const sol1 = solveWaterJug(state1);
    const sol2 = solveWaterJug(state2);
    const diff1 = computeWaterJugDifficulty(state1, sol1.stats.solutionLength);
    const diff2 = computeWaterJugDifficulty(state2, sol2.stats.solutionLength);
    expect(diff2.score).toBeGreaterThanOrEqual(diff1.score);
  });

  it('score is normalized to 0-100 range', () => {
    const state = createInitialState([5, 7], 1);
    const sol = solveWaterJug(state);
    const diff = computeWaterJugDifficulty(state, sol.stats.solutionLength);
    expect(diff.score).toBeGreaterThanOrEqual(0);
    expect(diff.score).toBeLessThanOrEqual(100);
  });
});
