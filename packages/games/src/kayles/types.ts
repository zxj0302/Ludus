import type { GameState, Move } from '@ludus/core';

export interface KaylesState extends GameState {
  /** Pin still standing; index stable for UI across the game. */
  alive: boolean[];
  currentPlayer: 0 | 1;
  /** Opening chain length (= alive.length at create / generate). */
  initialLength: number;
  phase: 'choosing' | 'playing';
}

/** Knock `count` adjacent standing pins starting at `index`. */
export interface KaylesMove extends Move {
  index: number;
  count: 1 | 2;
}
