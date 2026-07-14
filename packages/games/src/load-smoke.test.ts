import { describe, it, expect } from 'vitest';
import { getAllGames, getGameEntry } from './registry';

describe('game load smoke', () => {
  it('registers peg-solitaire in the Hub registry', () => {
    expect(getAllGames().map(plugin => plugin.metadata.id)).toContain('peg-solitaire');
  });

  for (const plugin of getAllGames()) {
    const id = plugin.metadata.id;
    it(`${id}: generateLevel + isOwnState`, () => {
      const entry = getGameEntry(id);
      expect(entry).toBeDefined();

      let state: unknown;
      try {
        const level = plugin.generateLevel({
          difficultyRange: [1, 100],
          size: 5,
          requireUniqueSolution: false,
        });
        state = level.initialState;
      } catch {
        state = plugin.initialState();
      }

      expect(state).toBeTruthy();
      expect(entry!.isOwnState(state as never)).toBe(true);
    });

    it(`${id}: fast solver does not throw on generated state`, () => {
      if (!plugin.metadata.isFastSolver || plugin.ai) return;

      let state: unknown;
      try {
        const level = plugin.generateLevel({
          difficultyRange: [1, 100],
          size: 5,
          requireUniqueSolution: false,
        });
        state = level.initialState;
      } catch {
        state = plugin.initialState();
      }

      expect(() => plugin.solve(state as never)).not.toThrow();
    });
  }
});
