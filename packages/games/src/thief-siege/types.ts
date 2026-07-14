import type { GameState, Move } from '@ludus/core';

export type CellKind = 'floor' | 'obstacle' | 'exit';

export interface ThiefSiegeState extends GameState {
  width: number;
  height: number;
  /** row-major; obstacles and non-playable area use obstacle */
  cells: CellKind[];
  thief: { row: number; col: number };
  cops: { row: number; col: number }[];
  /** 'cop' = player placement turn; 'thief' = AI movement turn */
  phase: 'cop' | 'thief';
  /** 0 = player (cop), 1 = AI (thief) */
  currentPlayer: 0 | 1;
  maxCops: number;
  status: 'playing' | 'cop-win' | 'thief-win';
}

export type ThiefSiegeMove = Move & (
  | { type: 'place'; row: number; col: number }
  | { type: 'step'; row: number; col: number }
);
