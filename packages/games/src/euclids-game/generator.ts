import type { Level, LevelConfig } from '@ludus/core';
import { mulberry32, resolveSeed } from '../generator-config';
import { createInitialState, normalizePiles } from './rules';
import type { EuclidPiles, EuclidsGameState } from './types';
import { computeEuclidsDifficulty } from './difficulty';
import { isPPosition } from './solver';

function samplePiles(range: [number, number], rng: () => number): EuclidPiles {
  const mid = (range[0] + range[1]) / 2;
  const minSmaller = mid <= 33 ? 2 : 3;
  const maxSmaller = mid <= 33 ? 6 : mid <= 66 ? 10 : 14;
  const smaller = minSmaller + Math.floor(rng() * (maxSmaller - minSmaller + 1));
  const span = mid <= 33 ? 4 : mid <= 66 ? 7 : 11;
  const larger = smaller + 1 + Math.floor(rng() * span);
  return normalizePiles(larger, smaller);
}

/** Easy favors N-positions (first player can win); hard favors P-positions. */
function preferPPosition(range: [number, number]): boolean {
  const mid = (range[0] + range[1]) / 2;
  return mid > 66;
}

export function generateEuclidsGameLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const range = config.difficultyRange ?? [1, 100];
  const rng = mulberry32(seed);
  const wantP = preferPPosition(range);

  let piles = samplePiles(range, rng);
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const isP = isPPosition(piles);
    if (isP === wantP || attempt === 23) break;
    piles = samplePiles(range, rng);
  }

  const firstPlayerIsN = !isPPosition(piles);
  const difficulty = computeEuclidsDifficulty(piles, firstPlayerIsN);
  const state: EuclidsGameState = {
    ...createInitialState(),
    piles,
    initialPiles: piles,
  };

  return {
    schemaVersion: 1,
    gameId: 'euclids-game',
    levelId: `euclids-game-${seed}`,
    initialState: state as unknown as Record<string, unknown>,
    difficulty,
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: wantP ? 'p-position-bias' : 'n-position-bias',
    createdAt: new Date().toISOString(),
  };
}
