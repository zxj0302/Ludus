import type { Difficulty } from '@ludus/core';
import type { EuclidPiles } from './types';
import { isPPosition } from './solver';

export function computeEuclidsDifficulty(piles: EuclidPiles, firstPlayerIsN: boolean): Difficulty {
  const [larger, smaller] = piles;
  const magnitude = Math.min(100, Math.round(((larger + smaller) / 30) * 100));
  const pPenalty = isPPosition(piles) ? 18 : 0;
  const nBonus = firstPlayerIsN ? 0 : 8;
  const score = Math.max(0, Math.min(100, magnitude + pPenalty + nBonus));

  let labelKey: string;
  if (score <= 33) labelKey = 'difficulty.easy';
  else if (score <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score,
    factors: {
      larger,
      smaller,
      isP: isPPosition(piles) ? 1 : 0,
      firstPlayerIsN: firstPlayerIsN ? 1 : 0,
    },
    labelKey,
  };
}
