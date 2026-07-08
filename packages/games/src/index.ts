export * from './registry';
export * from './types';
export * from './lights-out';
export * from './sokoban';
export * from './sudoku';
export * from './nim';
export * from './wythoff';
export * from './fifteen';
export * from './water-jug';

// Types — used by apps/web components (statusCards, viz, hooks)
export type { LightsOutState, LightsOutMove } from './lights-out/types';
export type { SokobanState, SokobanMove } from './sokoban/types';
export type { SudokuState, SudokuMove } from './sudoku/types';
export type { NimState, NimMove } from './nim/types';
export type { WythoffState, WythoffMove } from './wythoff/types';
export type { FifteenState, FifteenMove } from './fifteen/types';
export type { WaterJugState, WaterJugMove } from './water-jug/types';
