import type { Difficulty, Solution } from '@ludus/core';
import type { FifteenState, FifteenMove } from './types';
import { GOAL_GRID, SIZE } from './types';
import { computeFifteenDifficulty } from './difficulty';

export type { FifteenState, FifteenMove };

export function createInitialState(): FifteenState {
  return { grid: [...GOAL_GRID] };
}

export function serializeGrid(grid: number[]): string {
  return grid.join(',');
}

function findEmpty(grid: number[]): number {
  return grid.indexOf(0);
}

export function legalMoves(state: FifteenState): FifteenMove[] {
  const emptyIdx = findEmpty(state.grid);
  const row = Math.floor(emptyIdx / SIZE);
  const col = emptyIdx % SIZE;
  const moves: FifteenMove[] = [];
  if (row > 0) moves.push({ tileIndex: emptyIdx - SIZE }); // tile below slides up
  if (row < SIZE - 1) moves.push({ tileIndex: emptyIdx + SIZE }); // tile above slides down
  if (col > 0) moves.push({ tileIndex: emptyIdx - 1 }); // tile right slides left
  if (col < SIZE - 1) moves.push({ tileIndex: emptyIdx + 1 }); // tile left slides right
  return moves;
}

export function applyMove(state: FifteenState, move: FifteenMove): FifteenState {
  const emptyIdx = findEmpty(state.grid);
  const { tileIndex } = move;
  // Validate adjacency
  const dr = Math.abs(Math.floor(tileIndex / SIZE) - Math.floor(emptyIdx / SIZE));
  const dc = Math.abs((tileIndex % SIZE) - (emptyIdx % SIZE));
  if (dr + dc !== 1) return state;
  if (state.grid[tileIndex] === 0) return state;

  const newGrid = [...state.grid];
  newGrid[emptyIdx] = newGrid[tileIndex]!;
  newGrid[tileIndex] = 0;
  return { grid: newGrid };
}

export function isSolved(state: FifteenState): boolean {
  for (let i = 0; i < 16; i++) {
    if (state.grid[i] !== GOAL_GRID[i]) return false;
  }
  return true;
}

export function getDifficulty(state: FifteenState): Difficulty {
  // getDifficulty takes the current state — we use a placeholder score
  // since the "true" difficulty is set at generation time
  return computeFifteenDifficulty(0);
}
