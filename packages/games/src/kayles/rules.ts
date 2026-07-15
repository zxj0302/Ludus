import type { Difficulty } from '@ludus/core';
import type { KaylesMove, KaylesState } from './types';
import { computeKaylesDifficulty } from './difficulty';
import { solveKayles } from './solver';

export type { KaylesMove, KaylesState };
export { findKaylesWinningMove, isKaylesPPosition, computeKaylesGrundy, chainXor } from './solver';

export function solveKaylesState(state: KaylesState) {
  return solveKayles(state);
}

export function getDifficulty(state: KaylesState): Difficulty {
  return computeKaylesDifficulty(state.initialLength);
}

const DEFAULT_N = 8;

/** Demo: single full chain of 8 pins. */
export function createInitialState(): KaylesState {
  return {
    alive: Array.from({ length: DEFAULT_N }, () => true),
    currentPlayer: 0,
    initialLength: DEFAULT_N,
    phase: 'choosing',
  };
}

export function chooseHand(state: KaylesState, playerFirst: boolean): KaylesState {
  if (state.phase !== 'choosing') return state;
  return {
    ...state,
    currentPlayer: playerFirst ? 0 : 1,
    phase: 'playing',
  };
}

export function isTerminalAlive(alive: boolean[]): boolean {
  return alive.every(a => !a);
}

/** Lengths of maximal contiguous true runs. */
export function chainLengths(alive: boolean[]): number[] {
  const lengths: number[] = [];
  let run = 0;
  for (const a of alive) {
    if (a) {
      run += 1;
    } else if (run > 0) {
      lengths.push(run);
      run = 0;
    }
  }
  if (run > 0) lengths.push(run);
  return lengths;
}

export function legalMoves(state: KaylesState): KaylesMove[] {
  if (state.phase !== 'playing' || state.currentPlayer !== 0) return [];
  return legalMovesForPlayer(state, 0);
}

export function legalMovesForPlayer(state: KaylesState, player: 0 | 1): KaylesMove[] {
  if (state.phase !== 'playing' || state.currentPlayer !== player) return [];
  if (isTerminalAlive(state.alive)) return [];

  const moves: KaylesMove[] = [];
  const { alive } = state;
  for (let i = 0; i < alive.length; i += 1) {
    if (alive[i]) moves.push({ index: i, count: 1 });
  }
  for (let i = 0; i < alive.length - 1; i += 1) {
    if (alive[i] && alive[i + 1]) moves.push({ index: i, count: 2 });
  }
  return moves;
}

export function applyMove(state: KaylesState, move: KaylesMove): KaylesState {
  if (state.phase !== 'playing' || isTerminalAlive(state.alive)) return state;

  const { index, count } = move;
  if (count !== 1 && count !== 2) return state;
  if (index < 0 || index >= state.alive.length) return state;
  if (!state.alive[index]) return state;
  if (count === 2) {
    if (index + 1 >= state.alive.length || !state.alive[index + 1]) return state;
  }

  const alive = [...state.alive];
  alive[index] = false;
  if (count === 2) alive[index + 1] = false;

  return {
    ...state,
    alive,
    currentPlayer: state.currentPlayer === 0 ? 1 : 0,
  };
}

export function isSolved(state: KaylesState): boolean {
  return isTerminalAlive(state.alive);
}

/** Human won iff terminal and it is AI's turn (human just moved). */
export function isPlayerVictory(state: KaylesState): boolean {
  return isSolved(state) && state.currentPlayer === 1;
}

export function isOwnState(state: unknown): state is KaylesState {
  if (state == null || typeof state !== 'object') return false;
  const s = state as KaylesState;
  if (!Array.isArray(s.alive) || s.alive.length === 0) return false;
  if (!s.alive.every(a => typeof a === 'boolean')) return false;
  if (!Number.isInteger(s.initialLength) || s.initialLength !== s.alive.length) return false;
  return (
    (s.currentPlayer === 0 || s.currentPlayer === 1)
    && (s.phase === 'choosing' || s.phase === 'playing')
  );
}
