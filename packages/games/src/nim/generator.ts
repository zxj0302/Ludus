import type { Level, LevelConfig } from '@ludus/core';
import { mulberry32, resolveSeed } from '../generator-config';
import { computeNimDifficulty } from './difficulty';

function mapRangeToPileCount(range: [number, number], rng: () => number): number {
  const mid = (range[0] + range[1]) / 2;
  if (mid <= 20) return 2;
  if (mid <= 50) return 2 + Math.floor(rng() * 2); // 2-3
  if (mid <= 80) return 3 + Math.floor(rng() * 2); // 3-4
  return 4 + Math.floor(rng() * 2); // 4-5
}

function mapRangeToMaxStone(range: [number, number], rng: () => number): number {
  const mid = (range[0] + range[1]) / 2;
  if (mid <= 33) return 3 + Math.floor(rng() * 3);   // 3-5
  if (mid <= 66) return 5 + Math.floor(rng() * 4);   // 5-8
  return 8 + Math.floor(rng() * 5);                   // 8-12
}

function generateRandomPiles(pileCount: number, maxStone: number, rng: () => number): number[] {
  const piles: number[] = [];
  for (let i = 0; i < pileCount; i++) {
    piles.push(1 + Math.floor(rng() * maxStone));
  }
  return piles;
}

export type NimPreset = 'easy' | 'medium' | 'hard';

const PRESETS: Record<NimPreset, { pileCount: [number, number]; maxStone: [number, number] }> = {
  easy:   { pileCount: [2, 3], maxStone: [3, 5] },
  medium: { pileCount: [4, 5], maxStone: [4, 8] },
  hard:   { pileCount: [6, 6], maxStone: [5, 10] },
};

export function generateNimLevelByPreset(preset: NimPreset, seed?: number): Level {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 0x7fffffff);
  const rng = mulberry32(resolvedSeed);
  const pc = PRESETS[preset];
  const pileCount = pc.pileCount[0] + Math.floor(rng() * (pc.pileCount[1] - pc.pileCount[0] + 1));
  const maxStone = pc.maxStone[0] + Math.floor(rng() * (pc.maxStone[1] - pc.maxStone[0] + 1));
  return buildNimLevel(pileCount, maxStone, rng, resolvedSeed);
}

export function generateNimLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const rng = mulberry32(seed);
  // Support gameParams.preset for explicit difficulty selection
  const preset = config.gameParams?.preset as NimPreset | undefined;
  if (preset && PRESETS[preset]) return generateNimLevelByPreset(preset, seed);

  const pileCount = mapRangeToPileCount(config.difficultyRange, rng);
  const maxStone = mapRangeToMaxStone(config.difficultyRange, rng);
  return buildNimLevel(pileCount, maxStone, rng, seed);
}

function buildNimLevel(pileCount: number, maxStone: number, rng: () => number, seed: number): Level {
  const piles = generateRandomPiles(pileCount, maxStone, rng);
  const difficulty = computeNimDifficulty(pileCount, Math.max(...piles));

  return {
    schemaVersion: 1,
    gameId: 'nim',
    levelId: `nim-${seed}-${piles.join('-')}`,
    initialState: {
      piles,
      currentPlayer: 0,
      initialPiles: [...piles],
      phase: 'choosing',
    } as unknown as Record<string, unknown>,
    difficulty,
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'random-piles',
    createdAt: new Date().toISOString(),
  };
}
