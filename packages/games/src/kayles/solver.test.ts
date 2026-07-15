import { describe, expect, it } from 'vitest';
import { applyMove, chainLengths, createInitialState } from './rules';
import {
  KAYLES_A002186_PREFIX,
  chainXor,
  computeKaylesGrundy,
  findKaylesWinningMove,
  isKaylesPPosition,
  solveKayles,
} from './solver';
import type { KaylesState } from './types';

describe('computeKaylesGrundy / A002186', () => {
  it('matches OEIS A002186 for n = 0..12', () => {
    for (let n = 0; n < KAYLES_A002186_PREFIX.length; n += 1) {
      expect(computeKaylesGrundy(n)).toBe(KAYLES_A002186_PREFIX[n]);
    }
  });
});

describe('chainLengths', () => {
  it('extracts contiguous runs and ignores gaps', () => {
    expect(chainLengths([true, true, false, true])).toEqual([2, 1]);
    expect(chainLengths([false, true, true, true, false])).toEqual([3]);
    expect(chainLengths([false, false])).toEqual([]);
    expect(chainLengths([true])).toEqual([1]);
  });
});

describe('chainXor / isKaylesPPosition', () => {
  it('treats empty board as P', () => {
    expect(isKaylesPPosition([false, false])).toBe(true);
    expect(chainXor([false, false])).toBe(0);
  });

  it('XORs grundy of contiguous runs', () => {
    expect(chainXor([true, false, true])).toBe(0);
    expect(isKaylesPPosition([true, false, true])).toBe(true);
    expect(chainXor([true, true, true])).toBe(3);
    expect(isKaylesPPosition([true, true, true])).toBe(false);
  });
});

describe('findKaylesWinningMove', () => {
  it('returns null on P-positions', () => {
    expect(findKaylesWinningMove([true, false, true])).toBeNull();
    expect(findKaylesWinningMove([false, false])).toBeNull();
  });

  it('moves to XOR-zero from N-position', () => {
    const alive = [true, true, true];
    const move = findKaylesWinningMove(alive);
    expect(move).not.toBeNull();
    const state: KaylesState = {
      alive,
      currentPlayer: 0,
      initialLength: 3,
      phase: 'playing',
    };
    const next = applyMove(state, move!);
    expect(chainXor(next.alive)).toBe(0);
  });

  it('every winning move from small N openings lands on P', () => {
    for (const n of [3, 4, 5, 7, 8]) {
      const alive = Array.from({ length: n }, () => true);
      if (isKaylesPPosition(alive)) continue;
      const move = findKaylesWinningMove(alive);
      expect(move, `expected move for n=${n}`).not.toBeNull();
      const state: KaylesState = {
        alive,
        currentPlayer: 0,
        initialLength: n,
        phase: 'playing',
      };
      const next = applyMove(state, move!);
      expect(chainXor(next.alive)).toBe(0);
    }
  });
});

describe('solveKayles', () => {
  it('returns empty moves when human faces a mid-game P-position', () => {
    const state: KaylesState = {
      alive: [true, false, true],
      currentPlayer: 0,
      initialLength: 3,
      phase: 'playing',
    };
    const solution = solveKayles(state);
    expect(solution.moves).toEqual([]);
    expect(solution.stats.terminated).toBe('exhausted');
  });

  it('sets playerStarts true when opening chain is N', () => {
    const state: KaylesState = {
      ...createInitialState(),
      alive: Array.from({ length: 3 }, () => true),
      initialLength: 3,
      phase: 'choosing',
    };
    const solution = solveKayles(state);
    const viz = solution.trace?.visualizationData as { playerStarts?: boolean };
    expect(viz.playerStarts).toBe(true);
    expect(solution.moves.length).toBeGreaterThan(0);
  });

  it('uses kayles-mex trace type', () => {
    expect(solveKayles(createInitialState()).trace?.type).toBe('kayles-mex');
  });
});
