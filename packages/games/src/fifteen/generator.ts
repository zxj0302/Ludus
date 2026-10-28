import type { Level, LevelConfig } from '@ludus/core';
import { mulberry32, resolveSeed } from '../generator-config';
import type { FifteenState } from './types';
import { GOAL_GRID } from './types';
import { legalMoves, applyMove } from './rules';
import { computeFifteenDifficulty } from './difficulty';

function scrambleDepthFromRange(range: [number, number], rng: () => number): number {
  // Randomly sample a difficulty score within the range, then map to scramble depth.
  // This ensures the full difficulty spectrum is reachable when the range is wide.
  const score = range[0] + rng() * (range[1] - range[0]);
  if (score <= 33) return 10 + Math.floor(rng() * 11);  // Easy:   10–20
  if (score <= 66) return 20 + Math.floor(rng() * 21);  // Medium: 20–40
  return 40 + Math.floor(rng() * 41);                   // Hard:   40–80
}

export function generateFifteenLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const rng = mulberry32(seed);
  const depth = config.gameParams?.scrambleDepth as number | undefined
    ?? scrambleDepthFromRange(config.difficultyRange, rng);

  let state: FifteenState = { grid: [...GOAL_GRID] };
  let lastEmptyIdx = -1;

  // Retry loop: random walks can return to solved state (especially at low depth)
  const maxRetries = 10;
  for (let retry = 0; retry < maxRetries; retry++) {
    state = { grid: [...GOAL_GRID] };
    lastEmptyIdx = -1;

    for (let i = 0; i < depth; i++) {
      const moves = legalMoves(state);
      // Avoid reversing the previous move
      const filtered = moves.filter(m => {
        const nextState = applyMove(state, m);
        return nextState.grid.indexOf(0) !== lastEmptyIdx;
      });
      const chosen = filtered.length > 0
        ? filtered[Math.floor(rng() * filtered.length)]!
        : moves[Math.floor(rng() * moves.length)]!;

      lastEmptyIdx = state.grid.indexOf(0);
      state = applyMove(state, chosen);
    }

    // Check we didn't accidentally solve it
    const isAlreadySolved = state.grid.every((v, i) => v === GOAL_GRID[i]);
    if (!isAlreadySolved) break;
  }

  // Even if all retries failed (extremely unlikely), the last state is
  // still solvable by construction (random walk from goal)

  const difficulty = computeFifteenDifficulty(depth);

  return {
    schemaVersion: 1,
    gameId: 'fifteen',
    levelId: `fifteen-${seed}-${depth}`,
    initialState: { grid: state.grid, scrambleDepth: depth } as unknown as Record<string, unknown>,
    difficulty,
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'random-walk',
    createdAt: new Date().toISOString(),
  };
}
