import type { Difficulty } from '../types/plugin';

export function computeNimDifficulty(pileCount: number, maxStones: number): Difficulty {
  const pileFactor = Math.min(1, Math.max(0, (pileCount - 2) / 3));    // 2→0, 5→1
  const stoneFactor = Math.min(1, Math.max(0, (maxStones - 3) / 9));   // 3→0, 12→1
  const score = Math.round((pileFactor * 0.5 + stoneFactor * 0.5) * 100);
  const clamped = Math.max(0, Math.min(100, score));

  let labelKey: string;
  if (clamped <= 33) labelKey = 'difficulty.easy';
  else if (clamped <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score: clamped,
    factors: { pileCount, maxStones },
    labelKey,
  };
}
