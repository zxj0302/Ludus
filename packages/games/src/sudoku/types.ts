import type { GameState, Move } from '@ludus/core';

/** Standard 9x9 Sudoku state */
export interface SudokuState extends GameState {
  /** Grid dimension (9 for standard) */
  n: number;
  /** Flat grid of length n*n, 0 = empty, 1-9 = filled */
  grid: number[];
  /** Flat mask of length n*n, true = initial clue (immutable) */
  givenMask: boolean[];
}

/** A Sudoku move: place a digit or erase */
export interface SudokuMove extends Move {
  row: number;   // 0-8
  col: number;   // 0-8
  value: number; // 1-9 to place, 0 to erase (non-given cells only)
}
