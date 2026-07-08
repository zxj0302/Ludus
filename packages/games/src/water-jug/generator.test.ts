import { describe, it, expect } from 'vitest';
import { generateWaterJugLevel } from './generator';
import { isSolvable } from './rules';
import type { LevelConfig } from '@ludus/core';
import type { WaterJugState } from './types';

describe('Water Jug — generator', () => {
  const baseConfig: LevelConfig = {
    difficultyRange: [1, 100],
    requireUniqueSolution: false,
    requireKnownOptimal: false,
  };

  it('generates a solvable level', () => {
    const level = generateWaterJugLevel(baseConfig);
    const state = level.initialState as WaterJugState;
    expect(isSolvable(state.capacities, state.target)).toBe(true);
  });

  it('target is at most max capacity', () => {
    const level = generateWaterJugLevel(baseConfig);
    const state = level.initialState as WaterJugState;
    expect(state.target).toBeLessThanOrEqual(Math.max(...state.capacities));
  });

  it('target > 0', () => {
    const level = generateWaterJugLevel(baseConfig);
    const state = level.initialState as WaterJugState;
    expect(state.target).toBeGreaterThan(0);
  });

  it('easy difficulty: 2 jugs, small capacities (2-5)', () => {
    const level = generateWaterJugLevel({ ...baseConfig, difficultyRange: [1, 33] });
    const state = level.initialState as WaterJugState;
    expect(state.capacities.length).toBe(2);
    for (const cap of state.capacities) {
      expect(cap).toBeGreaterThanOrEqual(2);
      expect(cap).toBeLessThanOrEqual(5);
    }
  });

  it('medium difficulty: capacities in range 5-8', () => {
    const level = generateWaterJugLevel({ ...baseConfig, difficultyRange: [34, 66] });
    const state = level.initialState as WaterJugState;
    for (const cap of state.capacities) {
      expect(cap).toBeGreaterThanOrEqual(5);
      expect(cap).toBeLessThanOrEqual(8);
    }
  });

  it('hard difficulty: capacities in range 8-12', () => {
    const level = generateWaterJugLevel({ ...baseConfig, difficultyRange: [67, 100] });
    const state = level.initialState as WaterJugState;
    for (const cap of state.capacities) {
      expect(cap).toBeGreaterThanOrEqual(8);
      expect(cap).toBeLessThanOrEqual(12);
    }
  });

  it('initial state has all jugs empty', () => {
    const level = generateWaterJugLevel(baseConfig);
    const state = level.initialState as WaterJugState;
    for (const amt of state.jugs) {
      expect(amt).toBe(0);
    }
  });

  it('generates different levels on repeated calls', () => {
    const states = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const level = generateWaterJugLevel(baseConfig);
      const s = level.initialState as WaterJugState;
      states.add(`${s.capacities.join(',')}-${s.target}`);
    }
    // Should get at least some variety in 10 calls
    expect(states.size).toBeGreaterThan(1);
  });
});
