import type { Difficulty } from '@ludus/core';
import { computeGrundyXor, isPPosition } from './solver';

export function computeGrundysDifficulty(piles: number[], firstPlayerIsN: boolean): Difficulty {
  const pileCount = piles.length;
  const maxHeap = Math.max(0, ...piles);
  const total = piles.reduce((a, b) => a + b, 0);

  const magnitude = Math.min(100, Math.round((total / 36) * 100));
  const pileBonus = Math.min(20, Math.max(0, (pileCount - 1) * 5));
  const heapBonus = Math.min(15, Math.max(0, maxHeap - 3) * 2);
  const pPenalty = isPPosition(piles) && !piles.every(n => n <= 2) ? 16 : 0;
  const secondPlayerNudge = firstPlayerIsN ? 0 : 8;

  const score = Math.max(0, Math.min(100, magnitude + pileBonus + heapBonus + pPenalty + secondPlayerNudge));

  let labelKey: string;
  if (score <= 33) labelKey = 'difficulty.easy';
  else if (score <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score,
    factors: {
      pileCount,
      maxHeap,
      total,
      xor: computeGrundyXor(piles),
      isP: isPPosition(piles) ? 1 : 0,
      firstPlayerIsN: firstPlayerIsN ? 1 : 0,
    },
    labelKey,
  };
}
