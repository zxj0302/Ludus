import { describe, expect, it } from 'vitest';
import {
  copHasWinningStrategy,
  evaluateState,
  searchAdversary,
} from './adversary';
import type { ThiefSiegeState } from './types';

function openThreeByThree(overrides: Partial<ThiefSiegeState> = {}): ThiefSiegeState {
  return {
    width: 3,
    height: 3,
    cells: [
      'exit', 'exit', 'exit',
      'exit', 'floor', 'exit',
      'exit', 'exit', 'exit',
    ],
    thief: { row: 1, col: 1 },
    cops: [],
    phase: 'thief',
    currentPlayer: 1,
    maxCops: 10,
    status: 'playing',
    ...overrides,
  };
}

describe('searchAdversary', () => {
  it('steps onto an adjacent exit when thief has a forced win in one ply', () => {
    const result = searchAdversary(openThreeByThree(), { timeMs: 200, maxDepth: 4 });

    expect(result.move).toEqual({ type: 'step', row: 0, col: 1 });
    expect(result.score).toBeGreaterThan(0);
    expect(result.tier).toBe('perfect');
  });

  it('reports a cop win when one placement traps the thief', () => {
    const state = openThreeByThree({
      cops: [
        { row: 0, col: 1 },
        { row: 2, col: 1 },
        { row: 1, col: 0 },
      ],
      phase: 'cop',
      currentPlayer: 0,
    });

    expect(copHasWinningStrategy(state, { timeMs: 500, maxDepth: 8 })).toBe(true);
  });

  it('does not claim a cop win when the thief can force an immediate exit', () => {
    const state = openThreeByThree({ phase: 'cop', currentPlayer: 0 });

    expect(copHasWinningStrategy(state, { timeMs: 200, maxDepth: 4 })).toBe(false);
  });
});

describe('evaluateState', () => {
  it('scores reachable escapes above trapped positions', () => {
    const trapped = openThreeByThree({
      cops: [
        { row: 0, col: 1 },
        { row: 2, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 2 },
      ],
    });

    expect(evaluateState(openThreeByThree())).toBeGreaterThan(evaluateState(trapped));
  });
});
