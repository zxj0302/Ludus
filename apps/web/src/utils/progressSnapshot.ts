import type { GameState } from '@ludus/core';
import type { GameStateSnapshotV1 } from '@ludus/core/schemas';

/** Build a versioned snapshot from current game session state. */
export function buildProgressSnapshot(
  gameId: string,
  gameState: GameState,
  history: GameState[],
  historyIndex: number,
): GameStateSnapshotV1 {
  return {
    schemaVersion: 1,
    gameId,
    state: gameState as Record<string, unknown>,
    moveHistory: history.map(h => h as Record<string, unknown>),
    stepCount: historyIndex,
    timestamp: new Date().toISOString(),
  };
}

/** Estimate in-progress completion for Hub Hero progress bar (0–100). */
export function computeProgressPercent(
  isSolved: boolean,
  stepCount: number,
  optimalSteps: number | null,
): number {
  if (isSolved) return 100;
  if (optimalSteps != null && optimalSteps > 0) {
    return Math.min(95, Math.round((stepCount / optimalSteps) * 100));
  }
  return Math.min(90, stepCount * 5);
}

/** Read live elapsed ms from store timer fields. */
export function getCurrentElapsedMs(startTime: number | null, elapsed: number): number {
  if (startTime) return Date.now() - startTime;
  return elapsed;
}

/** Compute timer fields when loading or resuming a session. */
export function timerFieldsForSession(
  restored: boolean,
  savedElapsedMs: number,
  isSolved: boolean,
  now: number = Date.now(),
): { startTime: number | null; elapsed: number } {
  if (restored && savedElapsedMs > 0) {
    return isSolved
      ? { startTime: null, elapsed: savedElapsedMs }
      : { startTime: now - savedElapsedMs, elapsed: savedElapsedMs };
  }
  return { startTime: now, elapsed: 0 };
}
