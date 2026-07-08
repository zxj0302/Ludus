import type { GameState, Move } from '@ludus/core';

export interface WaterJugState extends GameState {
  /** Current water amount in each jug */
  jugs: number[];
  /** Maximum capacity of each jug (fixed for the puzzle instance) */
  capacities: number[];
  /** Target amount to measure */
  target: number;
}

export type WaterJugMove = Move & (
  | { type: 'fill'; jugIndex: number }
  | { type: 'empty'; jugIndex: number }
  | { type: 'pour'; from: number; to: number }
);
