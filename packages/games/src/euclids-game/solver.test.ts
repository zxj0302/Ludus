import { describe, expect, it } from 'vitest';
import {
  PHI,
  findWinningMove,
  isPPosition,
  isPPositionBrute,
  solveEuclidsGame,
} from './solver';
import { applyMultiple, createInitialState, normalizePiles } from './rules';
import type { EuclidsGameState } from './types';

describe('isPPosition', () => {
  it('marks (3,2) as P-position', () => {
    expect(isPPosition([3, 2])).toBe(true);
  });

  it('marks (2,1) as N-position', () => {
    expect(isPPosition([2, 1])).toBe(false);
  });

  it('treats equal piles as N-position (immediate win)', () => {
    expect(isPPosition([5, 5])).toBe(false);
  });
});

describe('φ formula vs brute force', () => {
  it('agrees on small positions', () => {
    const mismatches: string[] = [];
    for (let a = 1; a <= 12; a += 1) {
      for (let b = 1; b <= a; b += 1) {
        const piles = normalizePiles(a, b);
        if (piles[1] === 0) continue;
        if (isPPosition(piles) !== isPPositionBrute(piles)) {
          mismatches.push(`${piles.join(',')}: phi=${isPPosition(piles)} brute=${isPPositionBrute(piles)}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});

describe('findWinningMove', () => {
  it('returns null on P-positions', () => {
    expect(findWinningMove([3, 2])).toBeNull();
  });

  it('finds instant win when available', () => {
    expect(findWinningMove([4, 2])?.multiple).toBe(2);
  });

  it('moves to P-position from N-position', () => {
    const move = findWinningMove([5, 3]);
    expect(move).not.toBeNull();
    const next = applyMultiple([5, 3], move!.multiple);
    expect(next).not.toBe('win');
    expect(isPPosition(next as [number, number])).toBe(true);
  });
});

describe('PHI', () => {
  it('is approximately 1.618', () => {
    expect(PHI).toBeGreaterThan(1.618);
    expect(PHI).toBeLessThan(1.619);
  });
});

describe('solveEuclidsGame', () => {
  it('sets playerStarts false on P-position while choosing', () => {
    const state: EuclidsGameState = {
      ...createInitialState(),
      piles: [3, 2],
      initialPiles: [3, 2],
      phase: 'choosing',
    };
    const solution = solveEuclidsGame(state);
    const viz = solution.trace?.visualizationData as { playerStarts?: boolean } | undefined;
    expect(viz?.playerStarts).toBe(false);
  });

  it('sets playerStarts true on N-position while choosing', () => {
    const state: EuclidsGameState = {
      ...createInitialState(),
      piles: [5, 3],
      initialPiles: [5, 3],
      phase: 'choosing',
    };
    const solution = solveEuclidsGame(state);
    const viz = solution.trace?.visualizationData as { playerStarts?: boolean } | undefined;
    expect(viz?.playerStarts).toBe(true);
  });

  it('returns a multi-move winning sequence from N-position', () => {
    const state: EuclidsGameState = {
      ...createInitialState(),
      piles: [5, 3],
      initialPiles: [5, 3],
      phase: 'playing',
      currentPlayer: 0,
    };
    const solution = solveEuclidsGame(state);
    expect(solution.moves.length).toBeGreaterThan(0);
    expect(solution.stats.solutionLength).toBeGreaterThan(0);
    expect(solution.trace?.steps[0]?.description).toContain('N-position');
  });
});
