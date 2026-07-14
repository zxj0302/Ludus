import type { GameState, Move } from '@ludus/core';

export const ROWS = 6;
export const COLS = 7;
export const WIN_LENGTH = 4;

/** 0 = empty, 1 = player 0 disc, 2 = player 1 disc */
export type Cell = 0 | 1 | 2;

export interface ConnectFourState extends GameState {
  board: Cell[][];
  currentPlayer: 0 | 1;
  phase: 'choosing' | 'playing';
  winner: 0 | 1 | 'draw' | null;
  /** Set when hand is chosen: true if human (player 0) moved first. */
  playerStarts?: boolean;
  /** Alpha-Beta search depth for AI; set from toolbar difficulty preset. */
  aiMaxDepth?: number;
  lastColumn?: number;
}

export interface ConnectFourMove extends Move {
  column: number;
}
