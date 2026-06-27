import { describe, it, expect } from 'vitest';
import { getLevel, getLevelCount, getAllLevels } from './levels';
import { generateSokobanLevel } from './generator';
import { solveSokobanBFS } from './solver';

describe('getLevel', () => {
  it('returns 3 builtin levels', () => {
    expect(getLevelCount()).toBe(3);
  });

  it('each level has valid structure and is solvable', () => {
    for (let i = 0; i < getLevelCount(); i++) {
      const state = getLevel(i);
      expect(state.width).toBeGreaterThan(0);
      expect(state.height).toBeGreaterThan(0);
      expect(state.player).toBeDefined();
      expect(state.goals.length).toBeGreaterThan(0);
      expect(state.boxes.length).toBe(state.goals.length);
      expect(state.walls.length).toBe(state.height);
      expect(state.walls[0]!.length).toBe(state.width);

      const sol = solveSokobanBFS(state, 15000);
      expect(sol.solvable,
        `Level ${i}: box=${state.boxes.length} goal=${state.goals.length} size=${state.width}x${state.height} moves=${sol.stats.solutionLength}`
      ).toBe(true);
    }
  });

  it('throws on out-of-range index', () => {
    expect(() => getLevel(-1)).toThrow();
    expect(() => getLevel(999)).toThrow();
  });
});

describe('getAllLevels', () => {
  it('returns all levels', () => {
    const all = getAllLevels();
    expect(all.length).toBe(3);
  });
});

describe('generateSokobanLevel', () => {
  it('returns a valid Level for easy difficulty', () => {
    const level = generateSokobanLevel({
      difficultyRange: [0, 33],
    });
    expect(level.gameId).toBe('sokoban');
    expect(level.schemaVersion).toBe(1);
    expect(level.initialState).toBeDefined();
    expect(level.difficulty.score).toBeGreaterThanOrEqual(0);
    expect(level.difficulty.score).toBeLessThanOrEqual(100);
    expect(level.levelId).toMatch(/^level-/);
  });

  it('returns a valid Level for hard difficulty', () => {
    const level = generateSokobanLevel({
      difficultyRange: [67, 100],
    });
    expect(level.gameId).toBe('sokoban');
    expect(level.initialState).toBeDefined();
  });

  it('generates a level with seed', () => {
    const level = generateSokobanLevel({ difficultyRange: [0, 100], seed: 42 });
    expect(level.gameId).toBe('sokoban');
    expect(level.initialState).toBeDefined();
  });
});
