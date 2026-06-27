import type { Level, LevelConfig } from '../types/plugin';
import { computeWythoffDifficulty } from '../difficulty/wythoff-difficulty';

const MAX_STONE = 10;

export function generateWythoffLevel(_config?: LevelConfig): Level {
  const a = 1 + Math.floor(Math.random() * MAX_STONE);
  const b = 1 + Math.floor(Math.random() * MAX_STONE);
  const maxStone = Math.max(a, b);
  const difficulty = computeWythoffDifficulty(maxStone);

  return {
    schemaVersion: 1,
    gameId: 'wythoff',
    levelId: `wythoff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
