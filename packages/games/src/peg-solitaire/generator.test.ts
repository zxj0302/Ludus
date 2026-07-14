import { describe, expect, it } from 'vitest';
import { applyMove, isOwnState, meetsGoal, popcount } from './rules';
import { generatePegSolitaireLevel, goalFromDifficultyRange } from './generator';
import { solvePegSolitaire } from './solver';
import type { PegSolitaireMove, PegSolitaireState } from './types';

function applyMoves(state: PegSolitaireState, moves: PegSolitaireMove[]): PegSolitaireState {
  return moves.reduce((current, move) => applyMove(current, move), state);
}

describe('Peg Solitaire generator', () => {
  it.each([
    [[1, 33] as [number, number], 'le3'],
    [[34, 66] as [number, number], 'one-any'],
    [[67, 100] as [number, number], 'one-center'],
    [[20, 80] as [number, number], 'one-any'],
  ])('maps difficulty range %j to %s goal', (range, goal) => {
    expect(goalFromDifficultyRange(range)).toBe(goal);
  });

  it('generates owned solvable states for seeds 1 through 5', () => {
    for (let seed = 1; seed <= 5; seed += 1) {
      const level = generatePegSolitaireLevel({ difficultyRange: [1, 100], seed });
      const state = level.initialState as unknown as PegSolitaireState;
      const solution = solvePegSolitaire(state, { findShortest: true, timeMs: 1000 });
      const solved = applyMoves(state, solution.moves as PegSolitaireMove[]);

      expect(level.gameId).toBe('peg-solitaire');
      expect(isOwnState(state)).toBe(true);
      expect(solution.solvable).toBe(true);
      expect(meetsGoal(solved.pegs, state.goal)).toBe(true);
      expect(popcount(state.pegs)).toBeGreaterThan(popcount(solved.pegs));
      expect(level.optimalSteps).toBe(solution.moves.length);
      expect(level.difficulty.score).toBeGreaterThanOrEqual(0);
      expect(level.difficulty.score).toBeLessThanOrEqual(100);
    }
  });

  it.each([
    [[1, 33] as [number, number], 'le3', 3],
    [[34, 66] as [number, number], 'one-any', 1],
    [[67, 100] as [number, number], 'one-center', 1],
  ])('generates a %s puzzle that can meet its peg-count target', (range, goal, targetPegs) => {
    const level = generatePegSolitaireLevel({ difficultyRange: range, seed: 3 });
    const state = level.initialState as unknown as PegSolitaireState;
    const solution = solvePegSolitaire(state, { findShortest: true, timeMs: 1000 });
    const solved = applyMoves(state, solution.moves as PegSolitaireMove[]);

    expect(state.goal).toBe(goal);
    expect(popcount(solved.pegs)).toBeLessThanOrEqual(targetPegs);
    expect(meetsGoal(solved.pegs, state.goal)).toBe(true);
  });
});
