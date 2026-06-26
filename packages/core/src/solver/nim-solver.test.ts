import { describe, it, expect } from 'vitest';
import { computeNimSum, isPPosition, findWinningMove, solveNim } from './nim-solver';
import type { NimState } from '../types/nim';

function makeState(piles: number[]): NimState {
  return { piles, currentPlayer: 0, initialPiles: [...piles] };
}

describe('computeNimSum', () => {
  it('returns 0 for single pile of 0', () => {
    expect(computeNimSum([0])).toBe(0);
  });

  it('returns the value for single pile', () => {
    expect(computeNimSum([5])).toBe(5);
  });

  it('computes XOR of multiple piles', () => {
    expect(computeNimSum([1, 2, 3])).toBe(0); // 1^2^3 = 0
  });

  it('computes non-zero XOR', () => {
    expect(computeNimSum([3, 4, 5])).toBe(2); // 3^4^5 = 2
  });

  it('handles empty piles array', () => {
    expect(computeNimSum([])).toBe(0);
  });
});

describe('isPPosition', () => {
  it('returns true when nimSum is 0', () => {
    expect(isPPosition([1, 2, 3])).toBe(true);
    expect(isPPosition([0, 0])).toBe(true);
    expect(isPPosition([5, 5])).toBe(true);
  });

  it('returns false when nimSum is not 0', () => {
    expect(isPPosition([3, 4, 5])).toBe(false);
    expect(isPPosition([1])).toBe(false);
  });
});

describe('findWinningMove', () => {
  it('returns null for P-position', () => {
    expect(findWinningMove([1, 2, 3])).toBeNull();
  });

  it('finds winning move for N-position', () => {
    // nimSum(3,4,5) = 2; pile 0: 3^2=1<3, remove 2
    const move = findWinningMove([3, 4, 5]);
    expect(move).not.toBeNull();
    expect(move!.pileIndex).toBe(0);
    expect(move!.removeCount).toBe(2); // 3 - 1 = 2
  });

  it('winning move makes resulting position a P-position', () => {
    const piles = [3, 4, 5];
    const move = findWinningMove(piles)!;
    const newPiles = [...piles];
    newPiles[move.pileIndex] = newPiles[move.pileIndex]! - move.removeCount;
    expect(isPPosition(newPiles)).toBe(true);
  });
});

describe('solveNim', () => {
  it('returns solvable for all positions', () => {
    expect(solveNim(makeState([1, 2, 3])).solvable).toBe(true);
    expect(solveNim(makeState([3, 4, 5])).solvable).toBe(true);
  });

  it('has empty moves for P-position', () => {
    expect(solveNim(makeState([1, 2, 3])).moves).toEqual([]);
  });

  it('has winning move for N-position', () => {
    const sol = solveNim(makeState([3, 4, 5]));
    expect(sol.moves.length).toBe(1);
  });

  it('includes trace with nim-xor type', () => {
    const sol = solveNim(makeState([3, 4, 5]));
    expect(sol.trace?.type).toBe('nim-xor');
  });

  it('stats has correct solver name', () => {
    const sol = solveNim(makeState([1, 2, 3]));
    expect(sol.stats.solverName).toBe('Nim-sum (Bouton 1901)');
  });
});
