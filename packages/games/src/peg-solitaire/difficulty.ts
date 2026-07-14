import type { Difficulty } from '@ludus/core';
import { CENTER_HOLE } from './geometry';
import { hasPeg, legalMoves, popcount } from './rules';
import type { PegGoal, PegSolitaireState } from './types';

const GOAL_BONUS: Record<PegGoal, number> = {
  'one-any': 28,
  'one-center': 55,
};

function labelKey(score: number): string {
  if (score <= 33) return 'difficulty.easy';
  if (score <= 66) return 'difficulty.medium';
  return 'difficulty.hard';
}

/** Spec §6: goal strictness + peg load + known solution length. */
export function getDifficulty(
  state: PegSolitaireState,
  knownSolutionLength: number | null = null,
): Difficulty {
  const pegCount = popcount(state.pegs);
  const moveCount = legalMoves(state).length;
  const lengthBonus = knownSolutionLength == null
    ? 0
    : Math.min(20, Math.round(knownSolutionLength * 1.5));

  const pegLoad = Math.round((pegCount / 32) * 25);
  const mobilityPressure = Math.round((1 - Math.min(moveCount, 12) / 12) * 10);
  const centerBonus = state.goal === 'one-center' && !hasPeg(state.pegs, CENTER_HOLE) ? 5 : 0;
  const score = Math.max(
    0,
    Math.min(100, GOAL_BONUS[state.goal] + pegLoad + mobilityPressure + lengthBonus + centerBonus),
  );

  return {
    score,
    factors: {
      pegCount,
      legalMoves: moveCount,
      goalStrictness: GOAL_BONUS[state.goal],
      knownSolutionLength: knownSolutionLength ?? 0,
      centerOccupied: hasPeg(state.pegs, CENTER_HOLE) ? 1 : 0,
    },
    labelKey: labelKey(score),
  };
}
