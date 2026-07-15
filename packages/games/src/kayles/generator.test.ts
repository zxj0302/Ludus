import { describe, expect, it } from 'vitest';
import { computeKaylesDifficulty } from './difficulty';
import { generateKaylesLevel } from './generator';
import { isOwnState } from './rules';
import { computeKaylesGrundy } from './solver';
import type { KaylesState } from './types';

describe('computeKaylesDifficulty', () => {
  it('scores longer chains higher', () => {
    expect(computeKaylesDifficulty(12).score).toBeGreaterThan(computeKaylesDifficulty(4).score);
  });

  it('labels bands by score thresholds', () => {
    expect(computeKaylesDifficulty(4).labelKey).toBe('difficulty.easy');
    expect(computeKaylesDifficulty(7).labelKey).toBe('difficulty.medium');
    expect(computeKaylesDifficulty(12).labelKey).toBe('difficulty.hard');
  });
});

describe('generateKaylesLevel', () => {
  it('produces a full single chain within Hub bounds', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const level = generateKaylesLevel({ seed, difficultyRange: [1, 100] });
      const state = level.initialState as unknown as KaylesState;
      expect(isOwnState(state)).toBe(true);
      expect(state.phase).toBe('choosing');
      expect(state.alive.every(Boolean)).toBe(true);
      expect(state.alive.length).toBe(state.initialLength);
      expect(state.initialLength).toBeGreaterThanOrEqual(4);
      expect(state.initialLength).toBeLessThanOrEqual(12);
      expect(level.gameId).toBe('kayles');
      expect(level.generatedBy).toBe('chain-length');
    }
  });

  it('is reproducible for the same seed', () => {
    const a = generateKaylesLevel({ seed: 42, difficultyRange: [34, 66] });
    const b = generateKaylesLevel({ seed: 42, difficultyRange: [34, 66] });
    expect(a.initialState).toEqual(b.initialState);
    expect(a.levelId).toBe(b.levelId);
  });

  it('uses longer chains for hard difficulty band', () => {
    for (let seed = 1; seed <= 15; seed += 1) {
      const level = generateKaylesLevel({ seed, difficultyRange: [67, 100] });
      const state = level.initialState as unknown as KaylesState;
      expect(state.initialLength).toBeGreaterThanOrEqual(10);
      expect(computeKaylesGrundy(state.initialLength)).not.toBe(0);
    }
  });

  it('uses shorter chains for easy difficulty band', () => {
    for (let seed = 1; seed <= 15; seed += 1) {
      const level = generateKaylesLevel({ seed, difficultyRange: [1, 33] });
      const state = level.initialState as unknown as KaylesState;
      expect(state.initialLength).toBeLessThanOrEqual(6);
    }
  });
});
