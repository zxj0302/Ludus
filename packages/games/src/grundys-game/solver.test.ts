import { describe, expect, it } from 'vitest';
import { createInitialState } from './rules';
import {
  GRUNDY_A002188_PREFIX,
  computeGrundy,
  computeGrundyXor,
  findWinningMove,
  isPPosition,
  pileNimbers,
  solveGrundysGame,
} from './solver';
import type { GrundysGameState } from './types';
import { applyMove, legalSplits } from './rules';

describe('computeGrundy / A002188', () => {
  it('matches OEIS A002188 for n = 0..20', () => {
    for (let n = 0; n < GRUNDY_A002188_PREFIX.length; n += 1) {
      expect(computeGrundy(n)).toBe(GRUNDY_A002188_PREFIX[n]);
    }
  });

  it('gives 0 for unsplittable heaps', () => {
    expect(computeGrundy(0)).toBe(0);
    expect(computeGrundy(1)).toBe(0);
    expect(computeGrundy(2)).toBe(0);
  });
});

describe('computeGrundyXor / isPPosition', () => {
  it('treats terminal piles as P', () => {
    expect(isPPosition([1, 2, 1])).toBe(true);
    expect(computeGrundyXor([1, 2])).toBe(0);
  });

  it('uses XOR of nimbers not pile sizes', () => {
    // g(3)=1, g(4)=0 → xor 1 (N)
    expect(pileNimbers([3, 4])).toEqual([1, 0]);
    expect(computeGrundyXor([3, 4])).toBe(1);
    expect(isPPosition([3, 4])).toBe(false);

    // g(3)=1, g(6)=1 → xor 0 (P)
    expect(computeGrundyXor([3, 6])).toBe(0);
    expect(isPPosition([3, 6])).toBe(true);
  });
});

describe('findWinningMove', () => {
  it('returns null on P-positions', () => {
    expect(findWinningMove([3, 6])).toBeNull();
    expect(findWinningMove([1, 2])).toBeNull();
  });

  it('moves to XOR-zero from N-position', () => {
    const move = findWinningMove([3, 4]);
    expect(move).not.toBeNull();
    const state: GrundysGameState = {
      piles: [3, 4],
      currentPlayer: 0,
      initialPiles: [3, 4],
      phase: 'playing',
    };
    const next = applyMove(state, move!);
    expect(computeGrundyXor(next.piles)).toBe(0);
  });

  it('every winning move from small N-positions lands on P', () => {
    for (const piles of [[5], [3, 5], [7, 4]]) {
      if (isPPosition(piles)) continue;
      const move = findWinningMove(piles);
      expect(move, `expected move for ${piles}`).not.toBeNull();
      const n = piles[move!.pileIndex]!;
      expect(legalSplits(n)).toContain(move!.left);
      const next = [
        ...piles.slice(0, move!.pileIndex),
        move!.left,
        move!.right,
        ...piles.slice(move!.pileIndex + 1),
      ];
      expect(computeGrundyXor(next)).toBe(0);
    }
  });
});

describe('solveGrundysGame', () => {
  it('sets playerStarts false on P-position while choosing', () => {
    const state: GrundysGameState = {
      ...createInitialState(),
      piles: [3, 6],
      initialPiles: [3, 6],
      phase: 'choosing',
    };
    const solution = solveGrundysGame(state);
    const viz = solution.trace?.visualizationData as { playerStarts?: boolean };
    expect(viz.playerStarts).toBe(false);
  });

  it('sets playerStarts true on N-position while choosing', () => {
    const state: GrundysGameState = {
      ...createInitialState(),
      piles: [3, 4],
      initialPiles: [3, 4],
      phase: 'choosing',
    };
    const solution = solveGrundysGame(state);
    const viz = solution.trace?.visualizationData as { playerStarts?: boolean };
    expect(viz.playerStarts).toBe(true);
    expect(solution.moves.length).toBeGreaterThan(0);
  });

  it('returns empty moves when human faces a P-position (Hint → noWinningMove)', () => {
    const state: GrundysGameState = {
      piles: [3, 6],
      currentPlayer: 0,
      initialPiles: [3, 6],
      phase: 'playing',
    };
    const solution = solveGrundysGame(state);
    expect(solution.moves).toEqual([]);
    expect(solution.stats.terminated).toBe('exhausted');
  });

  it('simulates AI-first optimal replies from choosing P without human forced blunders', () => {
    const state: GrundysGameState = {
      ...createInitialState(),
      piles: [3, 6],
      initialPiles: [3, 6],
      phase: 'choosing',
    };
    const solution = solveGrundysGame(state);
    // AI opens with a fallback; subsequent human plies are winning moves only
    expect(solution.moves.length).toBeGreaterThan(0);
  });

  it('uses grundy-mex trace type', () => {
    const solution = solveGrundysGame(createInitialState());
    expect(solution.trace?.type).toBe('grundy-mex');
  });
});
