import type { Difficulty, Solution } from '@ludus/core';
import type { NimState, NimMove } from '@ludus/core';
import { computeNimSum, solveNim as coreSolveNim } from '@ludus/core';
import { computeNimDifficulty } from '@ludus/core';

export type { NimState, NimMove };

export function createInitialState(): NimState {
  return {
    piles: [3, 4, 5],
    currentPlayer: 0,
    initialPiles: [3, 4, 5],
  };
}

export function legalMoves(state: NimState): NimMove[] {
  const moves: NimMove[] = [];
  for (let i = 0; i < state.piles.length; i++) {
    const count = state.piles[i]!;
    for (let r = 1; r <= count; r++) {
      moves.push({ pileIndex: i, removeCount: r });
    }
  }
  return moves;
}

export function applyMove(state: NimState, move: NimMove): NimState {
  const { piles } = state;
  const idx = move.pileIndex;
  if (idx < 0 || idx >= piles.length) return state;
  if (move.removeCount < 1 || move.removeCount > piles[idx]!) return state;

  const newPiles = [...piles];
  newPiles[idx]! -= move.removeCount;

  return {
    piles: newPiles,
    currentPlayer: state.currentPlayer === 0 ? 1 : 0,
    initialPiles: state.initialPiles,
  };
}

export function isSolved(state: NimState): boolean {
  // Player wins: all piles empty and it's AI's turn (player took last stone)
  return state.piles.every(v => v === 0) && state.currentPlayer === 1;
}

export function getDifficulty(state: NimState): Difficulty {
  const pileCount = state.piles.length;
  const maxStones = Math.max(...state.piles);
  return computeNimDifficulty(pileCount, maxStones);
}

export function solveNimState(state: NimState): Solution {
  // Solve uses the current piles regardless of currentPlayer
  const tempState: NimState = { ...state, currentPlayer: 0 };
  return coreSolveNim(tempState);
}
