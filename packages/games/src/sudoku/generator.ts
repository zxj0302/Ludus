import type { Level, LevelConfig } from '@ludus/core';
import { solveSudoku, countSudokuSolutions } from './solver';
import { computeSudokuDifficulty } from './difficulty';
import { mulberry32, resolveSeed } from '../generator-config';

const EXACT_CLUE_TEMPLATE_17 = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';

function createRng(config: LevelConfig): () => number {
  if (config.seed != null) return mulberry32(config.seed);
  return Math.random;
}

/** Mapping from difficultyRange to target clue count */
function targetClues(range: [number, number], explicitClues: unknown, rng: () => number): number {
  if (typeof explicitClues === 'number' && Number.isFinite(explicitClues)) {
    return Math.max(17, Math.min(36, Math.round(explicitClues)));
  }

  const [lo, hi] = range;
  const score = rng() * (hi - lo) + lo;
  const t = Math.round(36 - (score / 100) * 19);
  return Math.max(17, Math.min(36, t));
}

function generateCompleteGrid(rng: () => number): number[] {
  const firstRow = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = firstRow.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [firstRow[i], firstRow[j]] = [firstRow[j]!, firstRow[i]!];
  }

  const seedGrid = new Array(81).fill(0);
  for (let c = 0; c < 9; c++) {
    seedGrid[c] = firstRow[c]!;
  }

  const result = solveSudoku(seedGrid);
  if (!result.solvable || !result.grid) {
    return generateCompleteGrid(rng);
  }
  return result.grid;
}

function shuffledIndices(n: number, rng: () => number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function shuffledValues<T>(values: T[], rng: () => number): T[] {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function swapWithinGroups(groups: number[][], rng: () => number): number[] {
  return shuffledValues(groups, rng).flatMap(group => shuffledValues(group, rng));
}

function transformSudokuGrid(grid: number[], rng: () => number): number[] {
  const digitMap = new Map<number, number>();
  shuffledValues([1, 2, 3, 4, 5, 6, 7, 8, 9], rng).forEach((value, idx) => {
    digitMap.set(idx + 1, value);
  });

  const rowMap = swapWithinGroups([[0, 1, 2], [3, 4, 5], [6, 7, 8]], rng);
  const colMap = swapWithinGroups([[0, 1, 2], [3, 4, 5], [6, 7, 8]], rng);
  const transpose = rng() < 0.5;
  const transformed = new Array(81).fill(0);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const sourceRow = rowMap[r]!;
      const sourceCol = colMap[c]!;
      const sourceIdx = transpose ? sourceCol * 9 + sourceRow : sourceRow * 9 + sourceCol;
      const value = grid[sourceIdx]!;
      transformed[r * 9 + c] = value === 0 ? 0 : digitMap.get(value)!;
    }
  }

  return transformed;
}

function exactCluePuzzleFromTemplate(clues: number, rng: () => number): number[] {
  const template = EXACT_CLUE_TEMPLATE_17.split('').map(ch => Number(ch));
  const transformedTemplate = transformSudokuGrid(template, rng);
  const solved = solveSudoku(transformedTemplate);
  if (!solved.solvable || !solved.grid) {
    throw new Error('Exact Sudoku template is invalid');
  }

  const puzzle = [...transformedTemplate];
  const extraCluesNeeded = clues - countClues(puzzle);
  if (extraCluesNeeded <= 0) return puzzle;

  let added = 0;
  const emptyIndices = shuffledValues(
    puzzle.map((value, idx) => value === 0 ? idx : -1).filter(idx => idx >= 0),
    rng,
  );

  for (const idx of emptyIndices) {
    if (added >= extraCluesNeeded) break;
    puzzle[idx] = solved.grid[idx]!;
    added++;
  }

  return puzzle;
}

function digPuzzle(fullGrid: number[], clues: number, rng: () => number): number[] {
  const maxRemovals = 81 - clues;
  const puzzle = [...fullGrid];
  const removals = shuffledIndices(81, rng);
  let removed = 0;

  for (const idx of removals) {
    if (removed >= maxRemovals) break;
    const saved = puzzle[idx]!;
    puzzle[idx] = 0;

    const solutions = countSudokuSolutions(puzzle, 2);
    if (solutions === 1) {
      removed++;
    } else {
      puzzle[idx] = saved;
    }
  }

  return puzzle;
}

function countClues(grid: number[]): number {
  return grid.filter(v => v !== 0).length;
}

export function generateSudokuLevel(config: LevelConfig): Level {
  const rng = createRng(config);
  const seed = resolveSeed(config);
  const hasExplicitClues = typeof config.gameParams?.clues === 'number' && Number.isFinite(config.gameParams.clues);
  const clues = targetClues(config.difficultyRange, config.gameParams?.clues, rng);

  let puzzle: number[] | null = null;
  let bestPuzzle: number[] | null = null;
  let bestDistance = Infinity;
  const maxAttempts = hasExplicitClues ? 40 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const fullGrid = generateCompleteGrid(rng);
    const candidate = digPuzzle(fullGrid, clues, rng);
    const candidateClues = countClues(candidate);
    const distance = Math.abs(candidateClues - clues);

    if (candidateClues === clues) {
      puzzle = candidate;
      break;
    }

    if (distance < bestDistance) {
      bestDistance = distance;
      bestPuzzle = candidate;
    }
  }

  if (!puzzle) {
    if (hasExplicitClues) {
      puzzle = exactCluePuzzleFromTemplate(clues, rng);
    } else {
      puzzle = bestPuzzle ?? digPuzzle(generateCompleteGrid(rng), clues, rng);
    }
  }

  const givenMask = puzzle.map(v => v !== 0);
  const difficulty = computeSudokuDifficulty(countClues(puzzle));

  return {
    schemaVersion: 1,
    gameId: 'sudoku',
    levelId: config.seed != null ? `sudoku-${seed}` : `sudoku-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initialState: {
      n: 9,
      grid: puzzle,
      givenMask,
    },
    difficulty,
    optimalSteps: null,
    uniqueSolution: true,
    generatedBy: 'dig-with-dlx',
    createdAt: new Date().toISOString(),
  };
}
