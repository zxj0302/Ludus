import type { Difficulty } from '@ludus/core';

const MAX_STONE = 10;

export function computeWythoffDifficulty(maxStone: number): Difficulty {
  const stoneFactor = Math.min(1, Math.max(0, maxStone / MAX_STONE));
  const score = Math.round(stoneFactor * 100);
  const clamped = Math.max(0, Math.min(100, score));

  let labelKey: string;
  if (clamped <= 33) labelKey = 'difficulty.easy';
  else if (clamped <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score: clamped,
    factors: { maxStone },
    labelKey,
  };
}
