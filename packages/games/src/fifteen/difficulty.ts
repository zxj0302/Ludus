import type { Difficulty } from '@ludus/core';

export function computeFifteenDifficulty(scrambleDepth: number): Difficulty {
  const score = Math.min(100, Math.round((scrambleDepth / 80) * 100));

  let labelKey: string;
  if (score <= 33) labelKey = 'difficulty.easy';
  else if (score <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score,
    factors: { scrambleDepth },
    labelKey,
  };
}
