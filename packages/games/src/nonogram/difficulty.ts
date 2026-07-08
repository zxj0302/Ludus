import type { Difficulty } from '@ludus/core';

/**
 * Compute Nonogram difficulty using a four-factor decomposition.
 *
 * Factors:
 *   1. Grid size (0–40): larger grids → more cells → harder
 *   2. Line-solve ratio (0–30): fewer cells from line-solving → more backtracking needed → harder
 *   3. Max backtrack depth (0–20): deeper search → harder
 *   4. Clue density (0–10): fewer clues per row/col → harder to deduce
 *
 * @param width           — grid width
 * @param height          — grid height
 * @param lineSolveCells  — cells determined purely by line solving (before any backtracking)
 * @param totalCells       — width × height
 * @param maxBacktrackDepth — deepest recursion during backtracking
 * @param totalClues       — total number of clue numbers across all rows and columns
 */
export function computeNonogramDifficulty(
  width: number,
  height: number,
  lineSolveCells: number,
  totalCells: number,
  maxBacktrackDepth: number,
  totalClues: number,
): Difficulty {
  // 1. Grid size score: 0–40
  // 5×5=25 → 0, 20×20=400 → 40
  const sizeScore = Math.max(0, Math.round((Math.min(totalCells, 400) - 25) / (400 - 25) * 40));

  // 2. Line-solve ratio score: 0–30
  // lineSolveRatio = 1 means line solver determined all cells (easy)
  // lineSolveRatio = 0 means line solver determined nothing (requires lots of backtracking)
  const lineSolveRatio = totalCells > 0 ? lineSolveCells / totalCells : 0;
  const lineSolveScore = Math.round((1 - lineSolveRatio) * 30);

  // 3. Max backtrack depth: 0–20
  const depthScore = Math.round(Math.min(maxBacktrackDepth / 20, 1) * 20);

  // 4. Clue density: 0–10
  // max theoretical clues: 2*(width+height) (one clue per row + one per col = minimal info)
  // Typical maximum: width/2 clues per row + height/2 clues per col
  // Fewer total clues = harder (less information)
  const maxClues = (width + height) * 2; // rough upper bound
  const clueRatio = maxClues > 0 ? Math.min(totalClues / maxClues, 1) : 0;
  const clueScore = Math.round((1 - clueRatio) * 10);

  const score = Math.min(sizeScore + lineSolveScore + depthScore + clueScore, 100);

  let labelKey: string;
  if (score <= 33) labelKey = 'difficulty.easy';
  else if (score <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score,
    factors: {
      width,
      height,
      totalCells,
      lineSolveCells,
      lineSolveRatio: Math.round(lineSolveRatio * 100) / 100,
      maxBacktrackDepth,
      totalClues,
      sizeScore,
      lineSolveScore,
      depthScore,
      clueScore,
    },
    labelKey,
  };
}
