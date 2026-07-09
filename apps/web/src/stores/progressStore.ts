import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameStateSnapshotV1 } from '@ludus/core/schemas';
import { GameStateSnapshotSchemaV1 } from '@ludus/core/schemas';

export interface GameProgressRecord {
  gameId: string;
  snapshot: GameStateSnapshotV1;
  lastPlayedAt: string;
  wins: number;
  plays: number;
  isSolved: boolean;
  optimalSteps: number | null;
  /** Accumulated play time for the current puzzle (ms), persisted across sessions. */
  elapsedMs: number;
}

interface SaveSessionParams {
  gameId: string;
  snapshot: GameStateSnapshotV1;
  isSolved: boolean;
  optimalSteps: number | null;
  elapsedMs: number;
  wonJustNow?: boolean;
  newSession?: boolean;
}

interface ProgressStore {
  records: Record<string, GameProgressRecord>;
  recentGameId: string | null;

  saveSession: (params: SaveSessionParams) => void;
  getRecord: (gameId: string) => GameProgressRecord | undefined;
  getRecentRecord: () => GameProgressRecord | undefined;
  getTotalWins: () => number;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      records: {},
      recentGameId: null,

      saveSession: ({
        gameId,
        snapshot,
        isSolved,
        optimalSteps,
        elapsedMs,
        wonJustNow = false,
        newSession = false,
      }) => {
        const prev = get().records[gameId];
        set({
          recentGameId: gameId,
          records: {
            ...get().records,
            [gameId]: {
              gameId,
              snapshot,
              lastPlayedAt: new Date().toISOString(),
              wins: (prev?.wins ?? 0) + (wonJustNow ? 1 : 0),
              plays: (prev?.plays ?? 0) + (newSession ? 1 : 0),
              isSolved,
              optimalSteps,
              elapsedMs,
            },
          },
        });
      },

      getRecord: (gameId) => get().records[gameId],

      getRecentRecord: () => {
        const { recentGameId, records } = get();
        return recentGameId ? records[recentGameId] : undefined;
      },

      getTotalWins: () =>
        Object.values(get().records).reduce((sum, r) => sum + r.wins, 0),
    }),
    {
      name: 'ludus-progress-v1',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2 && persisted && typeof persisted === 'object') {
          const state = persisted as { records?: Record<string, GameProgressRecord> };
          if (state.records) {
            for (const record of Object.values(state.records)) {
              if (record.elapsedMs == null) record.elapsedMs = 0;
            }
          }
        }
        return persisted as ProgressStore;
      },
    },
  ),
);

/** Validate and extract a restorable snapshot for a game. */
export function parseRestorableSnapshot(
  gameId: string,
  snapshot: GameStateSnapshotV1 | undefined,
): { state: Record<string, unknown>; history: Record<string, unknown>[]; historyIndex: number } | null {
  if (!snapshot) return null;
  const parsed = GameStateSnapshotSchemaV1.safeParse(snapshot);
  if (!parsed.success || parsed.data.gameId !== gameId) return null;

  const { state, moveHistory, stepCount } = parsed.data;
  if (moveHistory.length === 0) return null;
  if (stepCount < 0 || stepCount >= moveHistory.length) return null;

  return { state, history: moveHistory, historyIndex: stepCount };
}
