// packages/games/src/sudoku/rules.test.ts
import { describe, it, expect } from 'vitest';
import { createInitialState, legalMoves, applyMove, isSolved, getDifficulty, solveSudokuState } from './rules';

function makeState(grid: number[], givenMask?: boolean[]): ReturnType<typeof createInitialState> {
  return {
    n: 9,
    grid,
    givenMask: givenMask ?? grid.map(v => v !== 0),
  };
}

describe('createInitialState', () => {
  it('returns empty 9×9 grid', () => {
    const s = createInitialState();
    expect(s.n).toBe(9);
    expect(s.grid.length).toBe(81);
    expect(s.grid.every(v => v === 0)).toBe(true);
    expect(s.givenMask.every(v => v === false)).toBe(true);
  });
});

describe('legalMoves', () => {
  it('returns 729 moves for empty grid (81 × 9)', () => {
    const s = createInitialState();
    expect(legalMoves(s).length).toBe(729);
  });

  it('filters moves blocked by filled cells', () => {
    // Fill entire first row 1-9
    const grid = new Array(81).fill(0);
    for (let c = 0; c < 9; c++) grid[c] = c + 1;
    const s = makeState(grid);
    const moves = legalMoves(s);
    // Row 0 variables: none in row 0, each other cell excludes one digit per col
    // 72 cells * 9 = 648, minus some due to column conflicts
    expect(moves.length).toBeLessThan(729);
    // All moves should be for rows 1-8
    expect(moves.every(m => m.row > 0)).toBe(true);
  });

  it('returns moves with correct row/col/value', () => {
    const s = createInitialState();
    const moves = legalMoves(s);
    for (const m of moves) {
      expect(m.row).toBeGreaterThanOrEqual(0);
      expect(m.row).toBeLessThan(9);
      expect(m.col).toBeGreaterThanOrEqual(0);
      expect(m.col).toBeLessThan(9);
      expect(m.value).toBeGreaterThanOrEqual(1);
      expect(m.value).toBeLessThanOrEqual(9);
    }
  });

  it('excludes digits present in same row', () => {
    const grid = new Array(81).fill(0);
    grid[0] = 5; // (0,0) = 5
    const s = makeState(grid);
    const moves = legalMoves(s);
    const row0col1moves = moves.filter(m => m.row === 0 && m.col === 1);
    expect(row0col1moves.find(m => m.value === 5)).toBeUndefined();
  });

  it('excludes digits present in same column', () => {
    const grid = new Array(81).fill(0);
    grid[0] = 5; // (0,0) = 5
    const s = makeState(grid);
    const moves = legalMoves(s);
    const row1col0moves = moves.filter(m => m.row === 1 && m.col === 0);
    expect(row1col0moves.find(m => m.value === 5)).toBeUndefined();
  });

  it('excludes digits present in same 3×3 box', () => {
    const grid = new Array(81).fill(0);
    grid[0] = 5;
    const s = makeState(grid);
    const moves = legalMoves(s);
    const boxMoves = moves.filter(m => m.row <= 2 && m.col <= 2 && !(m.row === 0 && m.col === 0));
    expect(boxMoves.every(m => m.value !== 5)).toBe(true);
  });
});

describe('applyMove', () => {
  it('fills an empty cell', () => {
    const s = createInitialState();
    const next = applyMove(s, { row: 0, col: 0, value: 5 });
    expect(next.grid[0]).toBe(5);
    expect(s.grid[0]).toBe(0); // immutable
  });

  it('ignores move on given cell', () => {
    const s = makeState(
      new Array(81).fill(0).map((_, i) => i === 0 ? 5 : 0),
      new Array(81).fill(false).map((_, i) => i === 0)
    );
    const next = applyMove(s, { row: 0, col: 0, value: 3 });
    expect(next.grid[0]).toBe(5); // unchanged
  });

  it('allows erasing non-given cell (value=0)', () => {
    const s = createInitialState();
    const withVal = applyMove(s, { row: 0, col: 0, value: 5 });
    const erased = applyMove(withVal, { row: 0, col: 0, value: 0 });
    expect(erased.grid[0]).toBe(0);
  });
});

describe('isSolved', () => {
  it('false for empty grid', () => {
    expect(isSolved(createInitialState())).toBe(false);
  });

  it('false for partially filled grid', () => {
    const grid = new Array(81).fill(0);
    for (let i = 0; i < 40; i++) grid[i] = (i % 9) + 1;
    expect(isSolved(makeState(grid))).toBe(false);
  });

  it('true for complete valid grid', () => {
    // Use a known solved grid
    const s = makeState([
      5,3,4, 6,7,8, 9,1,2,
      6,7,2, 1,9,5, 3,4,8,
      1,9,8, 3,4,2, 5,6,7,
      8,5,9, 7,6,1, 4,2,3,
      4,2,6, 8,5,3, 7,9,1,
      7,1,3, 9,2,4, 8,5,6,
      9,6,1, 5,3,7, 2,8,4,
      2,8,7, 4,1,9, 6,3,5,
      3,4,5, 2,8,6, 1,7,9,
    ]);
    expect(isSolved(s)).toBe(true);
  });
});

describe('getDifficulty', () => {
  it('returns valid difficulty structure', () => {
    const d = getDifficulty(createInitialState());
    expect(d.score).toBe(100); // 0 clues = hardest
    expect(d.labelKey).toBe('difficulty.hard');
    expect(d.factors.clues).toBe(0);
  });
});

describe('solveSudokuState', () => {
  it('solves a known puzzle and returns valid Solution', () => {
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
    const s = makeState(easyPuzzle);
    const result = solveSudokuState(s);
    expect(result.solvable).toBe(true);
    expect(result.moves.length).toBeGreaterThan(0);
    for (const m of result.moves) {
      const sm = m as { row: number; col: number; value: number };
      expect(sm.row).toBeGreaterThanOrEqual(0);
      expect(sm.row).toBeLessThan(9);
      expect(sm.col).toBeGreaterThanOrEqual(0);
      expect(sm.col).toBeLessThan(9);
      expect(sm.value).toBeGreaterThanOrEqual(1);
      expect(sm.value).toBeLessThanOrEqual(9);
    }
    expect(result.stats.solverName).toBe('DLX (Algorithm X)');
    expect(result.trace?.type).toBe('constraint-propagation');
  });

  it('returns not solvable for impossible puzzle', () => {
    // Two 5's in row 0
    const impossible = new Array(81).fill(0);
    impossible[0] = 5;
    impossible[1] = 5;
    const s = makeState(impossible);
    const result = solveSudokuState(s);
    expect(result.solvable).toBe(false);
    expect(result.moves).toEqual([]);
  });
});
