import { describe, it, expect } from 'vitest';
import { generateSudokuLevel } from './sudoku-generator';
import { validateSudoku, countSudokuSolutions } from '../solver/dlx-sudoku';

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

  it('generates easy puzzle with many clues', () => {
    const level = generateSudokuLevel({ difficultyRange: [0, 10] });
    const clues = (level.initialState.grid as number[]).filter(v => v !== 0).length;
    expect(clues).toBeGreaterThanOrEqual(30);
  });
});
