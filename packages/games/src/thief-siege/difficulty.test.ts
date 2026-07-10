import { describe, expect, it } from 'vitest';
import { createInitialState } from './rules';
import { computeThiefSiegeDifficulty, getDifficulty } from './difficulty';
import type { ThiefSiegeState } from './types';

function stateWithCells(cells: ThiefSiegeState['cells'], thief = { row: 2, col: 2 }): ThiefSiegeState {
  return {
    ...createInitialState(),
    width: 5,
    height: 5,
    cells,
    thief,
    maxCops: 10,
  };
}

describe('computeThiefSiegeDifficulty', () => {
  it('returns finite score and factors in the expected band', () => {
    const difficulty = computeThiefSiegeDifficulty({
      escapeLength: 4,
      exitCount: 16,
      openCells: 25,
      copsPlaced: 0,
      maxCops: 10,
    });

    expect(Number.isFinite(difficulty.score)).toBe(true);
    expect(difficulty.score).toBeGreaterThanOrEqual(0);
    expect(difficulty.score).toBeLessThanOrEqual(100);
    expect(difficulty.factors.escapeLength).toBe(4);
    expect(difficulty.factors.exitCount).toBe(16);
    expect(difficulty.factors.openCells).toBe(25);
    expect(difficulty.labelKey).toMatch(/^difficulty\.(easy|medium|hard)$/);
  });

  it('scores short escape paths with many exits as harder for the player', () => {
    const constrained = computeThiefSiegeDifficulty({
      escapeLength: 8,
      exitCount: 2,
      openCells: 20,
      copsPlaced: 0,
      maxCops: 12,
    });
    const open = computeThiefSiegeDifficulty({
      escapeLength: 2,
      exitCount: 12,
      openCells: 45,
      copsPlaced: 0,
      maxCops: 8,
    });

    expect(open.score).toBeGreaterThan(constrained.score);
  });
});

describe('getDifficulty', () => {
  it('uses the current shortest escape path for an opening state', () => {
    const difficulty = getDifficulty(createInitialState());

    expect(Number.isFinite(difficulty.score)).toBe(true);
    expect(difficulty.factors.escapeLength).toBeGreaterThan(0);
    expect(difficulty.factors.exitCount).toBe(16);
    expect(difficulty.factors.openCells).toBe(25);
  });

  it('drops escapeLength to 0 when no escape path remains', () => {
    const blocked = stateWithCells([
      'exit', 'exit', 'exit', 'exit', 'exit',
      'exit', 'obstacle', 'obstacle', 'obstacle', 'exit',
      'exit', 'obstacle', 'floor', 'obstacle', 'exit',
      'exit', 'obstacle', 'obstacle', 'obstacle', 'exit',
      'exit', 'exit', 'exit', 'exit', 'exit',
    ]);

    const difficulty = getDifficulty(blocked);

    expect(difficulty.factors.escapeLength).toBe(0);
    expect(difficulty.score).toBeGreaterThanOrEqual(0);
  });
});
