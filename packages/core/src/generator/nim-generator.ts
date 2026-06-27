import type { Level, LevelConfig } from '../types/plugin';
import { computeNimDifficulty } from '../difficulty/nim-difficulty';

function mapRangeToPileCount(range: [number, number]): number {
  const mid = (range[0] + range[1]) / 2;
  if (mid <= 20) return 2;
  if (mid <= 50) return 2 + Math.floor(Math.random() * 2); // 2-3
  if (mid <= 80) return 3 + Math.floor(Math.random() * 2); // 3-4
  return 4 + Math.floor(Math.random() * 2); // 4-5
}

function mapRangeToMaxStone(range: [number, number]): number {
  const mid = (range[0] + range[1]) / 2;
  if (mid <= 33) return 3 + Math.floor(Math.random() * 3);   // 3-5
  if (mid <= 66) return 5 + Math.floor(Math.random() * 4);   // 5-8
  return 8 + Math.floor(Math.random() * 5);                   // 8-12
}

function generateRandomPiles(pileCount: number, maxStone: number): number[] {
  const piles: number[] = [];
  for (let i = 0; i < pileCount; i++) {
    piles.push(1 + Math.floor(Math.random() * maxStone));
  }
  return piles;
}

export type NimPreset = 'easy' | 'medium' | 'hard';

const PRESETS: Record<NimPreset, { pileCount: [number, number]; maxStone: [number, number] }> = {
  easy:   { pileCount: [2, 3], maxStone: [3, 5] },
  medium: { pileCount: [4, 5], maxStone: [4, 8] },
  hard:   { pileCount: [6, 6], maxStone: [5, 10] },
};

export function generateNimLevelByPreset(preset: NimPreset): Level {
  const pc = PRESETS[preset];
  const pileCount = pc.pileCount[0] + Math.floor(Math.random() * (pc.pileCount[1] - pc.pileCount[0] + 1));
  const maxStone = pc.maxStone[0] + Math.floor(Math.random() * (pc.maxStone[1] - pc.maxStone[0] + 1));
  return buildNimLevel(pileCount, maxStone);
}

export function generateNimLevel(config: LevelConfig): Level {
  // Support gameParams.preset for explicit difficulty selection
  const preset = config.gameParams?.preset as NimPreset | undefined;
  if (preset && PRESETS[preset]) return generateNimLevelByPreset(preset);

  const pileCount = mapRangeToPileCount(config.difficultyRange);
  const maxStone = mapRangeToMaxStone(config.difficultyRange);
  return buildNimLevel(pileCount, maxStone);
}

function buildNimLevel(pileCount: number, maxStone: number): Level {
  const piles = generateRandomPiles(pileCount, maxStone);
  const difficulty = computeNimDifficulty(pileCount, maxStone);

  return {
    schemaVersion: 1,
    gameId: 'nim',
    levelId: `nim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
