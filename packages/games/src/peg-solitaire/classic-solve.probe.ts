import { describe, expect, it } from 'vitest';
import { createClassicState, applyMove, meetsGoal, popcount } from './rules';
import { solvePegSolitaire } from './solver';
import type { PegSolitaireMove } from './types';

/**
 * Optional long-running probe — not part of default CI.
 * Run: pnpm --filter @ludus/games exec vitest run src/peg-solitaire/classic-solve.probe.ts
 */
describe.skip('classic center-vacant long solve probe', () => {
  it('searches classic with a 60s budget and prints any found path', () => {
    const state = createClassicState('one-center');
    expect(popcount(state.pegs)).toBe(32);
    const solution = solvePegSolitaire(state, { timeMs: 60_000 });
    // eslint-disable-next-line no-console
    console.log({
      solvable: solution.solvable,
      length: solution.moves.length,
      terminated: solution.stats.terminated,
      nodes: solution.stats.nodesExplored,
      timeMs: solution.stats.timeMs,
    });
    if (solution.solvable) {
      const end = (solution.moves as PegSolitaireMove[]).reduce(
        (s, m) => applyMove(s, m),
        state,
      );
      expect(meetsGoal(end.pegs, 'one-center')).toBe(true);
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(solution.moves));
    }
  }, 90_000);
});
