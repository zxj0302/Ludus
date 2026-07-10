import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  legalMoves,
  applyMove,
  isSolved,
  isOwnState,
  normalizeTerminalState,
  cellIndex,
  inBounds,
  neighbors4,
} from './rules';
import type { ThiefSiegeState } from './types';

describe('thief-siege helpers', () => {
  it('cellIndex is row-major', () => {
    expect(cellIndex(5, 2, 3)).toBe(13);
  });

  it('inBounds respects width and height', () => {
    expect(inBounds(5, 5, 0, 0)).toBe(true);
    expect(inBounds(5, 5, 4, 4)).toBe(true);
    expect(inBounds(5, 5, -1, 0)).toBe(false);
    expect(inBounds(5, 5, 0, 5)).toBe(false);
  });

  it('neighbors4 returns up to four orthogonal in-bounds cells', () => {
    expect(neighbors4(3, 3, 1, 1)).toEqual([
      { row: 0, col: 1 },
      { row: 2, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
    ]);
    expect(neighbors4(3, 3, 0, 0)).toEqual([
      { row: 1, col: 0 },
      { row: 0, col: 1 },
    ]);
  });
});

describe('createInitialState', () => {
  it('creates a 5×5 playable map with center thief and border exits', () => {
    const s = createInitialState();
    expect(s.width).toBe(5);
    expect(s.height).toBe(5);
    expect(s.cells.length).toBe(25);
    expect(s.thief).toEqual({ row: 2, col: 2 });
    expect(s.cops).toEqual([]);
    expect(s.phase).toBe('cop');
    expect(s.currentPlayer).toBe(0);
    expect(s.maxCops).toBe(10);
    expect(s.status).toBe('playing');
    expect(s.cells[0]).toBe('exit');
    expect(s.cells[cellIndex(s.width, 2, 2)]).toBe('floor');
  });
});

describe('isOwnState', () => {
  it('accepts a valid ThiefSiegeState', () => {
    expect(isOwnState(createInitialState())).toBe(true);
  });

  it('rejects malformed objects', () => {
    expect(isOwnState(null)).toBe(false);
    expect(isOwnState({ width: 5 })).toBe(false);
    expect(isOwnState({ ...createInitialState(), phase: 'bad' })).toBe(false);
  });
});

describe('legalMoves — cop phase', () => {
  it('allows placing a cop on empty floor during cop phase', () => {
    const s = createInitialState();
    const places = legalMoves(s).filter(m => m.type === 'place');
    expect(places.length).toBeGreaterThan(0);
    expect(places.every(m => m.type === 'place')).toBe(true);
  });

  it('does not offer place on thief cell, obstacles, or existing cops', () => {
    const s: ThiefSiegeState = {
      width: 3,
      height: 3,
      cells: [
        'exit', 'exit', 'exit',
        'exit', 'floor', 'exit',
        'exit', 'exit', 'exit',
      ],
      thief: { row: 1, col: 1 },
      cops: [{ row: 1, col: 0 }],
      phase: 'cop',
      currentPlayer: 0,
      maxCops: 10,
      status: 'playing',
    };
    const places = legalMoves(s).filter(m => m.type === 'place');
    expect(places.some(m => m.row === 1 && m.col === 1)).toBe(false);
    expect(places.some(m => m.row === 1 && m.col === 0)).toBe(false);
  });

  it('returns no place moves when maxCops reached', () => {
    const s: ThiefSiegeState = {
      ...createInitialState(),
      cops: [{ row: 1, col: 1 }],
      maxCops: 1,
    };
    expect(legalMoves(s)).toEqual([]);
  });

  it('returns empty when game is terminal', () => {
    const s: ThiefSiegeState = { ...createInitialState(), status: 'cop-win' };
    expect(legalMoves(s)).toEqual([]);
  });
});

describe('applyMove — place', () => {
  it('places a cop and switches to thief phase', () => {
    const s = createInitialState();
    const move = legalMoves(s).find(m => m.type === 'place' && m.row === 1 && m.col === 1)!;
    const next = applyMove(s, move);
    expect(next.cops).toEqual([{ row: 1, col: 1 }]);
    expect(next.phase).toBe('thief');
    expect(next.currentPlayer).toBe(1);
    expect(next.status).toBe('playing');
  });

  it('does not mutate the original state', () => {
    const s = createInitialState();
    const move = legalMoves(s)[0]!;
    applyMove(s, move);
    expect(s.cops).toEqual([]);
    expect(s.phase).toBe('cop');
  });
});

describe('legalMoves — thief phase', () => {
  it('offers orthogonal step moves to walkable cells without cops', () => {
    const s: ThiefSiegeState = {
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
    };
    const steps = legalMoves(s).filter(m => m.type === 'step');
    expect(steps).toEqual([
      { type: 'step', row: 0, col: 1 },
      { type: 'step', row: 2, col: 1 },
      { type: 'step', row: 1, col: 0 },
      { type: 'step', row: 1, col: 2 },
    ]);
  });

  it('excludes steps onto cop-occupied cells', () => {
    const s: ThiefSiegeState = {
      width: 3,
      height: 3,
      cells: [
        'exit', 'exit', 'exit',
        'exit', 'floor', 'exit',
        'exit', 'exit', 'exit',
      ],
      thief: { row: 1, col: 1 },
      cops: [{ row: 0, col: 1 }],
      phase: 'thief',
      currentPlayer: 1,
      maxCops: 10,
      status: 'playing',
    };
    const steps = legalMoves(s).filter(m => m.type === 'step');
    expect(steps.some(m => m.row === 0 && m.col === 1)).toBe(false);
    expect(steps.length).toBe(3);
  });
});

describe('applyMove — step', () => {
  it('moves thief and returns to cop phase when still playing', () => {
    const s: ThiefSiegeState = {
      width: 5,
      height: 5,
      cells: createInitialState().cells,
      thief: { row: 2, col: 2 },
      cops: [],
      phase: 'thief',
      currentPlayer: 1,
      maxCops: 10,
      status: 'playing',
    };
    const next = applyMove(s, { type: 'step', row: 2, col: 1 });
    expect(next.thief).toEqual({ row: 2, col: 1 });
    expect(next.phase).toBe('cop');
    expect(next.currentPlayer).toBe(0);
    expect(next.status).toBe('playing');
  });

  it('thief reaching exit sets thief-win', () => {
    const s: ThiefSiegeState = {
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
    };
    const next = applyMove(s, { type: 'step', row: 0, col: 1 });
    expect(next.thief).toEqual({ row: 0, col: 1 });
    expect(next.status).toBe('thief-win');
    expect(isSolved(next)).toBe(false);
  });
});

function trappedThiefState(): ThiefSiegeState {
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

describe('normalizeTerminalState', () => {
  it('sets cop-win for hand-crafted trapped thief phase', () => {
    const s = trappedThiefState();
    const next = normalizeTerminalState(s);
    expect(next.status).toBe('cop-win');
    expect(isSolved(next)).toBe(true);
    expect(legalMoves(next)).toEqual([]);
  });

  it('leaves playing thief phase with moves unchanged', () => {
    const s: ThiefSiegeState = {
      ...trappedThiefState(),
      cops: [{ row: 0, col: 1 }],
    };
    const next = normalizeTerminalState(s);
    expect(next.status).toBe('playing');
    expect(next).toBe(s);
  });
});

describe('cop-win', () => {
  it('declares cop-win when thief has no legal steps after a place', () => {
    const s: ThiefSiegeState = {
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
      ],
      phase: 'cop',
      currentPlayer: 0,
      maxCops: 10,
      status: 'playing',
    };
    const next = applyMove(s, { type: 'place', row: 1, col: 2 });
    expect(next.status).toBe('cop-win');
    expect(isSolved(next)).toBe(true);
    expect(legalMoves(next)).toEqual([]);
  });
});

describe('isSolved', () => {
  it('is true only for cop-win', () => {
    expect(isSolved({ ...createInitialState(), status: 'cop-win' })).toBe(true);
    expect(isSolved({ ...createInitialState(), status: 'thief-win' })).toBe(false);
    expect(isSolved(createInitialState())).toBe(false);
  });
});
