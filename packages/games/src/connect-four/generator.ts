import type { Difficulty, Level, LevelConfig } from '@ludus/core';
import { resolveSeed, mulberry32 } from '../generator-config';
import { createInitialState, normalizeState } from './rules';
import type { ConnectFourState } from './types';
import { scoreToAiMaxDepth } from './difficulty';

/** Display-only difficulty from seed (gameplay always starts empty). */
function difficultyFromSeed(seed: number, range: [number, number]): Difficulty {
  const rng = mulberry32(seed);
  const [minScore, maxScore] = range;
  const score = Math.round(minScore + rng() * Math.max(0, maxScore - minScore));
  const clamped = Math.max(0, Math.min(100, score));
  let labelKey: string;
  if (clamped <= 33) labelKey = 'difficulty.easy';
  else if (clamped <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';
  return { score: clamped, factors: { seed }, labelKey };
}

export function generateConnectFourLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const range = config.difficultyRange ?? [1, 100];
  const difficulty = difficultyFromSeed(seed, range);
  const state = {
    ...createInitialState(),
    aiMaxDepth: scoreToAiMaxDepth(difficulty.score),
  };

  return {
    schemaVersion: 1,
    gameId: 'connect-four',
    levelId: `connect-four-${seed}`,
    initialState: state as unknown as Record<string, unknown>,
    difficulty,
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'empty-board',
    createdAt: new Date().toISOString(),
  };
}

/** Normalize legacy saves; fresh sessions always reopen on empty choosing board. */
export function prepareConnectFourLoadedState(
  state: ConnectFourState,
  options: { fresh: boolean },
): ConnectFourState {
  if (options.fresh) {
    const base = createInitialState();
    return state.aiMaxDepth != null ? { ...base, aiMaxDepth: state.aiMaxDepth } : base;
  }
  return normalizeState(state);
}
