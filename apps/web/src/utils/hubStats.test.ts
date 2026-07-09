import { describe, it, expect } from 'vitest';
import { computeHubStats } from './hubStats';
import type { GameProgressRecord } from '../stores/progressStore';

const snap = {
  schemaVersion: 1 as const,
  gameId: 'lights-out',
  state: {},
  moveHistory: [{}],
  stepCount: 0,
  timestamp: '2026-01-01T00:00:00.000Z',
};

function record(overrides: Partial<GameProgressRecord> & { gameId: string }): GameProgressRecord {
  return {
    snapshot: { ...snap, gameId: overrides.gameId },
    lastPlayedAt: '2026-01-01T00:00:00.000Z',
    wins: 0,
    plays: 0,
    isSolved: false,
    optimalSteps: null,
    elapsedMs: 0,
    ...overrides,
  };
}

describe('computeHubStats', () => {
  it('returns zeros for empty records', () => {
    expect(computeHubStats({})).toEqual({
      totalWins: 0,
      totalPlays: 0,
      gamesTried: 0,
      gamesWon: 0,
    });
  });

  it('sums wins and plays across games', () => {
    const stats = computeHubStats({
      'lights-out': record({ gameId: 'lights-out', wins: 2, plays: 5 }),
      sudoku: record({ gameId: 'sudoku', wins: 1, plays: 3 }),
    });
    expect(stats).toEqual({
      totalWins: 3,
      totalPlays: 8,
      gamesTried: 2,
      gamesWon: 2,
    });
  });

  it('counts gamesTried only when plays > 0', () => {
    const stats = computeHubStats({
      nim: record({ gameId: 'nim', wins: 0, plays: 0 }),
      fifteen: record({ gameId: 'fifteen', wins: 0, plays: 1 }),
    });
    expect(stats.gamesTried).toBe(1);
    expect(stats.gamesWon).toBe(0);
  });
});
