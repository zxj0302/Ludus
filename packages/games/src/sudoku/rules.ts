// packages/games/src/sudoku/rules.ts
import type { GameState, Move, Solution, Difficulty } from '@ludus/core';
import { solveSudoku as dlxSolve, validateSudoku } from '@ludus/core';
import { computeSudokuDifficulty } from '@ludus/core';

export interface SudokuState extends GameState {
  n: number;
  grid: number[];
  givenMask: boolean[];
}

export interface SudokuMove extends Move {
  row: number;
  col: number;
  value: number;
}

/** Create initial empty state */
export function createInitialState(): SudokuState {
  return {
    n: 9,
    grid: new Array(81).fill(0),
    givenMask: new Array(81).fill(false),
  };
}

/** Get box index (0-8) for cell (r,c) */
function box(r: number, c: number): number {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

/**
 * Enumerate all legal moves: for each empty cell, all valid digits.
 */
export function legalMoves(state: SudokuState): SudokuMove[] {
  const { grid, n } = state;
  const size = n;

  // Pre-compute row/col/box sets
  const rowSets: Set<number>[] = Array.from({ length: size }, () => new Set());
  const colSets: Set<number>[] = Array.from({ length: size }, () => new Set());
  const boxSets: Set<number>[] = Array.from({ length: size }, () => new Set());

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r * size + c]!;
      if (v !== 0) {
        rowSets[r]!.add(v);
        colSets[c]!.add(v);
        boxSets[box(r, c)]!.add(v);
      }
    }
  }

  const moves: SudokuMove[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r * size + c]! !== 0) continue;
      for (let v = 1; v <= size; v++) {
        if (!rowSets[r]!.has(v) && !colSets[c]!.has(v) && !boxSets[box(r, c)]!.has(v)) {
          moves.push({ row: r, col: c, value: v });
        }
      }
    }
  }
  return moves;
}

/** Apply a move — immutable update */
export function applyMove(state: SudokuState, move: SudokuMove): SudokuState {
  const { n, grid, givenMask } = state;
  const idx = move.row * n + move.col;

  // Cannot modify given cells
  if (givenMask[idx]) return state;

  // No-op if same value
  if (grid[idx] === move.value) return state;

  const newGrid = [...grid];
  newGrid[idx] = move.value;

  return { n, grid: newGrid, givenMask };
}

/** Check if puzzle is complete and valid */
export function isSolved(state: SudokuState): boolean {
  const { grid } = state;
  // All cells filled
  if (grid.some(v => v === 0)) return false;
  // No conflicts
  return validateSudoku(grid);
}

/** Compute difficulty from clue count */
export function getDifficulty(state: SudokuState): Difficulty {
  const clues = state.givenMask.filter(Boolean).length;
  return computeSudokuDifficulty(clues);
}

/** Solve using DLX, convert result to Solution */
export function solveSudokuState(state: SudokuState): Solution {
  const dlxResult = dlxSolve(state.grid);

  if (!dlxResult.solvable || !dlxResult.grid) {
    return {
      solvable: false,
      moves: [],
      trace: dlxResult.trace,
      stats: dlxResult.stats,
    };
  }

  // Convert solved grid to move sequence
  const moves: SudokuMove[] = [];
  for (let r = 0; r < state.n; r++) {
    for (let c = 0; c < state.n; c++) {
      const idx = r * state.n + c;
      if (state.grid[idx] === 0) {
        moves.push({ row: r, col: c, value: dlxResult.grid[idx]! });
      }
    }
  }

  return {
    solvable: true,
    moves,
    trace: dlxResult.trace,
    stats: dlxResult.stats,
  };
}
