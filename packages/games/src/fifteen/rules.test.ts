import { describe, it, expect } from 'vitest';
import { createInitialState, legalMoves, applyMove, isSolved } from './rules';
import { GOAL_GRID } from './types';
import type { FifteenState, FifteenMove } from './types';

describe('Fifteen rules', () => {
  it('initial state is solved', () => {
    expect(isSolved(createInitialState())).toBe(true);
  });

  it('legalMoves returns 2 moves for corner empty', () => {
    // Empty at (0,0) → tiles at (0,1) and (1,0) can slide
    const state: FifteenState = { grid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const moves = legalMoves(state);
    expect(moves).toHaveLength(2);
    expect(moves.map(m => m.tileIndex).sort()).toEqual([1, 4]);
  });

  it('legalMoves returns 3 moves for edge empty', () => {
    // Empty at (0,1)
    const state: FifteenState = { grid: [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const moves = legalMoves(state);
    expect(moves).toHaveLength(3);
  });

  it('legalMoves returns 4 moves for center empty', () => {
    // Empty at (1,1)
    const grid = [...GOAL_GRID];
    grid[5] = 0; // position (1,1)
    grid[15] = 5;
    const state: FifteenState = { grid };
    const moves = legalMoves(state);
    expect(moves).toHaveLength(4);
  });

  it('applyMove swaps tile with empty', () => {
    const state: FifteenState = { grid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const newState = applyMove(state, { tileIndex: 1 });
    expect(newState.grid[0]).toBe(1);
    expect(newState.grid[1]).toBe(0);
  });

  it('applyMove rejects non-adjacent tile', () => {
    const state: FifteenState = { grid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const newState = applyMove(state, { tileIndex: 15 });
    expect(newState).toBe(state); // Same reference = no change
  });

  it('applyMove rejects empty tile', () => {
    const state: FifteenState = { grid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const newState = applyMove(state, { tileIndex: 0 });
    expect(newState).toBe(state);
  });

  it('sequence of moves from solved produces non-solved state', () => {
    let state: FifteenState = { grid: [...GOAL_GRID] };
    // Slide tile 15 (at index 14) into the empty space (at index 15)
    state = applyMove(state, { tileIndex: 14 });
    expect(isSolved(state)).toBe(false);
  });

  it('undo sequence restores solved', () => {
    let state: FifteenState = { grid: [...GOAL_GRID] };
    // Slide tile 12 (at index 11) down into empty (at index 15)
    state = applyMove(state, { tileIndex: 11 });
    expect(isSolved(state)).toBe(false);
    // Empty is now at index 11; tile at index 15 is the one that was just moved
    const moves = legalMoves(state);
    const undoMove = moves.find(m => m.tileIndex === 15);
    expect(undoMove).toBeDefined();
    if (undoMove) {
      state = applyMove(state, undoMove);
      expect(isSolved(state)).toBe(true);
    }
  });
});
