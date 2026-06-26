import type { Level, LevelConfig } from '../types/plugin';
import type { NimState } from '../types/nim';
import { computeNimSum } from '../solver/nim-solver';
import { computeNimDifficulty } from '../difficulty/nim-difficulty';

function mapRangeToPileCount(range: [number, number]): number {
  const mid = (range[0] + range[1]) / 2;
  if (mid <= 33) return 2;
  if (mid <= 66) return 3;
  return 4 + Math.floor(Math.random() * 2); // 4-5
}

function mapRangeToMaxStone(range: [number, number]): number {
  const mid = (range[0] + range[1]) / 2;
  if (mid <= 33) return 3 + Math.floor(Math.random() * 3);   // 3-5
  if (mid <= 66) return 5 + Math.floor(Math.random() * 4);   // 5-8
  return 8 + Math.floor(Math.random() * 5);                   // 8-12
}

function generatePPosition(pileCount: number, maxStone: number): number[] {
  // Generate piles ensuring nim-sum = 0 and all values in [1, maxStone]
  const piles: number[] = [];
  let runningXor = 0;
  for (let i = 0; i < pileCount - 1; i++) {
    const stone = 1 + Math.floor(Math.random() * maxStone);
    piles.push(stone);
    runningXor ^= stone;
  }
  // Last pile: need runningXor ^ x = 0 → x = runningXor, but must be in [1, maxStone]
  if (runningXor >= 1 && runningXor <= maxStone) {
    piles.push(runningXor);
  } else {
    // runningXor is 0 or out of range — adjust a random earlier pile
    const idx = Math.floor(Math.random() * (pileCount - 1));
    const prev = piles[idx]!;
    // newRunningXor = runningXor ^ prev ^ newVal; we want newRunningXor in [1, maxStone]
    const target = 1 + Math.floor(Math.random() * maxStone);
    piles[idx] = target;
    const newRunningXor = runningXor ^ prev ^ target;
    piles.push(Math.max(1, Math.min(maxStone, newRunningXor)));
  }
  return piles;
}

export function generateNimLevel(config: LevelConfig): Level {
  const pileCount = mapRangeToPileCount(config.difficultyRange);
  const maxStone = mapRangeToMaxStone(config.difficultyRange);

  // Generate P-position then walk 1 step to N-position
  const pPiles = generatePPosition(pileCount, maxStone);
  // Walk 1 step: pick a pile with stones, remove some (not all, unless last)
  const piles = [...pPiles];
  const nonEmptyIndices = piles.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0);
  const walkPile = nonEmptyIndices[Math.floor(Math.random() * nonEmptyIndices.length)]!;
  const removeCount = 1 + Math.floor(Math.random() * (piles[walkPile]! - 1)) || 1;
  piles[walkPile]! -= removeCount;

  const difficulty = computeNimDifficulty(pileCount, maxStone);

  return {
    schemaVersion: 1,
    gameId: 'nim',
    levelId: `nim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initialState: {
      piles,
      currentPlayer: 0,
      initialPiles: [...piles],
    } as unknown as Record<string, unknown>,
    difficulty,
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'p-distance-walk',
    createdAt: new Date().toISOString(),
  };
}
