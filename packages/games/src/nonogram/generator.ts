import type { Level, LevelConfig } from '@ludus/core';
import type { NonogramState } from './types';
import { createInitialState, computeClues, totalClueCount } from './rules';
import { countSolutions, solveNonogram, isFullyLineSolvable } from './solver';
import { computeNonogramDifficulty } from './difficulty';

/**
 * Simple seeded PRNG (mulberry32).
 */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Generate a random boolean pattern for a Nonogram puzzle.
 *
 * Uses a block-placement approach: place random rectangles of filled cells,
 * then add some random single cells for texture. Produces more interesting
 * visual patterns than pure random noise.
 */
function generatePattern(
  width: number,
  height: number,
  rng: () => number,
  densityRange: [number, number] = [0.4, 0.6],
): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < height; r++) {
    grid.push(new Array(width).fill(false));
  }

  const totalCells = width * height;
  const [dMin, dMax] = densityRange;
  const targetFill = dMin + rng() * (dMax - dMin);
  const targetFilled = Math.floor(totalCells * targetFill);

  // Place random rectangular blocks (smaller blocks for sparser patterns)
  let filled = 0;
  const maxBlockSize = dMax - dMin < 0.25 ? 2 : 4;
  const blockAttempts = Math.max(width * height / 3, 8);

  for (let i = 0; i < blockAttempts && filled < targetFilled; i++) {
    const bw = randInt(rng, 1, Math.min(maxBlockSize, width));
    const bh = randInt(rng, 1, Math.min(maxBlockSize, height));
    const br = randInt(rng, 0, height - bh);
    const bc = randInt(rng, 0, width - bw);

    for (let r = br; r < br + bh; r++) {
      for (let c = bc; c < bc + bw; c++) {
        if (!grid[r]![c]) {
          grid[r]![c] = true;
          filled++;
        }
      }
    }
  }

  // Add random single cells for texture (more for sparser patterns)
  const extraRatio = dMax - dMin < 0.25 ? 0.25 : 0.15;
  const extraCells = Math.floor(targetFilled * extraRatio);
  for (let i = 0; i < extraCells; i++) {
    const r = randInt(rng, 0, height - 1);
    const c = randInt(rng, 0, width - 1);
    if (!grid[r]![c]) {
      grid[r]![c] = true;
      filled++;
    }
  }

  return grid;
}

/**
 * Generate a Nonogram puzzle level.
 *
 * Algorithm:
 *   1. Determine grid size from difficulty range
 *   2. Generate a random filled pattern
 *   3. Compute row/col clues from the pattern
 *   4. Verify unique solution via countSolutions(2) === 1
 *   5. Compute difficulty → reject if outside requested range
 *   6. Fallback to classic 5×5 pattern after 100 attempts
 */
export function generateNonogramLevel(config: LevelConfig): Level {
  const [rangeLo, rangeHi] = config.difficultyRange ?? [1, 100];
  const seed = (config as any).seed ?? Date.now();
  const rng = mulberry32(seed);

  let width: number;
  let height: number;

  const targetScore = rangeLo + (rangeHi - rangeLo) * rng();

  if (targetScore <= 33) {
    // Easy: 5×5 — mostly line-solvable
    width = 5; height = 5;
  } else if (targetScore <= 66) {
    // Medium: 6×6 to 8×8 — some backtracking
    width = randInt(rng, 6, 8);
    height = randInt(rng, 6, 8);
  } else {
    // Hard: 8×8 to 10×10 — requires backtracking
    width = randInt(rng, 8, 10);
    height = randInt(rng, 8, 10);
  }

  let bestResult: {
    state: NonogramState;
    difficulty: ReturnType<typeof computeNonogramDifficulty>;
  } | null = null;
  let bestDistance = Infinity;

  const maxAttempts = 100;

  // Density ranges and backtracking requirements by difficulty
  const isEasy = targetScore <= 33;
  const isMedium = targetScore > 33 && targetScore <= 66;
  const isHard = targetScore > 66;

  const densityRange: [number, number] = isHard ? [0.25, 0.40] : isMedium ? [0.30, 0.45] : [0.40, 0.60];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a random pattern
    const pattern = generatePattern(width, height, rng, densityRange);
    const { rowClues, colClues } = computeClues(pattern);

    // Allow some empty/full rows but not too many
    const emptyRowCount = rowClues.filter(r => r.length === 0).length;
    const fullRowCount = rowClues.filter(r => r.length === 1 && r[0] === width).length;
    if (emptyRowCount + fullRowCount > Math.floor(height / 3)) continue;

    // Create initial state
    const state = createInitialState(width, height, rowClues, colClues, pattern);
    const totalCells = width * height;

    // Verify unique solution
    const solutionCount = countSolutions(state, 2);
    if (solutionCount !== 1) continue; // Not unique

    // Solve to get stats for difficulty
    const solveResult = solveNonogram(state);
    if (!solveResult.solvable) continue;

    const lineSolveCells = solveResult.stats.lineSolveCells;
    const maxBacktrackDepth = solveResult.stats.maxDepth;
    const clues = totalClueCount(rowClues, colClues);

    // Backtracking requirement: medium/hard should NOT be pure line-solving
    if (isHard && solveResult.stats.backtracks === 0) continue; // Hard: must backtrack
    if (isMedium && solveResult.stats.backtracks === 0) {
      // Medium: prefer backtracking, but accept if best so far
      // Skip pure line-solving for medium unless we haven't found anything better
    }

    const difficulty = computeNonogramDifficulty(
      width, height, lineSolveCells, totalCells, maxBacktrackDepth, clues,
    );

    // Update state with solver stats
    state.lineSolveCells = lineSolveCells;
    state.maxBacktrackDepth = maxBacktrackDepth;

    const actualScore = difficulty.score;

    // Check if score falls in requested range
    if (actualScore >= rangeLo && actualScore <= rangeHi) {
      return {
        schemaVersion: 1,
        gameId: 'nonogram',
        levelId: `nonogram-${width}x${height}-${seed}-${attempt}`,
        initialState: state,
        difficulty,
        optimalSteps: null,
        uniqueSolution: true,
        generatedBy: 'generateNonogramLevel',
        createdAt: new Date().toISOString(),
      };
    }

    // Track best candidate
    const distance = actualScore < rangeLo ? rangeLo - actualScore : actualScore - rangeHi;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestResult = { state, difficulty };
    }
  }

  // Fallback: return best candidate found
  if (bestResult) {
    return {
      schemaVersion: 1,
      gameId: 'nonogram',
      levelId: `nonogram-${width}x${height}-${seed}-best`,
      initialState: bestResult.state,
      difficulty: bestResult.difficulty,
      optimalSteps: null,
      uniqueSolution: true,
      generatedBy: 'generateNonogramLevel',
      createdAt: new Date().toISOString(),
    };
  }

  // Ultimate fallback: classic 5×5 heart pattern
  const heartPattern: boolean[][] = [
    [false, true, false, true, false],
    [true, true, true, true, true],
    [true, true, true, true, true],
    [false, true, true, true, false],
    [false, false, true, false, false],
  ];
  const { rowClues: hRow, colClues: hCol } = computeClues(heartPattern);
  const heartState = createInitialState(5, 5, hRow, hCol, heartPattern);
  const heartSolve = solveNonogram(heartState);

  return {
    schemaVersion: 1,
    gameId: 'nonogram',
    levelId: 'nonogram-5x5-heart',
    initialState: heartState,
    difficulty: computeNonogramDifficulty(
      5, 5,
      heartSolve.stats.lineSolveCells, 25,
      heartSolve.stats.maxDepth,
      totalClueCount(hRow, hCol),
    ),
    optimalSteps: null,
    uniqueSolution: true,
    generatedBy: 'generateNonogramLevel',
    createdAt: new Date().toISOString(),
  };
}
