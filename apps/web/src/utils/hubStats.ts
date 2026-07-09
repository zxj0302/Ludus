import type { GameProgressRecord } from '../stores/progressStore';

export interface HubStats {
  totalWins: number;
  totalPlays: number;
  gamesTried: number;
  gamesWon: number;
}

/** Aggregate Hub progress stats from persisted records. */
export function computeHubStats(records: Record<string, GameProgressRecord>): HubStats {
  const list = Object.values(records);
  return {
    totalWins: list.reduce((sum, r) => sum + r.wins, 0),
    totalPlays: list.reduce((sum, r) => sum + r.plays, 0),
    gamesTried: list.filter(r => r.plays > 0).length,
    gamesWon: list.filter(r => r.wins > 0).length,
  };
}
