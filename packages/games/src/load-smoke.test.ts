import { describe, it, expect } from 'vitest';
import { getAllGames, getGame, getGameEntry } from './registry';

describe('game load smoke', () => {
  it('does not register parked thief-siege in the Hub registry', () => {
    expect(getAllGames().map(plugin => plugin.metadata.id)).not.toContain('thief-siege');
  });

  it('registers peg-solitaire in the Hub registry', () => {
    expect(getAllGames().map(plugin => plugin.metadata.id)).toContain('peg-solitaire');
  });

  it('registers thief-siege in getGame and getGameEntry for direct routes', () => {
    const plugin = getGame('thief-siege');
    const entry = getGameEntry('thief-siege');
    expect(plugin).toBeDefined();
    expect(entry).toBeDefined();
    expect(entry!.isOwnState(plugin!.initialState())).toBe(true);
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
