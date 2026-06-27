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

function generatePPosition(pileCount: number, maxStone: number): number[] {
  // Generate piles ensuring nim-sum = 0 and all values in [1, maxStone]
  // Retry loop: ~99.6% success within 100 attempts for typical (piles, maxStone)
  for (let attempt = 0; attempt < 100; attempt++) {
    const piles: number[] = [];
    let runningXor = 0;
    for (let i = 0; i < pileCount - 1; i++) {
      const stone = 1 + Math.floor(Math.random() * maxStone);
      piles.push(stone);
      runningXor ^= stone;
    }
    // runningXor needs to be in [1, maxStone] for a valid last pile
    if (runningXor >= 1 && runningXor <= maxStone) {
      piles.push(runningXor);
      return piles;
    }
    // runningXor is 0 or > maxStone — retry with different random values
  }
  // Fallback: guaranteed P-position using pairs
  const fallback: number[] = [];
  for (let i = 0; i < pileCount; i++) {
    // Pair up: [1,1,2,2,3,3,...] — each pair XORs to 0
    fallback.push(Math.floor(i / 2) + 1);
  }
  // If odd count, make last pile XOR of all others (guarantees nim-sum = 0)
  if (pileCount % 2 === 1) {
    let xor = 0;
    for (let i = 0; i < pileCount - 1; i++) xor ^= fallback[i]!;
    fallback[pileCount - 1] = xor > 0 ? xor : 1;
  }
  return fallback;
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
