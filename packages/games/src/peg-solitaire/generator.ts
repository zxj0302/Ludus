import type { Level, LevelConfig } from '@ludus/core';
import { resolveSeed } from '../generator-config';
import { getDifficulty } from './difficulty';
import { CLASSIC_CENTER_EMPTY, catalogByGoal, entryToState } from './puzzles';

/**
 * Hub first-load / fallback deal only.
 * Primary UX is PegSolitaireToolbar (mode + named level), like Sokoban.
 * Default shelf is one-center (classic cultural entry).
 */
export function generatePegSolitaireLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const pool = catalogByGoal('one-center');
  // seed 0 → classic; otherwise rotate the one-center shelf (Hub fallback only).
  const entry = seed === 0
    ? CLASSIC_CENTER_EMPTY
    : (pool[Math.abs(seed) % pool.length] ?? CLASSIC_CENTER_EMPTY);
  const state = entryToState(entry);

  return {
    schemaVersion: 1,
    gameId: 'peg-solitaire',
    levelId: `peg-catalog-${entry.id}-${seed}`,
    initialState: state as unknown as Record<string, unknown>,
    difficulty: getDifficulty(state, entry.knownSolutionLength),
    optimalSteps: entry.knownSolutionLength,
    uniqueSolution: false,
    generatedBy: 'classic-catalog',
    createdAt: new Date().toISOString(),
  };
}
