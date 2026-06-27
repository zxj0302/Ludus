import type { Difficulty } from '@ludus/core';
import type { LightsOutState } from './types';
import { buildLightsOutMatrix, solveGF2, optimalSolution, hammingWeight } from './solver';

export function getDifficulty(state: LightsOutState): Difficulty {
  const A = buildLightsOutMatrix(state.n);
  const sol = solveGF2(A, state.grid);
  const optimal = optimalSolution(sol);
  const optimalSteps = optimal ? hammingWeight(optimal) : null;

  if (optimalSteps === 0) {
    return { score: 0, factors: { size: state.n, optimalSteps: 0, nullity: sol.nullity }, labelKey: 'difficulty.easy' };
  }

  const moveFactor = optimalSteps != null ? Math.min(optimalSteps / 30, 1) : 0.5;
  const sizeFactor = (state.n - 3) / 7;
  const uniqueBonus = sol.nullity === 0 ? 0 : 5;

  const score = Math.round(sizeFactor * 25 + moveFactor * 50 + (1 - uniqueBonus / 100) * 25);
  const clamped = Math.max(0, Math.min(100, score));

  const labelKey = clamped <= 20 ? 'difficulty.easy'
    : clamped <= 50 ? 'difficulty.medium'
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
