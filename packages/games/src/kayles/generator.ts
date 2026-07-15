import type { Level, LevelConfig } from '@ludus/core';
import { mulberry32, resolveSeed } from '../generator-config';
import { computeKaylesDifficulty } from './difficulty';
import { createInitialState } from './rules';
import type { KaylesState } from './types';

const MAX_N = 12;

function sampleLength(range: [number, number], rng: () => number): number {
  const mid = (range[0] + range[1]) / 2;
  // easy 4–6, medium 7–9, hard 10–12
  const minN = mid <= 33 ? 4 : mid <= 66 ? 7 : 10;
  const maxN = mid <= 33 ? 6 : mid <= 66 ? 9 : MAX_N;
  const span = maxN - minN + 1;
  return minN + Math.floor(rng() * span);
}

export function generateKaylesLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const range = config.difficultyRange ?? [1, 100];
  const rng = mulberry32(seed);
  const n = sampleLength(range, rng);

  const state: KaylesState = {
    ...createInitialState(),
    alive: Array.from({ length: n }, () => true),
    initialLength: n,
  };

  return {
    schemaVersion: 1,
    gameId: 'kayles',
    levelId: `kayles-${seed}`,
    initialState: state as unknown as Record<string, unknown>,
    difficulty: computeKaylesDifficulty(n),
    optimalSteps: null,
    uniqueSolution: false,
    // Hub single-chain openings with n≤12 are always N (A002186); length is the difficulty lever.
    generatedBy: 'chain-length',
    createdAt: new Date().toISOString(),
  };
}
