import { describe, expect, it } from 'vitest';
import { isOwnState } from './rules';
import { generatePegSolitaireLevel } from './generator';
import { CLASSIC_CENTER_EMPTY, PEG_CATALOG, catalogByGoal } from './puzzles';
import type { PegSolitaireState } from './types';

describe('Peg Solitaire catalog picker (Hub fallback)', () => {
  it('deals only one-center catalog states (default cultural entry)', () => {
    for (let seed = 0; seed < 12; seed += 1) {
      const level = generatePegSolitaireLevel({ difficultyRange: [1, 100], seed });
      const state = level.initialState as unknown as PegSolitaireState;
      expect(state.goal).toBe('one-center');
      expect(isOwnState(state)).toBe(true);
      expect(level.generatedBy).toBe('classic-catalog');
      expect(state.catalogId).toBeTruthy();
    }
  });

  it('only deals bitmasks from the one-center shelf', () => {
    const allowed = new Set(catalogByGoal('one-center').map(entry => entry.pegs));
    for (let seed = 0; seed < 20; seed += 1) {
      const state = generatePegSolitaireLevel({ difficultyRange: [67, 100], seed })
        .initialState as unknown as PegSolitaireState;
      expect(allowed.has(state.pegs)).toBe(true);
    }
  });

  it('includes classic center-vacant among seed picks', () => {
    const levels = Array.from({ length: catalogByGoal('one-center').length }, (_, seed) =>
      generatePegSolitaireLevel({ difficultyRange: [1, 100], seed }),
    );
    expect(
      levels.some(level => {
        const state = level.initialState as unknown as PegSolitaireState;
        return state.pegs === CLASSIC_CENTER_EMPTY.pegs;
      }),
    ).toBe(true);
  });

  it('changes catalog picks across seeds', () => {
    const ids = new Set(
      Array.from({ length: 12 }, (_, seed) => {
        const level = generatePegSolitaireLevel({ difficultyRange: [1, 100], seed: seed * 3 });
        return (level.initialState as unknown as PegSolitaireState).catalogId;
      }),
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  it('never invents boards outside PEG_CATALOG', () => {
    const allowed = new Set(PEG_CATALOG.map(entry => entry.pegs));
    for (let seed = 0; seed < 15; seed += 1) {
      const state = generatePegSolitaireLevel({ difficultyRange: [1, 100], seed })
        .initialState as unknown as PegSolitaireState;
      expect(allowed.has(state.pegs)).toBe(true);
    }
  });

  it('seed 0 always deals classic center-vacant', () => {
    const level = generatePegSolitaireLevel({ difficultyRange: [1, 100], seed: 0 });
    const state = level.initialState as unknown as PegSolitaireState;
    expect(state.catalogId).toBe(CLASSIC_CENTER_EMPTY.id);
    expect(level.optimalSteps).toBe(31);
  });
});
