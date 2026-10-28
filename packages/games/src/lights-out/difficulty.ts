import type { Difficulty } from '@ludus/core';
import type { LightsOutState } from './types';
import { buildLightsOutMatrix, solveGF2, optimalSolution, hammingWeight } from './solver';

/**
 * Compute Lights Out difficulty from a game state.
 * Single source of truth — used by both `getDifficulty` (rules) and generator.
 *
 * Formula: size × 20% + optimalSteps × 80% (+ non-unique penalty)
 * Non-unique puzzles get a penalty (+10) since multiple solutions
 * make the puzzle harder to reason about.
 */
export function getDifficulty(state: LightsOutState): Difficulty {
  const A = buildLightsOutMatrix(state.n);
  const sol = solveGF2(A, state.grid);
  const optimal = optimalSolution(sol);
  const optimalSteps = optimal ? hammingWeight(optimal) : null;

  if (optimalSteps === 0) {
    return { score: 0, factors: { size: state.n, optimalSteps: 0, nullity: sol.nullity }, labelKey: 'difficulty.easy' };
  }

  // Size factor: 3×3 = 0, 10×10 = 1
  const sizeFactor = Math.max(0, (state.n - 3) / 7);
  // Move factor scaled to board capacity so a 5×5 board can span Easy / Medium / Hard
  const maxExpectedMoves = Math.max(5, Math.round(state.n * state.n * 0.6));
  const moveFactor = optimalSteps != null ? Math.min(optimalSteps / maxExpectedMoves, 1) : 0.5;
  // Non-unique penalty: harder puzzles when multiple solutions exist
  const nonUniquePenalty = sol.nullity > 0 ? 10 : 0;

  const score = Math.round(sizeFactor * 20 + moveFactor * 80 + nonUniquePenalty);
  const clamped = Math.max(0, Math.min(100, score));

  const labelKey = clamped <= 33 ? 'difficulty.easy'
    : clamped <= 66 ? 'difficulty.medium'
    : 'difficulty.hard';

  return {
    score: clamped,
    factors: {
      size: state.n,
      optimalSteps: optimalSteps ?? -1,
      nullity: sol.nullity,
    },
    labelKey,
  };
}
