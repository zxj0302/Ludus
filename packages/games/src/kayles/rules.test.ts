import { describe, expect, it } from 'vitest';
import {
  applyMove,
  chooseHand,
  createInitialState,
  isOwnState,
  isPlayerVictory,
  isSolved,
  legalMoves,
  legalMovesForPlayer,
} from './rules';
import type { KaylesState } from './types';

function playing(alive: boolean[], currentPlayer: 0 | 1 = 0): KaylesState {
  return {
    alive,
    currentPlayer,
    initialLength: alive.length,
    phase: 'playing',
  };
}

describe('createInitialState / chooseHand', () => {
  it('starts choosing with a single full chain', () => {
    const s = createInitialState();
    expect(s.phase).toBe('choosing');
    expect(s.alive.length).toBeGreaterThanOrEqual(8);
    expect(s.alive.length).toBeLessThanOrEqual(12);
    expect(s.alive.every(Boolean)).toBe(true);
    expect(s.initialLength).toBe(s.alive.length);
  });

  it('enters playing with chosen first player', () => {
    const aiFirst = chooseHand(createInitialState(), false);
    expect(aiFirst.phase).toBe('playing');
    expect(aiFirst.currentPlayer).toBe(1);
  });
});

describe('legalMoves', () => {
  it('lists knock-1 and knock-2 on a full chain of 3', () => {
    const moves = legalMoves(playing([true, true, true]));
    expect(moves).toEqual([
      { index: 0, count: 1 },
      { index: 1, count: 1 },
      { index: 2, count: 1 },
      { index: 0, count: 2 },
      { index: 1, count: 2 },
    ]);
  });

  it('forbids knock-2 across a gap', () => {
    // T F T — only two singles
    const moves = legalMoves(playing([true, false, true]));
    expect(moves).toEqual([
      { index: 0, count: 1 },
      { index: 2, count: 1 },
    ]);
  });

  it('returns empty on AI turn or terminal', () => {
    expect(legalMoves(playing([true, true], 1))).toEqual([]);
    expect(legalMoves(playing([false, false]))).toEqual([]);
  });

  it('legalMovesForPlayer allows AI moves', () => {
    expect(legalMovesForPlayer(playing([true], 1), 1)).toEqual([{ index: 0, count: 1 }]);
  });
});

describe('applyMove', () => {
  it('knocks one pin and toggles player', () => {
    const next = applyMove(playing([true, true, true]), { index: 1, count: 1 });
    expect(next.alive).toEqual([true, false, true]);
    expect(next.currentPlayer).toBe(1);
  });

  it('knocks two adjacent pins', () => {
    const next = applyMove(playing([true, true, true]), { index: 0, count: 2 });
    expect(next.alive).toEqual([false, false, true]);
  });

  it('rejects illegal knock-2 across gap', () => {
    const s = playing([true, false, true]);
    expect(applyMove(s, { index: 0, count: 2 })).toBe(s);
  });

  it('marks terminal after last pin; human win when AI to move', () => {
    const next = applyMove(playing([true]), { index: 0, count: 1 });
    expect(next.alive).toEqual([false]);
    expect(isSolved(next)).toBe(true);
    expect(isPlayerVictory(next)).toBe(true);
  });

  it('isPlayerVictory is false when AI takes the last pin', () => {
    const next = applyMove(playing([true], 1), { index: 0, count: 1 });
    expect(isSolved(next)).toBe(true);
    expect(next.currentPlayer).toBe(0);
    expect(isPlayerVictory(next)).toBe(false);
  });
});

describe('isOwnState', () => {
  it('accepts valid kayles states', () => {
    expect(isOwnState(createInitialState())).toBe(true);
  });

  it('rejects foreign shapes', () => {
    expect(isOwnState({ alive: [true], phase: 'playing' })).toBe(false);
    expect(isOwnState({ piles: [3], phase: 'playing', currentPlayer: 0 })).toBe(false);
  });
});
