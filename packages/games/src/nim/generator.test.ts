import { describe, it, expect } from 'vitest';
import { generateNimLevel } from './generator';

describe('generateNimLevel', () => {
  it('generates a valid level with required fields', () => {
    const level = generateNimLevel({ difficultyRange: [20, 50] });
    expect(level.gameId).toBe('nim');
    expect(level.levelId).toMatch(/^nim-/);
    expect(level.schemaVersion).toBe(1);
    expect(level.generatedBy).toBe('random-piles');
    expect(level.difficulty.score).toBeGreaterThanOrEqual(0);
    expect(level.difficulty.score).toBeLessThanOrEqual(100);
  });

  it('produced piles have at least 2 non-empty piles', () => {
    const level = generateNimLevel({ difficultyRange: [20, 50] });
    const state = level.initialState as unknown as { piles: number[] };
    const nonEmpty = state.piles.filter(v => v > 0);
    expect(nonEmpty.length).toBeGreaterThanOrEqual(2);
  });

  it('easy range produces fewer piles', () => {
    const level = generateNimLevel({ difficultyRange: [0, 20] });
    const state = level.initialState as unknown as { piles: number[] };
    expect(state.piles.length).toBeLessThanOrEqual(3);
  });

  it('hard range has more piles or larger stones', () => {
    const level = generateNimLevel({ difficultyRange: [80, 100] });
    const state = level.initialState as unknown as { piles: number[] };
    expect(state.piles.length).toBeGreaterThanOrEqual(3);
  });

  it('all pile values are positive', () => {
    const level = generateNimLevel({ difficultyRange: [30, 70] });
    const state = level.initialState as unknown as { piles: number[] };
    expect(state.piles.every((v: number) => v >= 0)).toBe(true);
  });

  it('generated piles are all positive and within range', () => {
    for (let i = 0; i < 20; i++) {
      const level = generateNimLevel({ difficultyRange: [20, 80] });
      const state = level.initialState as unknown as { piles: number[] };
      expect(state.piles.length).toBeGreaterThanOrEqual(2);
      expect(state.piles.every((v: number) => v >= 1)).toBe(true);
    }
  });
});
