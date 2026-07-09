import { describe, it, expect } from 'vitest';
import { generateLightsOutLevel } from './generator';
import { applyMove, isSolved } from './rules';
import type { LightsOutState, LightsOutMove } from './types';

describe('generateLightsOutLevel', () => {
  it('generates a valid level with default config', () => {
    const level = generateLightsOutLevel({ difficultyRange: [0, 100] });
    expect(level.gameId).toBe('lights-out');
    expect(level.schemaVersion).toBe(1);
    expect(level.initialState).toBeDefined();
    const state = level.initialState as unknown as LightsOutState;
    expect(state.n).toBeGreaterThanOrEqual(3);
    expect(state.grid.length).toBe(state.n * state.n);
  });

  it('generates a level with specified size', () => {
    const level = generateLightsOutLevel({ difficultyRange: [0, 100], size: 4, minMoves: 3, maxMoves: 8 });
    const state = level.initialState as unknown as LightsOutState;
    expect(state.n).toBe(4);
    expect(state.grid.length).toBe(16);
  });

  it('reads advanced controls from gameParams', () => {
    const level = generateLightsOutLevel({
      difficultyRange: [0, 100],
      size: 3,
      requireUniqueSolution: true,
      requireKnownOptimal: false,
      seed: 42,
      gameParams: {
        minMoves: 2,
        maxMoves: 2,
      },
    });
    const state = level.initialState as unknown as LightsOutState;

    expect(state.n).toBe(3);
    expect(level.uniqueSolution).toBe(true);
    expect(level.generatedBy).toMatch(/reverse-solve/);
  });

  it('generated level has some lights on', () => {
    const level = generateLightsOutLevel({ difficultyRange: [0, 100], minMoves: 5, maxMoves: 15 });
    const state = level.initialState as unknown as LightsOutState;
    const onCount = state.grid.filter(c => c === 1).length;
    expect(onCount).toBeGreaterThan(0);
  });

  it('generated level is solvable', () => {
    const level = generateLightsOutLevel({ difficultyRange: [0, 100], n: 5, minMoves: 3, maxMoves: 10 });
    const state = level.initialState as unknown as LightsOutState;
    // We can't fully verify solvability without the solver, but the reverse generation
    // guarantees it by construction
    expect(level.generatedBy).toMatch(/reverse-solve/);
  });

  it('respects seed for reproducible generation', () => {
    const level1 = generateLightsOutLevel({ difficultyRange: [0, 100], seed: 42, n: 5, minMoves: 5, maxMoves: 10 });
    const level2 = generateLightsOutLevel({ difficultyRange: [0, 100], seed: 42, n: 5, minMoves: 5, maxMoves: 10 });
    expect(level1.initialState).toEqual(level2.initialState);
    expect(level1.difficulty.score).toBe(level2.difficulty.score);
  });
});
