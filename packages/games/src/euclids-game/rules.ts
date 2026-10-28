import type { Difficulty, Solution } from '@ludus/core';
import type { EuclidPiles, EuclidsGameMove, EuclidsGameState } from './types';
import { solveEuclidsGame } from './solver';
import { computeEuclidsDifficulty } from './difficulty';
import { isPPosition } from './solver';

export type { EuclidsGameMove, EuclidsGameState };
export { findWinningMove, isPPosition } from './solver';

export function normalizePiles(a: number, b: number): EuclidPiles {
  const x = Math.max(a, b);
  const y = Math.min(a, b);
  return [x, y];
}

export function createInitialState(): EuclidsGameState {
  return {
    piles: [34, 21],
    currentPlayer: 0,
    initialPiles: [34, 21],
    phase: 'choosing',
  };
}

export function chooseHand(state: EuclidsGameState, playerFirst: boolean): EuclidsGameState {
  if (state.phase !== 'choosing') return state;
  return {
    ...state,
    currentPlayer: playerFirst ? 0 : 1,
    phase: 'playing',
  };
}

export function isTerminalPiles(piles: EuclidPiles): boolean {
  return piles[0] === 0 || piles[1] === 0;
}

export function legalMultiples(piles: EuclidPiles): number[] {
  const [larger, smaller] = piles;
  if (smaller <= 0 || larger <= 0) return [];
  const maxK = Math.floor(larger / smaller);
  if (maxK < 1) return [];
  return Array.from({ length: maxK }, (_, i) => i + 1);
}

export function legalMoves(state: EuclidsGameState): EuclidsGameMove[] {
  if (state.phase !== 'playing' || state.currentPlayer !== 0) return [];
  if (isTerminalPiles(state.piles)) return [];
  return legalMultiples(state.piles).map(multiple => ({ multiple }));
}

export function applyMultiple(piles: EuclidPiles, multiple: number): EuclidPiles | 'win' {
  const [larger, smaller] = piles;
  if (smaller <= 0 || multiple < 1 || multiple > Math.floor(larger / smaller)) {
    return piles;
  }
  const nextLarger = larger - multiple * smaller;
  if (nextLarger === 0) return 'win';
  return normalizePiles(nextLarger, smaller);
}

export function applyMove(state: EuclidsGameState, move: EuclidsGameMove): EuclidsGameState {
  if (isTerminalPiles(state.piles)) return state;

  const mover: 0 | 1 = state.phase === 'choosing'
    ? (!isPPosition(state.piles) ? 0 : 1)
    : state.currentPlayer;

  const result = applyMultiple(state.piles, move.multiple);
  if (result === 'win') {
    return {
      ...state,
      piles: [0, state.piles[1]],
      currentPlayer: mover,
      phase: 'playing',
    };
  }
  if (result === state.piles) return state;

  return {
    ...state,
    piles: result,
    currentPlayer: mover === 0 ? 1 : 0,
    phase: 'playing',
  };
}

export function isSolved(state: EuclidsGameState): boolean {
  return isTerminalPiles(state.piles);
}

export function isPlayerVictory(state: EuclidsGameState): boolean {
  return isSolved(state) && state.currentPlayer === 0;
}

export function isOwnState(state: unknown): state is EuclidsGameState {
  if (state == null || typeof state !== 'object') return false;
  const s = state as EuclidsGameState;
  if (!Array.isArray(s.piles) || s.piles.length !== 2) return false;
  if (!Number.isInteger(s.piles[0]) || !Number.isInteger(s.piles[1])) return false;
  if (s.initialPiles != null && (!Array.isArray(s.initialPiles) || s.initialPiles.length !== 2)) {
    return false;
  }
  return (
    (s.currentPlayer === 0 || s.currentPlayer === 1)
    && (s.phase === 'choosing' || s.phase === 'playing')
  );
}

export function legalMovesForPlayer(state: EuclidsGameState, player: 0 | 1): EuclidsGameMove[] {
  if (state.phase !== 'playing' || state.currentPlayer !== player) return [];
  if (isTerminalPiles(state.piles)) return [];
  return legalMultiples(state.piles).map(multiple => ({ multiple }));
}

export function getDifficulty(state: EuclidsGameState): Difficulty {
  const basePiles = state.initialPiles ?? state.piles;
  const firstPlayerIsN = !isPPosition(basePiles);
  return computeEuclidsDifficulty(basePiles, firstPlayerIsN);
}

export function solveEuclidsGameState(state: EuclidsGameState): Solution {
  return solveEuclidsGame(state);
}
