import type { Level, LevelConfig } from '@ludus/core';
import { mulberry32, resolveSeed } from '../generator-config';
import { computeWythoffDifficulty } from './difficulty';

const MAX_STONE = 10;

function stoneBoundsForRange(range: [number, number] | undefined, rng: () => number): [number, number] {
  if (!range) return [1, MAX_STONE];
  const [lo, hi] = range;
  const targetScore = lo + rng() * (hi - lo);
  if (targetScore <= 33) return [1, 3];
  if (targetScore <= 66) return [4, 6];
  return [7, MAX_STONE];
}

export function generateWythoffLevel(config?: LevelConfig): Level {
  const seed = resolveSeed(config);
  const rng = mulberry32(seed);
  const [minStone, maxStoneBound] = stoneBoundsForRange(config?.difficultyRange, rng);
  const larger = minStone + Math.floor(rng() * (maxStoneBound - minStone + 1));
  const other = 1 + Math.floor(rng() * larger);
  const swap = rng() < 0.5;
  const a = swap ? other : larger;
  const b = swap ? larger : other;
  const maxStone = Math.max(a, b);
  const difficulty = computeWythoffDifficulty(maxStone);

  return {
    schemaVersion: 1,
    gameId: 'wythoff',
    levelId: `wythoff-${seed}-${a}-${b}`,
    initialState: {
      piles: [a, b],
      currentPlayer: 0,
      initialPiles: [a, b],
      phase: 'choosing',
    } as unknown as Record<string, unknown>,
    difficulty,
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'random-piles',
    createdAt: new Date().toISOString(),
  };
}
