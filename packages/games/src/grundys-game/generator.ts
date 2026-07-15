import type { Level, LevelConfig } from '@ludus/core';
import { mulberry32, resolveSeed } from '../generator-config';
import { computeGrundysDifficulty } from './difficulty';
import { createInitialState } from './rules';
import { computeGrundyXor, isPPosition } from './solver';
import type { GrundysGameState } from './types';

const MAX_HEAP = 24;

function preferPPosition(range: [number, number]): boolean {
  const mid = (range[0] + range[1]) / 2;
  return mid > 66;
}

function samplePiles(range: [number, number], rng: () => number): number[] {
  const mid = (range[0] + range[1]) / 2;
  const pileCount = mid <= 33 ? 2 : mid <= 66 ? 2 + Math.floor(rng() * 2) : 3 + Math.floor(rng() * 2); // 2 / 2–3 / 3–4
  const minHeap = 3;
  const maxHeap = mid <= 33 ? 8 : mid <= 66 ? 14 : MAX_HEAP;

  const piles: number[] = [];
  for (let i = 0; i < pileCount; i += 1) {
    const span = maxHeap - minHeap + 1;
    piles.push(minHeap + Math.floor(rng() * span));
  }
  // Guarantee at least one splittable heap (already ≥3 by construction).
  return piles;
}

export function generateGrundysGameLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const range = config.difficultyRange ?? [1, 100];
  const rng = mulberry32(seed);
  const wantP = preferPPosition(range);

  let piles = samplePiles(range, rng);
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const isP = isPPosition(piles);
    // Skip pure terminals (all ≤2) — should not happen with minHeap=3
    if (piles.every(n => n <= 2)) {
      piles = samplePiles(range, rng);
      continue;
    }
    if (isP === wantP || attempt === 31) break;
    piles = samplePiles(range, rng);
  }

  const firstPlayerIsN = computeGrundyXor(piles) !== 0;
  const difficulty = computeGrundysDifficulty(piles, firstPlayerIsN);
  const state: GrundysGameState = {
    ...createInitialState(),
    piles,
    initialPiles: [...piles],
  };

  return {
    schemaVersion: 1,
    gameId: 'grundys-game',
    levelId: `grundys-game-${seed}`,
    initialState: state as unknown as Record<string, unknown>,
    difficulty,
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: wantP ? 'p-position-bias' : 'n-position-bias',
    createdAt: new Date().toISOString(),
  };
}
