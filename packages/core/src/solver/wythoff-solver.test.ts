import { describe, it, expect } from 'vitest';
import { isWythoffPPosition, findWythoffWinningMove, solveWythoff, computeWythoffPPositions } from './wythoff-solver';
import type { WythoffState } from '../types/wythoff';

function makeState(a: number, b: number): WythoffState {
  return {
    piles: [a, b],
    currentPlayer: 0,
    initialPiles: [a, b],
    phase: 'playing',
  };
}

describe('isWythoffPPosition', () => {
  it('(0,0) is P-position', () => {
    expect(isWythoffPPosition(0, 0)).toBe(true);
  });

  it('Known P-positions from Beatty sequence', () => {
    const knownP: Array<[number, number]> = [
      [1, 2], [3, 5], [4, 7], [6, 10], [8, 13],
      [9, 15], [11, 18], [12, 20],
    ];
    for (const [a, b] of knownP) {
      expect(isWythoffPPosition(a, b)).toBe(true);
      expect(isWythoffPPosition(b, a)).toBe(true); // symmetric
    }
  });

  it('Known N-positions', () => {
    expect(isWythoffPPosition(1, 1)).toBe(false);
    expect(isWythoffPPosition(2, 2)).toBe(false);
    expect(isWythoffPPosition(1, 3)).toBe(false);
    expect(isWythoffPPosition(2, 4)).toBe(false);
    expect(isWythoffPPosition(3, 4)).toBe(false);
  });

  it('Small positions verified manually', () => {
    // (1,2) is the smallest non-trivial P-position
    expect(isWythoffPPosition(1, 2)).toBe(true);
    // (1,1) → k=0, a=1 ≠ 0 → N
    expect(isWythoffPPosition(1, 1)).toBe(false);
    // (0,1) → k=1, a=0 ≠ ⌊1*1.618⌋=1 → N
    expect(isWythoffPPosition(0, 1)).toBe(false);
    // (0,2) → k=2, a=0 ≠ ⌊2*1.618⌋=3 → N
    expect(isWythoffPPosition(0, 2)).toBe(false);
  });

  it('computeWythoffPPositions matches pointwise check', () => {
    const pairs = computeWythoffPPositions(10);
    for (const [a, b] of pairs) {
      expect(isWythoffPPosition(a, b)).toBe(true);
    }
  });
});

describe('findWythoffWinningMove', () => {
  it('returns null for P-positions', () => {
    expect(findWythoffWinningMove(makeState(1, 2))).toBeNull();
    expect(findWythoffWinningMove(makeState(3, 5))).toBeNull();
    expect(findWythoffWinningMove(makeState(0, 0))).toBeNull();
  });

  it('finds single-pile winning move from N-position', () => {
    // (1,1): single-pile move taking 1 from pile 0 → (0,1) — check: (0,1) P?
    // k=|0-1|=1, ⌊1*1.618⌋=1, 0≠1 → N. Hmm, let me think again.
    // (1,1): options: single(0,1)→(0,1), single(1,1)→(1,0), both(1)→(0,0)
    // (0,0) is P! So winning move is both:1
    const move = findWythoffWinningMove(makeState(1, 1));
    expect(move).not.toBeNull();
    expect(move!.type).toBe('both');
    expect(move!.removeCount).toBe(1);
  });

  it('finds winning move from (2,2) → reachable P-position', () => {
    // (2,2): single(0,1)→(1,2) [P] or single(1,1)→(2,1) [P] or both(2)→(0,0) [P]
    const state = makeState(2, 2);
    const move = findWythoffWinningMove(state);
    expect(move).not.toBeNull();
    const [a, b] = state.piles;
    if (move!.type === 'single' && move!.pileIndex != null) {
      const newPiles: [number, number] = [a, b];
      newPiles[move!.pileIndex]! -= move!.removeCount;
      expect(isWythoffPPosition(newPiles[0]!, newPiles[1]!)).toBe(true);
    } else {
      expect(isWythoffPPosition(a - move!.removeCount, b - move!.removeCount)).toBe(true);
    }
  });

  it('finds single-pile winning move to reach P-position', () => {
    // (2,3): need to reach a P-position. Let's see what single moves exist:
    // Pile 0: remove 1→(1,3) check: k=2, ⌊2*1.618⌋=3, 1≠3 → N
    // Pile 0: remove 2→(0,3) check: k=3, ⌊3*1.618⌋=4, 0≠4 → N
    // Pile 1: remove 1→(2,2) check: k=0, 2≠0 → N
    // Pile 1: remove 2→(2,1) check: k=1, ⌊1*1.618⌋=1, a=1 → P! (1,2) is P
    // Pile 1: remove 3→(2,0) check: k=2, ⌊2*1.618⌋=3, a=0 → N
    // Both: remove 1→(1,2) P! Both: remove 2→(0,1) check: k=1, ⌊1*1.618⌋=1, 0≠1 → N
    // So winning moves: single(1,2) or both(1)
    const move = findWythoffWinningMove(makeState(2, 3));
    expect(move).not.toBeNull();
    // Verify the resulting position is a P-position
    const [a, b] = makeState(2, 3).piles;
    if (move!.type === 'single' && move!.pileIndex != null) {
      const newPiles: [number, number] = [a, b];
      newPiles[move!.pileIndex]! -= move!.removeCount;
      expect(isWythoffPPosition(newPiles[0]!, newPiles[1]!)).toBe(true);
    } else if (move!.type === 'both') {
      expect(isWythoffPPosition(a - move!.removeCount, b - move!.removeCount)).toBe(true);
    }
  });

  it('finds winning move for larger N-position', () => {
    // (5, 6): not a standard P-pair, verify move leads to P-position
    const state = makeState(5, 6);
    const move = findWythoffWinningMove(state);
    // If N-position, there must be a winning move
    if (!isWythoffPPosition(5, 6)) {
      expect(move).not.toBeNull();
    }
    if (move) {
      const [a, b] = state.piles;
      if (move.type === 'single' && move.pileIndex != null) {
        const newPiles: [number, number] = [a, b];
        newPiles[move.pileIndex]! -= move.removeCount;
        expect(isWythoffPPosition(newPiles[0]!, newPiles[1]!)).toBe(true);
      } else if (move.type === 'both') {
        expect(isWythoffPPosition(a - move.removeCount, b - move.removeCount)).toBe(true);
      }
    }
  });
});

describe('solveWythoff', () => {
  it('returns solvable with P-position info for P-position', () => {
    const sol = solveWythoff(makeState(1, 2));
    expect(sol.solvable).toBe(true);
    expect(sol.moves).toHaveLength(0);
    expect(sol.trace?.type).toBe('wythoff-beatty');
    expect(sol.stats.solverName).toContain('Wythoff');
    expect(sol.stats.terminated).toBe('solved');
  });

  it('returns winning move for N-position', () => {
    const sol = solveWythoff(makeState(1, 1));
    expect(sol.solvable).toBe(true);
    expect(sol.moves.length).toBeGreaterThan(0);
    expect(sol.moves[0]!.type).toBe('both');
  });

  it('trace contains visualizationData', () => {
    const sol = solveWythoff(makeState(3, 5));
    const vd = sol.trace!.visualizationData as { piles: number[]; isP: boolean };
    expect(vd.piles).toEqual([3, 5]);
    expect(vd.isP).toBe(true);
  });

  it('timeMs is measured', () => {
    const sol = solveWythoff(makeState(1, 1));
    expect(sol.stats.timeMs).toBeGreaterThanOrEqual(0);
  });
});

describe('computeWythoffPPositions', () => {
  it('returns (0,0) for k=0', () => {
    const pairs = computeWythoffPPositions(0);
    expect(pairs).toEqual([[0, 0]]);
  });

  it('returns known pairs', () => {
    const pairs = computeWythoffPPositions(3);
    expect(pairs[0]).toEqual([0, 0]);
    expect(pairs[1]).toEqual([1, 2]);
    expect(pairs[2]).toEqual([3, 5]);
    expect(pairs[3]).toEqual([4, 7]);
  });
});
