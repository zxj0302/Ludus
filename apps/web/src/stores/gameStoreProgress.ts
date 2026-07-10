import type { GamePlugin, GameState } from '@ludus/core';
import { buildProgressSnapshot } from '../utils/progressSnapshot';
import { useProgressStore } from './progressStore';

export interface PersistGameSessionParams {
  gameId: string | null;
  plugin: GamePlugin | null;
  gameState: GameState | null;
  history: GameState[];
  historyIndex: number;
  optimalSteps: number | null;
  elapsedMs: number;
  wonJustNow?: boolean;
  newSession?: boolean;
}

/** Persist the active session into progressStore (no-op if session is incomplete). */
export function persistGameSession({
  gameId,
  plugin,
  gameState,
  history,
  historyIndex,
  optimalSteps,
  elapsedMs,
  wonJustNow,
  newSession,
}: PersistGameSessionParams): void {
  if (!gameId || !plugin || !gameState) return;

  useProgressStore.getState().saveSession({
    gameId,
    snapshot: buildProgressSnapshot(gameId, gameState, history, historyIndex),
    isSolved: plugin.isSolved(gameState),
    optimalSteps,
    elapsedMs,
    wonJustNow,
    newSession,
  });
}
