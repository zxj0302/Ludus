import type { Difficulty } from '@ludus/core';
import type { GrundysGameMove, GrundysGameState } from './types';
import { computeGrundysDifficulty } from './difficulty';
import { computeGrundyXor, solveGrundysGame } from './solver';

export type { GrundysGameMove, GrundysGameState };
export { findWinningMove, isPPosition, computeGrundy, computeGrundyXor } from './solver';

export function solveGrundysGameState(state: GrundysGameState) {
  return solveGrundysGame(state);
}

export function getDifficulty(state: GrundysGameState): Difficulty {
  const firstPlayerIsN = computeGrundyXor(state.initialPiles ?? state.piles) !== 0;
  return computeGrundysDifficulty(state.initialPiles ?? state.piles, firstPlayerIsN);
}

/** Demo opening: three heaps, all splittable. */
export function createInitialState(): GrundysGameState {
  return {
    piles: [3, 5, 7],
    currentPlayer: 0,
    initialPiles: [3, 5, 7],
    phase: 'choosing',
  };
}

export function chooseHand(state: GrundysGameState, playerFirst: boolean): GrundysGameState {
  if (state.phase !== 'choosing') return state;
  return {
    ...state,
    currentPlayer: playerFirst ? 0 : 1,
    phase: 'playing',
  };
}

/** Heaps of size ≤ 2 cannot be split unequally. */
export function isTerminalPiles(piles: number[]): boolean {
  return piles.length === 0 || piles.every(n => n <= 2);
}

/** Legal smaller halves when splitting a heap of size `n`. */
export function legalSplits(n: number): number[] {
  if (n < 3) return [];
  const maxLeft = Math.floor((n - 1) / 2);
  return Array.from({ length: maxLeft }, (_, i) => i + 1);
}

export function legalMoves(state: GrundysGameState): GrundysGameMove[] {
  if (state.phase !== 'playing' || state.currentPlayer !== 0) return [];
  if (isTerminalPiles(state.piles)) return [];
  return legalMovesForPlayer(state, 0);
}

export function legalMovesForPlayer(state: GrundysGameState, player: 0 | 1): GrundysGameMove[] {
  if (state.phase !== 'playing' || state.currentPlayer !== player) return [];
  if (isTerminalPiles(state.piles)) return [];

  const moves: GrundysGameMove[] = [];
  for (let pileIndex = 0; pileIndex < state.piles.length; pileIndex += 1) {
    const n = state.piles[pileIndex]!;
    for (const left of legalSplits(n)) {
      moves.push({ pileIndex, left, right: n - left });
    }
  }
  return moves;
}

/**
 * Replace pile at `pileIndex` with `left` and `n - left` (in that order).
 * Always toggles `currentPlayer` (Nim-style: player facing a terminal position loses).
 */
export function applyMove(state: GrundysGameState, move: GrundysGameMove): GrundysGameState {
  if (state.phase !== 'playing' || isTerminalPiles(state.piles)) return state;

  const { pileIndex, left } = move;
  const n = state.piles[pileIndex];
  if (n == null || pileIndex < 0 || pileIndex >= state.piles.length) return state;
  if (!legalSplits(n).includes(left)) return state;

  const right = move.right ?? n - left;
  if (right !== n - left) return state;
  const newPiles = [
    ...state.piles.slice(0, pileIndex),
    left,
    right,
    ...state.piles.slice(pileIndex + 1),
  ];

  return {
    ...state,
    piles: newPiles,
    currentPlayer: state.currentPlayer === 0 ? 1 : 0,
  };
}

export function isSolved(state: GrundysGameState): boolean {
  return isTerminalPiles(state.piles);
}

/** Human won iff the position is terminal and it is AI's turn (human just moved). */
export function isPlayerVictory(state: GrundysGameState): boolean {
  return isSolved(state) && state.currentPlayer === 1;
}

export function isOwnState(state: unknown): state is GrundysGameState {
  if (state == null || typeof state !== 'object') return false;
  const s = state as GrundysGameState;
  if (!Array.isArray(s.piles) || s.piles.length === 0) return false;
  if (!s.piles.every(n => Number.isInteger(n) && n >= 1)) return false;
  if (!Array.isArray(s.initialPiles) || s.initialPiles.length === 0) return false;
  if (!s.initialPiles.every(n => Number.isInteger(n) && n >= 1)) return false;
  return (
    (s.currentPlayer === 0 || s.currentPlayer === 1)
    && (s.phase === 'choosing' || s.phase === 'playing')
  );
}
