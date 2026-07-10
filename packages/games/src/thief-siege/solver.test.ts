import { describe, expect, it } from 'vitest';
import { cellIndex, createInitialState } from './rules';
import {
  chooseThiefStep,
  shortestEscapePath,
  solveThiefSiege,
  suggestCopPlacement,
} from './solver';
import type { ThiefSiegeState } from './types';

function setCells(state: ThiefSiegeState, cells: ThiefSiegeState['cells']): ThiefSiegeState {
  return { ...state, cells };
}

function blockedCenterState(): ThiefSiegeState {
  return {
    width: 3,
    height: 3,
    cells: [
      'exit', 'exit', 'exit',
      'exit', 'floor', 'exit',
      'exit', 'exit', 'exit',
    ],
    thief: { row: 1, col: 1 },
    cops: [
      { row: 0, col: 1 },
      { row: 2, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
    ],
    phase: 'thief',
    currentPlayer: 1,
    maxCops: 10,
    status: 'playing',
  };
}

describe('shortestEscapePath', () => {
  it('finds escape path on open map', () => {
    const state = createInitialState();

    const path = shortestEscapePath(state);

    expect(path).not.toBeNull();
    expect(path![0]).toEqual(state.thief);
    const last = path![path!.length - 1]!;
    expect(state.cells[cellIndex(state.width, last.row, last.col)]).toBe('exit');
  });

  it('returns null when cops block every route to an exit', () => {
    expect(shortestEscapePath(blockedCenterState())).toBeNull();
  });
});

describe('chooseThiefStep', () => {
  it('steps onto exit when adjacent', () => {
    const state: ThiefSiegeState = {
      ...createInitialState(),
      width: 3,
      height: 3,
      cells: [
        'exit', 'exit', 'exit',
        'exit', 'floor', 'exit',
        'exit', 'exit', 'exit',
      ],
      thief: { row: 1, col: 1 },
      phase: 'thief',
      currentPlayer: 1,
    };

    expect(chooseThiefStep(state)).toEqual({ type: 'step', row: 0, col: 1 });
  });

  it('returns null outside thief phase or terminal states', () => {
    expect(chooseThiefStep(createInitialState())).toBeNull();
    expect(chooseThiefStep({ ...createInitialState(), phase: 'thief', currentPlayer: 1, status: 'cop-win' })).toBeNull();
  });
});

describe('suggestCopPlacement', () => {
  it('returns a cell on the shortest escape path', () => {
    const state = createInitialState();
    const path = shortestEscapePath(state)!;

    const move = suggestCopPlacement(state);

    expect(move).not.toBeNull();
    expect(move!.type).toBe('place');
    expect(path).toContainEqual({ row: move!.row, col: move!.col });
  });

  it('returns any legal place when no escape path exists', () => {
    const state = { ...blockedCenterState(), phase: 'cop' as const, currentPlayer: 0 as const };

    expect(suggestCopPlacement(state)).toEqual({ type: 'place', row: 0, col: 0 });
  });
});

describe('solveThiefSiege', () => {
  it('returns escape-path trace and a cop recommendation during cop phase', () => {
    const solution = solveThiefSiege(createInitialState());

    expect(solution.moves).toHaveLength(1);
    expect(solution.moves[0]).toMatchObject({ type: 'place' });
    expect(solution.trace?.type).toBe('escape-path');
    expect(solution.trace?.visualizationData).toMatchObject({
      escapePath: expect.arrayContaining([createInitialState().thief]),
    });
    expect(solution.stats.solverName).toContain('escape-bfs');
  });

  it('returns a thief step during thief phase', () => {
    const state = { ...createInitialState(), phase: 'thief' as const, currentPlayer: 1 as const };

    expect(solveThiefSiege(state).moves[0]).toMatchObject({ type: 'step' });
  });
});
