import { describe, it, expect } from 'vitest';
import {
  createLightsOutState,
  createLightsOutStateFromGrid,
  legalMoves,
  applyMove,
  isSolved,
  solveLightsOut,
  getDifficulty,
} from './rules';
import type { LightsOutState } from './rules';

describe('createLightsOutState', () => {
  it('creates all-off state for default 5×5', () => {
    const state = createLightsOutState(5);
    expect(state.n).toBe(5);
    expect(state.grid.length).toBe(25);
    expect(state.grid.every(c => c === 0)).toBe(true);
  });

  it('creates a 3×3 state', () => {
    const state = createLightsOutState(3);
    expect(state.n).toBe(3);
    expect(state.grid.length).toBe(9);
  });
});

describe('createLightsOutStateFromGrid', () => {
  it('infers size from grid length', () => {
    const grid = [0, 1, 0, 1, 0, 1, 0, 1, 0]; // 3×3
    const state = createLightsOutStateFromGrid(grid);
    expect(state.n).toBe(3);
    expect(state.grid).toEqual(grid);
  });
});

describe('legalMoves', () => {
  it('returns n² moves', () => {
    const state = createLightsOutState(4);
    const moves = legalMoves(state);
    expect(moves.length).toBe(16);
  });

  it('all moves have valid row/col', () => {
    const state = createLightsOutState(5);
    const moves = legalMoves(state);
    for (const m of moves) {
      expect(m.row).toBeGreaterThanOrEqual(0);
      expect(m.row).toBeLessThan(5);
      expect(m.col).toBeGreaterThanOrEqual(0);
      expect(m.col).toBeLessThan(5);
    }
  });
});

describe('applyMove', () => {
  it('toggles the pressed cell and neighbors', () => {
    const state = createLightsOutState(3);
    // Press center (1,1) on 3×3
    const newState = applyMove(state, { row: 1, col: 1 });
    // Center + up + down + left + right = 5 toggled
    const onCount = newState.grid.filter(c => c === 1).length;
    expect(onCount).toBe(5);
    expect(newState.grid[1 * 3 + 1]).toBe(1); // center
    expect(newState.grid[0 * 3 + 1]).toBe(1); // up
    expect(newState.grid[2 * 3 + 1]).toBe(1); // down
    expect(newState.grid[1 * 3 + 0]).toBe(1); // left
    expect(newState.grid[1 * 3 + 2]).toBe(1); // right
  });

  it('handles corner press (only 3 toggled)', () => {
    const state = createLightsOutState(3);
    const newState = applyMove(state, { row: 0, col: 0 });
    const onCount = newState.grid.filter(c => c === 1).length;
    expect(onCount).toBe(3); // corner + right + down
  });

  it('toggling twice returns to original', () => {
    const state = createLightsOutState(5);
    const mid = applyMove(state, { row: 2, col: 2 });
    const back = applyMove(mid, { row: 2, col: 2 });
    expect(back.grid).toEqual(state.grid);
  });

  it('does not mutate original state', () => {
    const state = createLightsOutState(5);
    const originalGrid = [...state.grid];
    applyMove(state, { row: 0, col: 0 });
    expect(state.grid).toEqual(originalGrid);
  });
});

describe('isSolved', () => {
  it('all-off is solved', () => {
    const state = createLightsOutState(5);
    expect(isSolved(state)).toBe(true);
  });

  it('state with any on is not solved', () => {
    const state = createLightsOutState(5);
    const modified = applyMove(state, { row: 0, col: 0 });
    expect(isSolved(modified)).toBe(false);
  });
});

describe('solveLightsOut', () => {
  it('finds solution for all-off state (trivial)', () => {
    const state = createLightsOutState(5);
    const result = solveLightsOut(state);
    expect(result.solvable).toBe(true);
    expect(result.moves.length).toBe(0); // already solved
  });

  it('finds solution for a solvable state', () => {
    const state = createLightsOutState(5);
    // Apply 3 random moves to create a solvable state
    let s = state;
    s = applyMove(s, { row: 0, col: 0 });
    s = applyMove(s, { row: 3, col: 2 });
    s = applyMove(s, { row: 4, col: 4 });

    const result = solveLightsOut(s);
    expect(result.solvable).toBe(true);
    expect(result.moves.length).toBeGreaterThan(0);

    // Verify: applying the solution moves should solve the state
    let solved = s;
    for (const m of result.moves) {
      solved = applyMove(solved, m as { row: number; col: number });
    }
    expect(isSolved(solved)).toBe(true);
  });

  it('always solvable for 5×5 by construction', () => {
    // 构造法：从全灭出发点的任何状态天然可解
    const state = createLightsOutState(5);
    const s = applyMove(state, { row: 2, col: 2 });
    const result = solveLightsOut(s);
    expect(result.solvable).toBe(true);
  });

  it('returns matrix-transform trace', () => {
    const state = createLightsOutState(5);
    const s = applyMove(state, { row: 0, col: 0 });
    const result = solveLightsOut(s);
    expect(result.trace).toBeDefined();
    expect(result.trace!.type).toBe('matrix-transform');
    expect(result.trace!.steps.length).toBeGreaterThan(0);
  });
});

describe('getDifficulty', () => {
  it('returns score 0 for already-solved state', () => {
    const state = createLightsOutState(5);
    const d = getDifficulty(state);
    expect(d.score).toBe(0);
    expect(d.labelKey).toBe('difficulty.easy');
  });

  it('returns non-trivial score for a state with lights on', () => {
    const state = createLightsOutState(5);
    const s = applyMove(state, { row: 0, col: 0 });
    const d = getDifficulty(s);
    expect(d.score).toBeGreaterThan(0);
  });

  it('returns appropriate label key', () => {
    const state = createLightsOutState(5);
    const d = getDifficulty(state);
    expect(d.labelKey).toMatch(/^difficulty\./);
  });
});
