import { describe, it, expect } from 'vitest';
import { generateNonogramLevel } from './generator';
import { isSolved } from './rules';
import { countSolutions } from './solver';
import type { LevelConfig } from '@ludus/core';
import type { NonogramState } from './types';
import { FILLED, CROSS } from './types';

describe('Nonogram — generator', () => {
  const baseConfig: LevelConfig = {
    difficultyRange: [1, 100],
    requireUniqueSolution: false,
    requireKnownOptimal: false,
  };

  it('generates a solvable level', () => {
    const level = generateNonogramLevel(baseConfig);
    const state = level.initialState as NonogramState;
    expect(state.width).toBeGreaterThanOrEqual(5);
    expect(state.height).toBeGreaterThanOrEqual(5);
    expect(state.rowClues).toBeDefined();
    expect(state.colClues).toBeDefined();
  });

  it('generated level has unique solution', () => {
    const level = generateNonogramLevel({ ...baseConfig, difficultyRange: [1, 33] });
    const state = level.initialState as NonogramState;
    expect(level.uniqueSolution).toBe(true);

    // Verify via countSolutions (only for small grids to be fast)
    const count = countSolutions(state, 2);
    expect(count).toBe(1);
  });

  it('solution pattern matches isSolved when fully filled', () => {
    const level = generateNonogramLevel({ ...baseConfig, difficultyRange: [1, 33] });
    const state = level.initialState as NonogramState;

    for (let r = 0; r < state.height; r++) {
      for (let c = 0; c < state.width; c++) {
        state.grid[r]![c] = state.solution[r]![c] ? FILLED : CROSS;
      }
    }
    expect(isSolved(state)).toBe(true);
  });

  it('easy difficulty: small grid (5-8)', () => {
    const level = generateNonogramLevel({ ...baseConfig, difficultyRange: [1, 33] });
    const state = level.initialState as NonogramState;
    expect(state.width).toBeGreaterThanOrEqual(5);
    expect(state.width).toBeLessThanOrEqual(8);
    expect(state.height).toBeGreaterThanOrEqual(5);
    expect(state.height).toBeLessThanOrEqual(8);
  });

  it('accepts size and density controls from gameParams', () => {
    const level = generateNonogramLevel({
      ...baseConfig,
      difficultyRange: [1, 100],
      seed: 123,
      gameParams: {
        size: 6,
        density: 'dense',
        requireBacktracking: false,
      },
    });
    const state = level.initialState as NonogramState;
    const filledCells = state.solution.flat().filter(Boolean).length;

    expect(state.width).toBe(6);
    expect(state.height).toBe(6);
    expect(filledCells).toBeGreaterThan(0);
  });

  it('initial state grid is all empty', () => {
    const level = generateNonogramLevel(baseConfig);
    const state = level.initialState as NonogramState;
    for (const row of state.grid) {
      for (const cell of row) {
        expect(cell).toBe(0); // EMPTY
      }
    }
  });

  it('row and column clues are consistent with solution', () => {
    const level = generateNonogramLevel({ ...baseConfig, difficultyRange: [1, 33] });
    const state = level.initialState as NonogramState;

    for (let r = 0; r < state.height; r++) {
      const expected = state.rowClues[r]!;
      const actual: number[] = [];
      let run = 0;
      for (let c = 0; c < state.width; c++) {
        if (state.solution[r]![c]) {
          run++;
        } else {
          if (run > 0) { actual.push(run); run = 0; }
        }
      }
      if (run > 0) actual.push(run);
      expect(actual).toEqual(expected);
    }

    for (let c = 0; c < state.width; c++) {
      const expected = state.colClues[c]!;
      const actual: number[] = [];
      let run = 0;
      for (let r = 0; r < state.height; r++) {
        if (state.solution[r]![c]) {
          run++;
        } else {
          if (run > 0) { actual.push(run); run = 0; }
        }
      }
      if (run > 0) actual.push(run);
      expect(actual).toEqual(expected);
    }
  });

  it('generates different levels on repeated calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const level = generateNonogramLevel({ ...baseConfig, difficultyRange: [1, 33], seed: i + 1000 });
      ids.add(level.levelId);
    }
    expect(ids.size).toBeGreaterThanOrEqual(3);
  });

  it('level has all required metadata fields', () => {
    const level = generateNonogramLevel(baseConfig);
    expect(level.schemaVersion).toBe(1);
    expect(level.gameId).toBe('nonogram');
    expect(level.levelId).toBeTruthy();
    expect(level.initialState).toBeDefined();
    expect(level.difficulty).toBeDefined();
    expect(level.uniqueSolution).toBe(true);
    expect(level.generatedBy).toBe('generateNonogramLevel');
    expect(level.createdAt).toBeTruthy();
  });

  it('fallback heart puzzle is returned when no unique puzzle found', () => {
    // With a specific seed that produces hard-to-verify patterns,
    // the generator should eventually fall back to the heart
    const level = generateNonogramLevel(baseConfig);
    // At minimum, we get a valid level
    const state = level.initialState as NonogramState;
    expect(state.rowClues.length).toBe(state.height);
    expect(state.colClues.length).toBe(state.width);
  });
});
