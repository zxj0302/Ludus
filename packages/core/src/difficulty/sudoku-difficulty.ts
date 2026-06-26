import type { Difficulty } from '../types/plugin';

/** Standard Sudoku: min 17 clues, easy ~36 clues */
const MIN_CLUES = 17;
const MAX_CLUES = 36;

export function computeSudokuDifficulty(clues: number): Difficulty {
  const clamped = Math.max(MIN_CLUES, Math.min(MAX_CLUES, clues));
  const score = Math.round(((MAX_CLUES - clamped) / (MAX_CLUES - MIN_CLUES)) * 100);

  let labelKey: string;
  if (score <= 33) labelKey = 'difficulty.easy';
  else if (score <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score: Math.max(0, Math.min(100, score)),
    factors: {
      clues,
      emptyCells: 81 - clues,
    },
    labelKey,
  };
}
