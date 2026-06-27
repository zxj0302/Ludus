import type { Level, LevelConfig } from '@ludus/core';
import { solveSudoku, countSudokuSolutions } from './solver';
import { computeSudokuDifficulty } from './difficulty';

/** Mapping from difficultyRange to target clue count */
function targetClues(range: [number, number]): number {
  const [lo, hi] = range;
  // lo=0 → 36 clues (very easy), hi=100 → 17 clues (very hard)
  const score = Math.random() * (hi - lo) + lo;
  const t = Math.round(36 - (score / 100) * 19);
  return Math.max(17, Math.min(36, t));
}

/**
 * Generate a complete valid Sudoku grid.
 * Strategy: randomly fill first row, then use DLX to complete.
 */
function generateCompleteGrid(): number[] {
  // Fill first row with random permutation of 1-9
  const firstRow = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = firstRow.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [firstRow[i], firstRow[j]] = [firstRow[j]!, firstRow[i]!];
  }

  const seedGrid = new Array(81).fill(0);
  for (let c = 0; c < 9; c++) {
    seedGrid[c] = firstRow[c]!;
  }

  const result = solveSudoku(seedGrid);
  if (!result.solvable || !result.grid) {
    // Fallback: try again (very unlikely to fail with random first row)
    return generateCompleteGrid();
  }
  return result.grid;
}

/** Fisher-Yates shuffle of array indices */
function shuffledIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function generateSudokuLevel(config: LevelConfig): Level {
  const clues = targetClues(config.difficultyRange);
  const maxRemovals = 81 - clues;

  // Step 1: Generate complete grid
  const fullGrid = generateCompleteGrid();

  // Step 2: Remove cells while maintaining unique solution
  const puzzle = [...fullGrid];
  const removals = shuffledIndices(81);
  let removed = 0;

  for (const idx of removals) {
    if (removed >= maxRemovals) break;
    const saved = puzzle[idx]!;
    puzzle[idx] = 0;

    const solutions = countSudokuSolutions(puzzle, 2);
    if (solutions === 1) {
      removed++;
    } else {
      // Restore — more than one solution
      puzzle[idx] = saved;
    }
  }

  // Build givenMask
  const givenMask = puzzle.map(v => v !== 0);

  const difficulty = computeSudokuDifficulty(81 - countEmpty(puzzle));

  return {
    schemaVersion: 1,
    gameId: 'sudoku',
    levelId: `sudoku-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initialState: {
      n: 9,
      grid: puzzle,
      givenMask,
    },
    difficulty,
    optimalSteps: null, // DLX doesn't produce step count
    uniqueSolution: true,
    generatedBy: 'dig-with-dlx',
    createdAt: new Date().toISOString(),
  };
}

function countEmpty(grid: number[]): number {
  return grid.filter(v => v === 0).length;
}
