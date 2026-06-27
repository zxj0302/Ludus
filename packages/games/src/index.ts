export * from './registry';
export * from './types';
export * from './lights-out';
export * from './sokoban';
export * from './sudoku';
export * from './nim';
export * from './wythoff';

// Board components — Lights Out doesn't re-export from its index, export explicitly
export { LightsOutBoard } from './lights-out/render';

// Types
export type { LightsOutState, LightsOutMove } from './lights-out/types';
export type { SokobanState, SokobanMove } from './sokoban/types';
export type { SudokuState, SudokuMove } from './sudoku/types';
export type { NimState, NimMove } from './nim/types';
export type { WythoffState, WythoffMove } from './wythoff/types';
