import type { Level, LevelConfig } from '@ludus/core';
import type { FifteenState } from './types';
import { GOAL_GRID } from './types';
import { legalMoves, applyMove } from './rules';
import { computeFifteenDifficulty } from './difficulty';

function scrambleDepthFromRange(range: [number, number]): number {
  const mid = (range[0] + range[1]) / 2;
  if (mid <= 33) return 10 + Math.floor(Math.random() * 11);  // 10-20
  if (mid <= 66) return 20 + Math.floor(Math.random() * 21);  // 20-40
  return 40 + Math.floor(Math.random() * 41);                   // 40-80
}

export function generateFifteenLevel(config: LevelConfig): Level {
  const depth = config.gameParams?.scrambleDepth as number | undefined
    ?? scrambleDepthFromRange(config.difficultyRange);

  let state: FifteenState = { grid: [...GOAL_GRID] };
  let lastEmptyIdx = -1;

  for (let i = 0; i < depth; i++) {
    const moves = legalMoves(state);
    // Avoid reversing the previous move
    const filtered = moves.filter(m => {
      const nextState = applyMove(state, m);
      return nextState.grid.indexOf(0) !== lastEmptyIdx;
    });
    const chosen = filtered.length > 0
      ? filtered[Math.floor(Math.random() * filtered.length)]!
      : moves[Math.floor(Math.random() * moves.length)]!;

    lastEmptyIdx = state.grid.indexOf(0);
    state = applyMove(state, chosen);
  }

  // Check we didn't accidentally solve it
  const isAlreadySolved = state.grid.every((v, i) => v === GOAL_GRID[i]);

  const difficulty = computeFifteenDifficulty(isAlreadySolved ? 0 : depth);

  return {
    schemaVersion: 1,
    gameId: 'fifteen',
    levelId: `fifteen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initialState: { grid: state.grid } as unknown as Record<string, unknown>,
    difficulty,
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'random-walk',
    createdAt: new Date().toISOString(),
  };
}
