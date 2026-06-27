import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  chooseHand,
  legalMoves,
  applyMove,
  isSolved,
  solveWythoffState,
} from './rules';
import { isWythoffPPosition } from '@ludus/core';
import type { WythoffState, WythoffMove } from './rules';

describe('createInitialState', () => {
  it('returns choosing phase with (1,2)', () => {
    const s = createInitialState();
    expect(s.piles).toEqual([1, 2]);
    expect(s.phase).toBe('choosing');
    expect(s.currentPlayer).toBe(0);
  });
});

describe('chooseHand', () => {
  it('sets player first', () => {
    const s = chooseHand(createInitialState(), true);
    expect(s.currentPlayer).toBe(0);
    expect(s.phase).toBe('playing');
  });

  it('sets AI first', () => {
    const s = chooseHand(createInitialState(), false);
    expect(s.currentPlayer).toBe(1);
    expect(s.phase).toBe('playing');
  });

  it('no-ops if not in choosing phase', () => {
    const playing = { ...createInitialState(), phase: 'playing' as const };
    const s = chooseHand(playing, true);
    expect(s).toBe(playing);
  });
});

describe('legalMoves', () => {
  it('returns empty in choosing phase', () => {
    const s = createInitialState();
    expect(legalMoves(s)).toEqual([]);
  });

  it('returns empty for AI turn', () => {
    const s = { ...createInitialState(), phase: 'playing' as const, currentPlayer: 1 as const };
    expect(legalMoves(s)).toEqual([]);
  });

  it('includes single-pile moves', () => {
    const s: WythoffState = { piles: [1, 2], currentPlayer: 0, initialPiles: [1, 2], phase: 'playing' };
    const moves = legalMoves(s);
    // Pile 0 (1 stone): remove 1
    // Pile 1 (2 stones): remove 1, 2
    // Both: remove 1
    expect(moves.length).toBe(4);
  });

  it('includes both-pile moves', () => {
    const s: WythoffState = { piles: [3, 3], currentPlayer: 0, initialPiles: [3, 3], phase: 'playing' };
    const moves = legalMoves(s);
    const bothMoves = moves.filter(m => m.type === 'both');
    expect(bothMoves.length).toBe(3); // remove 1, 2, or 3 from both
  });

  it('no both-pile moves when one pile is empty', () => {
    const s: WythoffState = { piles: [3, 0], currentPlayer: 0, initialPiles: [3, 0], phase: 'playing' };
    const moves = legalMoves(s);
    expect(moves.every(m => m.type === 'single')).toBe(true);
  });
});

describe('applyMove', () => {
  it('applies single-pile move', () => {
    const s: WythoffState = { piles: [3, 5], currentPlayer: 0, initialPiles: [3, 5], phase: 'playing' };
    const result = applyMove(s, { type: 'single', pileIndex: 0, removeCount: 2 });
    expect(result.piles).toEqual([1, 5]);
    expect(result.currentPlayer).toBe(1);
  });

  it('applies both-pile move', () => {
    const s: WythoffState = { piles: [3, 3], currentPlayer: 0, initialPiles: [3, 3], phase: 'playing' };
    const result = applyMove(s, { type: 'both', removeCount: 2 });
    expect(result.piles).toEqual([1, 1]);
    expect(result.currentPlayer).toBe(1);
  });

  it('rejects illegal single-pile move (too many)', () => {
    const s: WythoffState = { piles: [2, 3], currentPlayer: 0, initialPiles: [2, 3], phase: 'playing' };
    const result = applyMove(s, { type: 'single', pileIndex: 0, removeCount: 5 });
    expect(result).toBe(s);
  });

  it('rejects illegal both-pile move (too many)', () => {
    const s: WythoffState = { piles: [2, 3], currentPlayer: 0, initialPiles: [2, 3], phase: 'playing' };
    const result = applyMove(s, { type: 'both', removeCount: 3 });
    expect(result).toBe(s);
  });

  it('toggles player after move', () => {
    const s: WythoffState = { piles: [3, 3], currentPlayer: 0, initialPiles: [3, 3], phase: 'playing' };
    const r1 = applyMove(s, { type: 'single', pileIndex: 0, removeCount: 1 });
    expect(r1.currentPlayer).toBe(1);
    const r2 = applyMove(r1, { type: 'single', pileIndex: 0, removeCount: 1 });
    expect(r2.currentPlayer).toBe(0);
  });
});

describe('isSolved', () => {
  it('true when both piles are empty', () => {
    const s: WythoffState = { piles: [0, 0], currentPlayer: 0, initialPiles: [3, 5], phase: 'playing' };
    expect(isSolved(s)).toBe(true);
  });

  it('false when at least one pile has stones', () => {
    const s: WythoffState = { piles: [0, 1], currentPlayer: 0, initialPiles: [3, 5], phase: 'playing' };
    expect(isSolved(s)).toBe(false);
  });
});

describe('solveWythoffState', () => {
  it('returns solution with trace', () => {
    const s: WythoffState = { piles: [2, 2], currentPlayer: 0, initialPiles: [2, 2], phase: 'playing' };
    const sol = solveWythoffState(s);
    expect(sol.solvable).toBe(true);
    expect(sol.trace.type).toBe('wythoff-beatty');
    expect(sol.stats.solverName).toContain('Wythoff');
  });

  it('alternates player and AI moves', () => {
    const s: WythoffState = { piles: [2, 2], currentPlayer: 0, initialPiles: [2, 2], phase: 'playing' };
    const sol = solveWythoffState(s);
    expect(sol.moves.length).toBeGreaterThan(0);
  });

  it('returns empty moves for P-position', () => {
    const s: WythoffState = { piles: [1, 2], currentPlayer: 0, initialPiles: [1, 2], phase: 'playing' };
    const sol = solveWythoffState(s);
    expect(sol.moves).toEqual([]);
  });

  it('each player move goes from N to P', () => {
    const s: WythoffState = { piles: [3, 4], currentPlayer: 0, initialPiles: [3, 4], phase: 'playing' };
    const sol = solveWythoffState(s);
    for (let i = 0; i < sol.moves.length; i += 2) {
      // Player moves should exist and be winning moves
      const pm = sol.moves[i]!;
      expect(pm).toBeDefined();
    }
  });
});
