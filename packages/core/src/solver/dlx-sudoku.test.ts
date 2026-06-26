import { describe, it, expect } from 'vitest';
import { solveSudoku, countSudokuSolutions, validateSudoku } from './dlx-sudoku';

// Known puzzles from https://sudoku.com
const easyPuzzle = [
  5,3,0, 0,7,0, 0,0,0,
  6,0,0, 1,9,5, 0,0,0,
  0,9,8, 0,0,0, 0,6,0,

  8,0,0, 0,6,0, 0,0,3,
  4,0,0, 8,0,3, 0,0,1,
  7,0,0, 0,2,0, 0,0,6,

  0,6,0, 0,0,0, 2,8,0,
  0,0,0, 4,1,9, 0,0,5,
  0,0,0, 0,8,0, 0,7,9,
];

const easySolution = [
  5,3,4, 6,7,8, 9,1,2,
  6,7,2, 1,9,5, 3,4,8,
  1,9,8, 3,4,2, 5,6,7,

  8,5,9, 7,6,1, 4,2,3,
  4,2,6, 8,5,3, 7,9,1,
  7,1,3, 9,2,4, 8,5,6,

  9,6,1, 5,3,7, 2,8,4,
  2,8,7, 4,1,9, 6,3,5,
  3,4,5, 2,8,6, 1,7,9,
];

const solvedGrid = Array(81).fill(0).map((_, i) => easySolution[i]!);

describe('validateSudoku', () => {
  it('accepts a valid grid', () => {
    expect(validateSudoku(easyPuzzle)).toBe(true);
  });

  it('accepts a complete valid grid', () => {
    expect(validateSudoku(easySolution)).toBe(true);
  });

  it('rejects grid with row conflict', () => {
    const bad = [...easyPuzzle];
    bad[1] = 5; // row 0 already has 5 at col 0
    expect(validateSudoku(bad)).toBe(false);
  });

  it('rejects grid with column conflict', () => {
    const bad = [...easyPuzzle];
    bad[9] = 5; // col 0 already has 5 at row 0
    expect(validateSudoku(bad)).toBe(false);
  });

  it('rejects grid with box conflict', () => {
    const bad = [...easyPuzzle];
    bad[1] = 6; // box 0 already has 6 at (1,0)
    expect(validateSudoku(bad)).toBe(false);
  });

  it('accepts empty grid', () => {
    expect(validateSudoku(new Array(81).fill(0))).toBe(true);
  });

  it('rejects out-of-range values', () => {
    const bad = [...easyPuzzle];
    bad[0] = 10;
    expect(validateSudoku(bad)).toBe(false);
  });
});

describe('solveSudoku', () => {
  it('solves a known easy puzzle', () => {
    const result = solveSudoku([...easyPuzzle]);
    expect(result.solvable).toBe(true);
    expect(result.grid).not.toBeNull();
    // Verify solution matches known solution
    expect(result.grid).toEqual(easySolution);
  });

  it('solves a fully solved grid trivially', () => {
    const result = solveSudoku([...solvedGrid]);
    expect(result.solvable).toBe(true);
    expect(result.grid).toEqual(solvedGrid);
  });

  it('reports unsolvable for impossible puzzle', () => {
    // Two 5's in row 0
    const impossible = [...easyPuzzle];
    impossible[1] = 5;
    const result = solveSudoku(impossible);
    expect(result.solvable).toBe(false);
    expect(result.grid).toBeNull();
  });

  it('includes trace and stats', () => {
    const result = solveSudoku([...easyPuzzle]);
    expect(result.trace.type).toBe('constraint-propagation');
    expect(result.stats.solverName).toBe('DLX (Algorithm X)');
    expect(result.stats.nodesExplored).toBeGreaterThan(0);
    expect(result.stats.timeMs).toBeGreaterThanOrEqual(0);
  });

  it('solves empty grid (finds any valid complete grid)', () => {
    const result = solveSudoku(new Array(81).fill(0));
    expect(result.solvable).toBe(true);
    expect(result.grid).not.toBeNull();
    expect(validateSudoku(result.grid!)).toBe(true);
  });
});

describe('countSudokuSolutions', () => {
  it('counts 1 solution for a proper puzzle', () => {
    expect(countSudokuSolutions([...easyPuzzle], 2)).toBe(1);
  });

  it('counts 0 for impossible puzzle', () => {
    const impossible = [...easyPuzzle];
    impossible[1] = 5;
    expect(countSudokuSolutions(impossible, 2)).toBe(0);
  });

  it('counts many solutions for empty grid (capped at limit)', () => {
    const n = countSudokuSolutions(new Array(81).fill(0), 3);
    expect(n).toBe(3);
  });

  it('limit=2 works for uniqueness check', () => {
    // Remove one more clue from easy puzzle to create multi-solution
    const multi = [...easyPuzzle];
    multi[0] = 0; // remove clue at upper-left
    const n = countSudokuSolutions(multi, 2);
    expect(n).toBeGreaterThanOrEqual(1);
  });
});
