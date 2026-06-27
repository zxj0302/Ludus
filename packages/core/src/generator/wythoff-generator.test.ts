import { describe, it, expect } from 'vitest';
import { generateWythoffLevel } from './wythoff-generator';
import type { WythoffState } from '../types/wythoff';

describe('generateWythoffLevel', () => {
  it('generates a level with valid state', () => {
    const level = generateWythoffLevel();
    expect(level.gameId).toBe('wythoff');
    expect(level.schemaVersion).toBe(1);
    const state = level.initialState as unknown as WythoffState;
    expect(state.piles).toHaveLength(2);
    expect(state.piles[0]!).toBeGreaterThanOrEqual(1);
    expect(state.piles[0]!).toBeLessThanOrEqual(10);
    expect(state.piles[1]!).toBeGreaterThanOrEqual(1);
    expect(state.piles[1]!).toBeLessThanOrEqual(10);
    expect(state.phase).toBe('choosing');
    expect(state.currentPlayer).toBe(0);
    expect(level.difficulty.score).toBeLessThanOrEqual(100);
    expect(level.difficulty.score).toBeGreaterThanOrEqual(0);
    expect(level.optimalSteps).toBeNull();
    expect(level.generatedBy).toBe('random-piles');
  });

  it('generates different levels on successive calls', () => {
    const level1 = generateWythoffLevel();
    const level2 = generateWythoffLevel();
    // Extremely unlikely to generate the same level twice
    expect(level1.levelId).not.toBe(level2.levelId);
  });
});
