import { describe, it, expect } from 'vitest';
import { getDifficulty } from './rules';
import { getLevel } from './levels';

describe('getDifficulty', () => {
  it('returns score 0-100 with label key for level 0', () => {
    const state = getLevel(0);
    const d = getDifficulty(state);
    expect(d.score).toBeGreaterThanOrEqual(0);
    expect(d.score).toBeLessThanOrEqual(100);
    expect(d.labelKey).toMatch(/^difficulty\./);
  });

  it('returns valid scores for multiple levels', () => {
    const easy = getDifficulty(getLevel(0));
    const later = getDifficulty(getLevel(2));
    expect(easy.score).toBeGreaterThanOrEqual(0);
    expect(easy.score).toBeLessThanOrEqual(100);
    expect(later.score).toBeGreaterThanOrEqual(0);
    expect(later.score).toBeLessThanOrEqual(100);
  });

  it('factors include size and boxCount', () => {
    const state = getLevel(0);
    const d = getDifficulty(state);
    expect(d.factors.size).toBeGreaterThan(0);
    expect(d.factors.boxCount).toBeGreaterThan(0);
  });
});

import { sokobanEntry } from './index';

describe('sokobanEntry', () => {
  it('moveToHighlight handles null and undefined safely', () => {
    const state = getLevel(0);
    expect(sokobanEntry.moveToHighlight?.(null as never, state)).toBeNull();
    expect(sokobanEntry.moveToHighlight?.(undefined as never, state)).toBeNull();
    expect(sokobanEntry.moveToHighlight?.({ direction: 'up' }, undefined as never)).toBeNull();
    expect(sokobanEntry.moveToHighlight?.({ direction: 'up' }, state)).toEqual({
      row: state.player.row - 1,
      col: state.player.col,
    });
  });
});
