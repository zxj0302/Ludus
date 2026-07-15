import type { Difficulty } from '@ludus/core';
import { computeKaylesGrundy } from './solver';

/** Difficulty from opening chain length (Hub n ≤ 12; openings are always N for n=1..12). */
export function computeKaylesDifficulty(n: number): Difficulty {
  const score = Math.max(0, Math.min(100, Math.round(((n - 3) / 9) * 100)));
  let labelKey: string;
  if (score <= 33) labelKey = 'difficulty.easy';
  else if (score <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score,
    factors: {
      n,
      g: computeKaylesGrundy(n),
    },
    labelKey,
  };
}
