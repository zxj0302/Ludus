import type { GameState, Move } from '@ludus/core';

/** Cell state in the player's grid */
export type CellState = 0 | 1 | 2;
export const EMPTY = 0 as CellState;   // unknown/undetermined
export const FILLED = 1 as CellState; // player filled
export const CROSS = 2 as CellState;  // player marked as empty

export interface NonogramState extends GameState {
  /** Grid width */
  width: number;
  /** Grid height */
  height: number;
  /** Player's grid: EMPTY, FILLED, or CROSS */
  grid: CellState[][];
  /** Row clues: each row's runs of consecutive filled cells */
  rowClues: number[][];
  /** Column clues: each column's runs of consecutive filled cells */
  colClues: number[][];
  /** The unique solution pattern (filled = true) */
  solution: boolean[][];
  /** How many cells were determined by line solving alone (for difficulty) */
  lineSolveCells: number;
  /** Maximum backtracking depth reached during solving (for difficulty) */
  maxBacktrackDepth: number;
}

export interface NonogramMove extends Move {
  row: number;
  col: number;
  action: 'fill' | 'cross';
}

/** Minimum grid size for generation */
export const MIN_GRID_SIZE = 5;
/** Maximum grid size for generation */
export const MAX_GRID_SIZE = 20;
/** Minimum fill density for generated patterns */
export const MIN_FILL_DENSITY = 0.35;
/** Maximum fill density for generated patterns */
export const MAX_FILL_DENSITY = 0.65;
