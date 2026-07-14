import { afterEach, describe, expect, it, vi } from 'vitest';
import { thiefSiegePlugin } from './index';
import { chooseThiefSiegeAiMove, getThiefSiegeAdversaryBudget } from './solver';
import type { ThiefSiegeState } from './types';

afterEach(() => {
  vi.doUnmock('./solver');
  vi.resetModules();
});

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

  it('uses BFS-only movement for the synchronous plugin AI path', () => {
    const state: ThiefSiegeState = {
      width: 5,
      height: 5,
      cells: [
        'obstacle', 'obstacle', 'obstacle', 'obstacle', 'obstacle',
        'obstacle', 'floor', 'floor', 'exit', 'obstacle',
        'obstacle', 'floor', 'floor', 'floor', 'obstacle',
        'obstacle', 'floor', 'floor', 'floor', 'exit',
        'obstacle', 'obstacle', 'obstacle', 'obstacle', 'obstacle',
      ],
      thief: { row: 2, col: 2 },
      cops: [],
      phase: 'thief',
      currentPlayer: 1,
      maxCops: 8,
      status: 'playing',
    };

    expect(thiefSiegePlugin.ai?.getAIMove(state)).toEqual({
      move: { type: 'step', row: 1, col: 2 },
      delay: 450,
    });
  });

  it('does not call the adversary-backed chooser in the synchronous plugin AI path', async () => {
    vi.doMock('./solver', async importOriginal => ({
      ...(await importOriginal<typeof import('./solver')>()),
      chooseBfsThiefStep: () => ({ type: 'step', row: 1, col: 2 }),
      chooseThiefStep: () => ({ type: 'step', row: 4, col: 4 }),
    }));
    const { thiefSiegePlugin: mockedPlugin } = await import('./index');

    expect(mockedPlugin.ai?.getAIMove(openThreeByThree())).toEqual({
      move: { type: 'step', row: 1, col: 2 },
      delay: 450,
    });
  });
});
