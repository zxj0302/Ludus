import { describe, expect, it } from 'vitest';
import type { EuclidPiles } from './types';
import {
  applyMove,
  chooseHand,
  createInitialState,
  isOwnState,
  isPlayerVictory,
  isSolved,
  legalMoves,
  legalMultiples,
  normalizePiles,
} from './rules';

describe('normalizePiles', () => {
  it('orders larger first', () => {
    expect(normalizePiles(5, 13)).toEqual([13, 5]);
    expect(normalizePiles(8, 8)).toEqual([8, 8]);
  });
});

describe('legalMultiples', () => {
  it('lists k from 1 to floor(a/b)', () => {
    expect(legalMultiples([13, 5])).toEqual([1, 2]);
    expect(legalMultiples([10, 3])).toEqual([1, 2, 3]);
  });

  it('allows taking the entire larger pile', () => {
    expect(legalMultiples([15, 5])).toEqual([1, 2, 3]);
    const after = applyMove(
      { ...createInitialState(), piles: [15, 5], phase: 'playing', currentPlayer: 0 },
      { multiple: 3 },
    );
    expect(isSolved(after)).toBe(true);
  });
});

describe('applyMove', () => {
  it('subtracts multiple of smaller from larger and swaps order', () => {
    const state = {
      ...createInitialState(),
      piles: [13, 5] as EuclidPiles,
      phase: 'playing' as const,
      currentPlayer: 0 as const,
    };
    const next = applyMove(state, { multiple: 2 });
    expect(next.piles).toEqual([5, 3]);
    expect(next.currentPlayer).toBe(1);
  });

  it('rejects illegal multiple', () => {
    const state = {
      ...createInitialState(),
      piles: [13, 5] as EuclidPiles,
      phase: 'playing' as const,
      currentPlayer: 0 as const,
    };
    expect(applyMove(state, { multiple: 4 })).toBe(state);
  });
});

describe('chooseHand', () => {
  it('enters playing with chosen first player', () => {
    const s = chooseHand(createInitialState(), false);
    expect(s.phase).toBe('playing');
    expect(s.currentPlayer).toBe(1);
  });
});

describe('legalMoves', () => {
  it('only exposes human moves on player turn', () => {
    const playing = chooseHand(createInitialState(), true);
    expect(legalMoves(playing).length).toBeGreaterThan(0);
    expect(legalMoves({ ...playing, currentPlayer: 1 })).toEqual([]);
  });
});

describe('isPlayerVictory', () => {
  it('is true when human took the last move to clear larger pile', () => {
    const won = {
      ...createInitialState(),
      piles: [0, 5] as EuclidPiles,
      phase: 'playing' as const,
      currentPlayer: 0 as const,
    };
    expect(isSolved(won)).toBe(true);
    expect(isPlayerVictory(won)).toBe(true);
  });
});

describe('isOwnState', () => {
  it('accepts euclids-game state', () => {
    expect(isOwnState(createInitialState())).toBe(true);
  });

  it('rejects nim state', () => {
    expect(isOwnState({ piles: [1, 2, 3], currentPlayer: 0, phase: 'playing', initialPiles: [1, 2, 3] })).toBe(false);
  });
});
