import { describe, expect, it } from 'vitest';
import { chooseThiefSiegeAiMove, getThiefSiegeAdversaryBudget } from './solver';
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

describe('thief-siege ai-move contract', () => {
  it('returns Worker-shaped move data for a thief-phase state', () => {
    const state = openThreeByThree();

    const action = chooseThiefSiegeAiMove(state, getThiefSiegeAdversaryBudget(state));

    expect(action).toEqual({
      move: { type: 'step', row: 0, col: 1 },
      delay: expect.any(Number),
      tier: expect.stringMatching(/^(perfect|bounded|bfs)$/),
    });
    expect(action?.delay).toBeGreaterThanOrEqual(200);
  });

  it('returns null outside the thief phase', () => {
    const action = chooseThiefSiegeAiMove(openThreeByThree({ phase: 'cop', currentPlayer: 0 }));

    expect(action).toBeNull();
  });
});
