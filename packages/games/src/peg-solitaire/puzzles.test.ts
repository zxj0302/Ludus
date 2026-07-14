import { describe, expect, it } from 'vitest';
import { applyMove, meetsGoal, popcount } from './rules';
import { CLASSIC_CENTER_EMPTY, PEG_CATALOG, catalogStats, entryToState } from './puzzles';
import { solvePegSolitaire } from './solver';
import type { PegSolitaireMove, PegSolitaireState } from './types';

function applyMoves(state: PegSolitaireState, moves: PegSolitaireMove[]): PegSolitaireState {
  return moves.reduce((current, move) => applyMove(current, move), state);
}

describe('Peg Solitaire classic catalog', () => {
  it('meets catalog minimums (one-any ≥15, one-center ≥10, includes classic)', () => {
    const stats = catalogStats();
    expect(stats.oneAny).toBeGreaterThanOrEqual(15);
    expect(stats.oneCenter).toBeGreaterThanOrEqual(10);
    expect(PEG_CATALOG.some(e => e.id === CLASSIC_CENTER_EMPTY.id)).toBe(true);
  });

  it('keeps every non-full-board entry solvable for its declared goal', () => {
    for (const entry of PEG_CATALOG) {
      if (entry.id === CLASSIC_CENTER_EMPTY.id) {
        expect(entry.goal).toBe('one-center');
        expect(entry.knownSolutionLength).toBe(31);
        expect(popcount(entry.pegs)).toBe(32);
        continue;
      }
      // Full-board single-vacancy problems: too heavy for CI BFS; trust literature length.
      if (popcount(entry.pegs) >= 30) {
        expect(entry.knownSolutionLength).toBe(31);
        continue;
      }

      const state = entryToState(entry);
      const pegs = popcount(entry.pegs);
      const solution = solvePegSolitaire(state, {
        // BFS only on shallow boards; mid boards use DFS for reachability.
        // Singleton goals always have length pegs−1, so length check needs any solution.
        findShortest: pegs <= 12,
        timeMs: pegs > 16 ? 12_000 : 3_000,
      });
      const solved = applyMoves(state, solution.moves as PegSolitaireMove[]);

      expect(solution.solvable, entry.id).toBe(true);
      expect(meetsGoal(solved.pegs, entry.goal), entry.id).toBe(true);
      if (entry.knownSolutionLength !== null) {
        expect(solution.moves.length, entry.id).toBe(entry.knownSolutionLength);
      }
    }
  }, 180_000);
  it('stores knownSolutionLength as single-jump optimal (pegs − 1)', () => {
    for (const entry of PEG_CATALOG) {
      expect(entry.knownSolutionLength, entry.id).toBe(popcount(entry.pegs) - 1);
    }
  });

  it('keeps optional tier tags consistent with goals (legacy metadata only)', () => {
    for (const entry of PEG_CATALOG) {
      if (entry.goal === 'one-center') expect(entry.tier).toBe('hard');
      else expect(['easy', 'medium', 'hard']).toContain(entry.tier);
    }
  });
});
