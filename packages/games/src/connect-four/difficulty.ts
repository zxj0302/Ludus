import type { Difficulty } from '@ludus/core';
import type { ConnectFourState } from './types';
import { countPieces } from './board';
import { COLS, ROWS } from './types';

/** Map toolbar difficulty score (0–100) to AI Alpha-Beta depth. */
export function scoreToAiMaxDepth(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped <= 33) return 4;
  if (clamped <= 66) return 6;
  return 9;
}

export function maxDepthToTimeMs(maxDepth: number): number {
  if (maxDepth <= 4) return 600;
  if (maxDepth <= 6) return 1_200;
  return 2_500;
}

export function resolveConnectFourAiOptions(state: ConnectFourState): { maxDepth: number; timeMs: number } {
  const maxDepth = state.aiMaxDepth ?? scoreToAiMaxDepth(50);
  return { maxDepth, timeMs: maxDepthToTimeMs(maxDepth) };
}

export function computeConnectFourDifficulty(state: ConnectFourState): Difficulty {
  const pieces = countPieces(state.board);
  const fillRatio = pieces / (ROWS * COLS);
  const midgame = pieces >= 8 && pieces <= 30;
  const score = Math.round(fillRatio * 55 + (midgame ? 25 : 0));
  const clamped = Math.max(0, Math.min(100, score));

  let labelKey: string;
  if (clamped <= 33) labelKey = 'difficulty.easy';
  else if (clamped <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score: clamped,
    factors: { pieces, fillRatio },
    labelKey,
  };
}
