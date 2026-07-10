import { describe, it, expect } from 'vitest';
import { generateSudokuLevel } from './generator';
import { validateSudoku, countSudokuSolutions } from './solver';

describe('generateSudokuLevel', () => {
  it('generates a valid puzzle with unique solution', () => {
    const level = generateSudokuLevel({
      difficultyRange: [20, 40],
    });
    expect(level.gameId).toBe('sudoku');
    expect(level.uniqueSolution).toBe(true);
    expect(validateSudoku(level.initialState.grid as number[])).toBe(true);
    expect(countSudokuSolutions(level.initialState.grid as number[], 2)).toBe(1);
  });

  it('generates puzzle with expected clue range', () => {
    const level = generateSudokuLevel({
      difficultyRange: [30, 70],
    });
    const clues = (level.initialState.grid as number[]).filter(v => v !== 0).length;
    expect(clues).toBeGreaterThanOrEqual(17);
    expect(clues).toBeLessThanOrEqual(36);
  });

  it('accepts a clue target from gameParams', () => {
    const level = generateSudokuLevel({
      difficultyRange: [30, 70],
      gameParams: {
        clues: 36,
      },
    });
    const clues = (level.initialState.grid as number[]).filter(v => v !== 0).length;

    expect(clues).toBeGreaterThanOrEqual(36);
    expect(countSudokuSolutions(level.initialState.grid as number[], 2)).toBe(1);
  });

  it('honors an explicit clue target exactly when generating advanced levels', () => {
    const level = generateSudokuLevel({
      difficultyRange: [30, 70],
      gameParams: {
        clues: 20,
      },
    });
    const grid = level.initialState.grid as number[];
    const clues = grid.filter(v => v !== 0).length;
    const emptyCells = grid.filter(v => v === 0).length;

    expect(clues).toBe(20);
    expect(emptyCells).toBe(61);
    expect(countSudokuSolutions(grid, 2)).toBe(1);
  });

  it('produces valid givenMask', () => {
    const level = generateSudokuLevel({ difficultyRange: [0, 50] });
    const grid = level.initialState.grid as number[];
    const mask = level.initialState.givenMask as boolean[];
    expect(mask.length).toBe(81);
    for (let i = 0; i < 81; i++) {
      expect(mask[i]!).toBe(grid[i] !== 0);
    }
  });

  it('generates different puzzles on subsequent calls', () => {
    const a = generateSudokuLevel({ difficultyRange: [30, 50] });
    const b = generateSudokuLevel({ difficultyRange: [30, 50] });
    const gridA = JSON.stringify(a.initialState.grid);
    const gridB = JSON.stringify(b.initialState.grid);
    expect(gridA).not.toBe(gridB);
  });

  it('respects seed for reproducible generation', () => {
    const config = { difficultyRange: [30, 50] as [number, number], seed: 4242 };
    const level1 = generateSudokuLevel(config);
    const level2 = generateSudokuLevel(config);
    expect(JSON.stringify(level1.initialState.grid)).toBe(JSON.stringify(level2.initialState.grid));
    expect(level1.levelId).toBe('sudoku-4242');
    expect(level2.levelId).toBe('sudoku-4242');
  });

  it('generates easy puzzle with many clues', () => {
    const level = generateSudokuLevel({ difficultyRange: [0, 10] });
    const clues = (level.initialState.grid as number[]).filter(v => v !== 0).length;
    expect(clues).toBeGreaterThanOrEqual(30);
  });
});
