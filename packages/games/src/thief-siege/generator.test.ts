import { describe, expect, it } from 'vitest';
import { cellIndex } from './rules';
import { generateThiefSiegeLevel } from './generator';
import { shortestEscapePath } from './solver';
import type { ThiefSiegeState } from './types';

function stateFromSeed(seed: number, difficultyRange: [number, number] = [1, 100]): ThiefSiegeState {
  return generateThiefSiegeLevel({ difficultyRange, seed }).initialState as ThiefSiegeState;
}

describe('generateThiefSiegeLevel', () => {
  it('generated level has escape path from thief to an exit', () => {
    for (let i = 0; i < 20; i++) {
      const state = stateFromSeed(i + 1);
      expect(shortestEscapePath(state)).not.toBeNull();
    }
  });

  it('is deterministic for the same seed and difficulty range', () => {
    const level1 = generateThiefSiegeLevel({ difficultyRange: [34, 66], seed: 12345 });
    const level2 = generateThiefSiegeLevel({ difficultyRange: [34, 66], seed: 12345 });

    expect(level1.initialState).toEqual(level2.initialState);
    expect(level1.difficulty).toEqual(level2.difficulty);
    expect(level1.levelId).toBe(level2.levelId);
  });

  it('starts in cop phase with thief on floor and no cops placed', () => {
    const state = stateFromSeed(42);
    const thiefCell = state.cells[cellIndex(state.width, state.thief.row, state.thief.col)];

    expect(thiefCell).toBe('floor');
    expect(state.phase).toBe('cop');
    expect(state.currentPlayer).toBe(0);
    expect(state.cops).toEqual([]);
    expect(state.status).toBe('playing');
  });

  it('uses the Level shape expected by the plugin system', () => {
    const level = generateThiefSiegeLevel({ difficultyRange: [1, 100], seed: 7 });

    expect(level.schemaVersion).toBe(1);
    expect(level.gameId).toBe('thief-siege');
    expect(level.generatedBy).toBe('generateThiefSiegeLevel');
    expect(level.uniqueSolution).toBe(false);
    expect(level.optimalSteps).toBeNull();
    expect(level.difficulty.score).toBeGreaterThanOrEqual(0);
    expect(level.difficulty.score).toBeLessThanOrEqual(100);
  });

  it('harder ranges tend toward larger boards and fewer cops', () => {
    const easy = stateFromSeed(99, [1, 33]);
    const hard = stateFromSeed(99, [67, 100]);

    expect(hard.width).toBeGreaterThanOrEqual(easy.width);
    expect(hard.height).toBeGreaterThanOrEqual(easy.height);
    expect(hard.maxCops).toBeLessThanOrEqual(easy.maxCops);
  });
});
