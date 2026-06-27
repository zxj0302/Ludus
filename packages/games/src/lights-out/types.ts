import type { GameState, Move } from '@ludus/core';

export interface LightsOutState extends GameState {
  n: number;
  grid: number[]; // length n*n, 0 = off, 1 = on
}

export interface LightsOutMove extends Move {
  row: number;
  col: number;
}
