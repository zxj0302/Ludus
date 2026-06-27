import { describe, it, expect } from 'vitest';
import { createInitialState, legalMoves, applyMove, isSolved, getDifficulty, solveNimState } from './rules';
import type { NimState } from './rules';

describe('createInitialState', () => {
  it('returns state with 3 piles', () => {
    const s = createInitialState();
    expect(s.piles.length).toBe(3);
    expect(s.currentPlayer).toBe(0);
    expect(s.initialPiles).toEqual(s.piles);
  });
});

describe('legalMoves', () => {
  it('returns all removal options for all piles', () => {
    const s = createInitialState(); // [3, 4, 5]
    const moves = legalMoves(s);
    expect(moves.length).toBe(12); // 3+4+5
  });

  it('returns moves with correct pileIndex and removeCount', () => {
    const s = createInitialState();
    const moves = legalMoves(s);
    for (const m of moves) {
      expect(m.pileIndex).toBeGreaterThanOrEqual(0);
      expect(m.pileIndex).toBeLessThan(3);
      expect(m.removeCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('returns empty for empty piles', () => {
    const s: NimState = { piles: [0, 0], currentPlayer: 0, initialPiles: [0, 0], phase: 'playing' };
    expect(legalMoves(s)).toEqual([]);
  });

  it('returns empty when it is AI turn', () => {
    const s: NimState = { piles: [3, 4, 5], currentPlayer: 1, initialPiles: [3, 4, 5], phase: 'playing' };
    expect(legalMoves(s)).toEqual([]);
  });
});

describe('applyMove', () => {
  it('removes stones from specified pile', () => {
    const s = createInitialState();
    const next = applyMove(s, { pileIndex: 0, removeCount: 2 });
    expect(next.piles[0]).toBe(1);
    expect(next.currentPlayer).toBe(1);
  });

  it('is immutable', () => {
    const s = createInitialState();
    const next = applyMove(s, { pileIndex: 0, removeCount: 2 });
    expect(s.piles[0]).toBe(3);
    expect(s.currentPlayer).toBe(0);
  });

  it('ignores invalid pileIndex', () => {
    const s = createInitialState();
    expect(applyMove(s, { pileIndex: -1, removeCount: 1 })).toBe(s);
    expect(applyMove(s, { pileIndex: 9, removeCount: 1 })).toBe(s);
  });

  it('ignores invalid removeCount', () => {
    const s = createInitialState();
    expect(applyMove(s, { pileIndex: 0, removeCount: 0 })).toBe(s);
    expect(applyMove(s, { pileIndex: 0, removeCount: 99 })).toBe(s);
  });

  it('applies move during AI turn and toggles currentPlayer', () => {
    const s: NimState = { piles: [3, 1], currentPlayer: 1, initialPiles: [3, 4], phase: 'playing' };
    const next = applyMove(s, { pileIndex: 0, removeCount: 1 });
    expect(next).not.toBe(s);
    expect(next.piles[0]).toBe(2);
    expect(next.currentPlayer).toBe(0);
  });
});

describe('isSolved', () => {
  it('true when all piles empty and it is AI turn', () => {
    const s: NimState = { piles: [0, 0, 0], currentPlayer: 1, initialPiles: [3, 4, 5], phase: 'playing' };
    expect(isSolved(s)).toBe(true);
  });

  it('false when piles not empty', () => {
    expect(isSolved(createInitialState())).toBe(false);
  });

  it('true when all piles empty regardless of player turn', () => {
    const s: NimState = { piles: [0, 0, 0], currentPlayer: 0, initialPiles: [3, 4, 5], phase: 'playing' };
    expect(isSolved(s)).toBe(true);
  });
});

describe('getDifficulty', () => {
  it('returns valid difficulty structure', () => {
    const d = getDifficulty(createInitialState());
    expect(d.score).toBeGreaterThanOrEqual(0);
    expect(d.score).toBeLessThanOrEqual(100);
    expect(d.factors.pileCount).toBe(3);
  });
});

describe('solveNimState', () => {
  it('finds winning move for N-position', () => {
    const s = createInitialState(); // [3,4,5] = N-position
    const sol = solveNimState(s);
    expect(sol.solvable).toBe(true);
    expect(sol.trace?.type).toBe('nim-xor');
  });

  it('empty moves for P-position', () => {
    const s: NimState = { piles: [1, 2, 3], currentPlayer: 0, initialPiles: [1, 2, 3], phase: 'playing' };
    const sol = solveNimState(s);
    expect(sol.moves).toEqual([]);
  });
});
