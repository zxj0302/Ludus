import type { Difficulty } from '@ludus/core';
import { CENTER_HOLE } from './geometry';
import { hasPeg, legalMoves, popcount } from './rules';
import type { PegGoal, PegSolitaireState } from './types';

const GOAL_BONUS: Record<PegGoal, number> = {
  le3: 0,
  'one-any': 15,
  'one-center': 25,
};

function labelKey(score: number): string {
  if (score <= 33) return 'difficulty.easy';
  if (score <= 66) return 'difficulty.medium';
  return 'difficulty.hard';
}

export function getDifficulty(state: PegSolitaireState): Difficulty {
  const pegCount = popcount(state.pegs);
  const moveCount = legalMoves(state).length;

  if (state.status === 'won') {
    return {
      score: 0,
      factors: {
        pegCount,
        legalMoves: moveCount,
        goalStrictness: GOAL_BONUS[state.goal],
        centerOccupied: hasPeg(state.pegs, CENTER_HOLE) ? 1 : 0,
      },
      labelKey: 'difficulty.easy',
    };
  }

  const pegLoad = Math.round((pegCount / 32) * 45);
  const mobilityPressure = Math.round((1 - Math.min(moveCount, 12) / 12) * 20);
  const centerBonus = state.goal === 'one-center' && !hasPeg(state.pegs, CENTER_HOLE) ? 5 : 0;
  const score = Math.max(0, Math.min(100, pegLoad + mobilityPressure + GOAL_BONUS[state.goal] + centerBonus));

  return {
    score,
    factors: {
      pegCount,
      legalMoves: moveCount,
      goalStrictness: GOAL_BONUS[state.goal],
      centerOccupied: hasPeg(state.pegs, CENTER_HOLE) ? 1 : 0,
    },
    labelKey: labelKey(score),
  };
}
