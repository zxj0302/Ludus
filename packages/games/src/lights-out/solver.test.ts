import { describe, it, expect } from 'vitest';
import { solveGF2, optimalSolution, buildLightsOutMatrix, isInvertible, hammingWeight } from './solver';

describe('solveGF2', () => {
  it('solves a trivial 1×1 system', () => {
    const A = [[1]];
    const b = [1];
    const sol = solveGF2(A, b);
    expect(sol.particular).toEqual([1]);
    expect(sol.nullity).toBe(0);
    expect(sol.rank).toBe(1);
  });

  it('solves identity matrix', () => {
    const A = [[1, 0], [0, 1]];
    const b = [1, 0];
    const sol = solveGF2(A, b);
    expect(sol.particular).toEqual([1, 0]);
    expect(sol.nullity).toBe(0);
  });

  it('detects unsolvable system', () => {
    // x + y = 1, 0 = 1 (inconsistent)
    const A = [[1, 1], [0, 0]];
    const b = [1, 1];
    const sol = solveGF2(A, b);
    expect(sol.particular).toBeNull();
  });

  it('finds null space for underdetermined system', () => {
    // x + y = 1 (one equation, two variables)
    const A = [[1, 1]];
    const b = [1];
    const sol = solveGF2(A, b);
    expect(sol.particular).not.toBeNull();
    expect(sol.nullity).toBe(1);
    expect(sol.nullSpace.length).toBe(1);
    // Verify particular solution satisfies Ax = b (mod 2)
    const x = sol.particular!;
    expect((x[0]! ^ x[1]!) & 1).toBe(1);
    // Verify null space vector satisfies Ax = 0
    const n = sol.nullSpace[0]!;
    expect((n[0]! ^ n[1]!) & 1).toBe(0);
  });

  it('solves 2×2 Lights Out config', () => {
    const A = buildLightsOutMatrix(2);
    // 2×2 state: just press the bottom-right
    const state = [0, 0, 0, 1];
    const sol = solveGF2(A, state);
    expect(sol.particular).not.toBeNull();
    expect(sol.rank).toBe(4); // 2×2 Lights Out is full rank
    expect(sol.nullity).toBe(0);
  });

  it('handles empty matrix', () => {
    const sol = solveGF2([], []);
    expect(sol.particular).toEqual([]);
    expect(sol.rank).toBe(0);
  });
});

describe('optimalSolution', () => {
  it('returns null when unsolvable', () => {
    const sol = {
      particular: null,
      nullSpace: [],
      rank: 0,
      nullity: 0,
      rows: 1,
      cols: 1,
    };
    expect(optimalSolution(sol)).toBeNull();
  });

  it('returns particular when nullity is 0', () => {
    const sol = {
      particular: [1, 0],
      nullSpace: [],
      rank: 2,
      nullity: 0,
      rows: 2,
      cols: 2,
    };
    expect(optimalSolution(sol)).toEqual([1, 0]);
  });

  it('finds minimum weight solution among null space', () => {
    // x + y = 1, null space is [[1, 1]]
    const sol = {
      particular: [1, 0], // weight 1
      nullSpace: [[1, 1]],
      rank: 1,
      nullity: 1,
      rows: 1,
      cols: 2,
    };
    const opt = optimalSolution(sol);
    // particular = [1,0], weight=1
    // particular + null = [0,1], weight=1
    // Both have weight 1, either is fine
    expect(opt).not.toBeNull();
    expect(hammingWeight(opt!)).toBe(1);
  });
});

describe('buildLightsOutMatrix', () => {
  it('builds correct 1×1 matrix', () => {
    const A = buildLightsOutMatrix(1);
    expect(A).toEqual([[1]]);
  });

  it('builds symmetric matrix for 2×2', () => {
    const A = buildLightsOutMatrix(2);
    // Check symmetry
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        expect(A[i]![j]).toBe(A[j]![i]);
      }
    }
  });

  it('each column has exactly 3–5 ones (self + up to 4 neighbors)', () => {
    for (const n of [3, 4, 5, 6]) {
      const A = buildLightsOutMatrix(n);
      const N = n * n;
      for (let j = 0; j < N; j++) {
        let colSum = 0;
        for (let i = 0; i < N; i++) {
          colSum += A[i]![j]!;
        }
        expect(colSum).toBeGreaterThanOrEqual(2); // corner: self + 1 neighbor
        expect(colSum).toBeLessThanOrEqual(5); // center: self + 4 neighbors
      }
    }
  });
});

describe('isInvertible', () => {
  it('identity is invertible', () => {
    expect(isInvertible([[1, 0], [0, 1]])).toBe(true);
  });

  it('zero matrix is not invertible', () => {
    expect(isInvertible([[0, 0], [0, 0]])).toBe(false);
  });

  it('3×3 Lights Out matrix is invertible, 5×5 has nullity 2', () => {
    const A3 = buildLightsOutMatrix(3);
    expect(isInvertible(A3)).toBe(true);

    const A5 = buildLightsOutMatrix(5);
    // 5×5 Lights Out has rank 23, nullity 2 — not invertible
    const sol = solveGF2(A5, new Array(25).fill(0));
    expect(sol.rank).toBe(23);
    expect(sol.nullity).toBe(2);
    expect(isInvertible(A5)).toBe(false);
  });
});

describe('hammingWeight', () => {
  it('counts ones correctly', () => {
    expect(hammingWeight([0, 0, 0])).toBe(0);
    expect(hammingWeight([1, 0, 1])).toBe(2);
    expect(hammingWeight([1, 1, 1, 1, 1])).toBe(5);
  });
});
