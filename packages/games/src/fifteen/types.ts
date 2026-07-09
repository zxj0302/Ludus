import type { GameState, Move } from '@ludus/core';

export interface FifteenState extends GameState {
  grid: number[]; // 16 elements, row-major, 0 = empty
  /** Scramble depth from generator — used for consistent difficulty scoring */
  scrambleDepth?: number;
}

export interface FifteenMove extends Move {
  tileIndex: number; // index of the tile being slid into the empty space
}

export const GOAL_GRID: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];

export const SIZE = 4;
