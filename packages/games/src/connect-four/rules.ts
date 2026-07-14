import type { Difficulty, Solution } from '@ludus/core';
import type { ConnectFourMove, ConnectFourState } from './types';
import { COLS } from './types';
import {
  countPieces,
  createEmptyBoard,
  detectExistingWinner,
  dropDisc,
  isColumnFull,
  resolveWinner,
} from './board';
import { computeConnectFourDifficulty } from './difficulty';
import { findBestMove, solveConnectFour } from './solver';

export type { ConnectFourMove, ConnectFourState };

function inferPlayerStarts(state: ConnectFourState): boolean {
  if (state.playerStarts !== undefined) return state.playerStarts;
  return true;
}

export function expectedCurrentPlayer(pieces: number, playerZeroStarts: boolean): 0 | 1 {
  if (pieces === 0) return playerZeroStarts ? 0 : 1;
  const playerZeroTurn = pieces % 2 === 0;
  return playerZeroStarts
    ? (playerZeroTurn ? 0 : 1)
    : (playerZeroTurn ? 1 : 0);
}

export function createInitialState(): ConnectFourState {
  return normalizeState({
    board: createEmptyBoard(),
    currentPlayer: 0,
    phase: 'choosing',
    winner: null,
  });
}

/** Reconcile winner / phase invariants after load or generation. */
export function normalizeState(state: ConnectFourState): ConnectFourState {
  const pieces = countPieces(state.board);
  const detected = state.winner === null ? detectExistingWinner(state.board) : state.winner;

  if (detected !== null) {
    return { ...state, winner: detected, phase: 'playing' };
  }

  if (pieces === 0) {
    if (state.phase === 'choosing') {
      return { ...state, winner: null, currentPlayer: 0 };
    }
    const starts = inferPlayerStarts(state);
    return { ...state, phase: 'playing', winner: null, currentPlayer: starts ? 0 : 1 };
  }

  const starts = inferPlayerStarts(state);
  return {
    ...state,
    phase: 'playing',
    winner: null,
    currentPlayer: expectedCurrentPlayer(pieces, starts),
  };
}

export function isGameOver(state: ConnectFourState): boolean {
  return state.winner !== null;
}

export function isPlayerVictory(state: ConnectFourState): boolean {
  return state.winner === 0;
}

export function chooseHand(state: ConnectFourState, playerFirst: boolean): ConnectFourState {
  if (state.phase !== 'choosing' || state.winner !== null) return state;
  if (countPieces(state.board) > 0) return state;
  return normalizeState({
    ...state,
    currentPlayer: playerFirst ? 0 : 1,
    phase: 'playing',
    playerStarts: playerFirst,
  });
}

export function isOwnState(state: unknown): state is ConnectFourState {
  if (state == null || typeof state !== 'object') return false;
  const s = state as ConnectFourState;
  return (
    Array.isArray(s.board) &&
    s.board.length === 6 &&
    s.board.every(row => Array.isArray(row) && row.length === 7) &&
    (s.currentPlayer === 0 || s.currentPlayer === 1) &&
    (s.phase === 'choosing' || s.phase === 'playing') &&
    (s.winner === null || s.winner === 0 || s.winner === 1 || s.winner === 'draw')
  );
}

export function legalMoves(state: ConnectFourState): ConnectFourMove[] {
  if (state.phase !== 'playing' || state.currentPlayer !== 0 || state.winner !== null) return [];
  const moves: ConnectFourMove[] = [];
  for (let column = 0; column < COLS; column += 1) {
    if (!isColumnFull(state.board, column)) moves.push({ column });
  }
  return moves;
}

/** All legal columns for the player whose turn it is (solver / AI). */
export function legalMovesForPlayer(state: ConnectFourState, player: 0 | 1): ConnectFourMove[] {
  if (state.winner !== null || state.phase !== 'playing' || state.currentPlayer !== player) return [];
  const moves: ConnectFourMove[] = [];
  for (let column = 0; column < COLS; column += 1) {
    if (!isColumnFull(state.board, column)) moves.push({ column });
  }
  return moves;
}

export function applyMove(state: ConnectFourState, move: ConnectFourMove): ConnectFourState {
  if (state.winner !== null) return state;
  if (state.phase !== 'playing') return state;
  if (move.column < 0 || move.column >= COLS) return state;

  const dropped = dropDisc(state.board, move.column, state.currentPlayer);
  if (!dropped) return state;

  const winner = resolveWinner(dropped.board, dropped.row, move.column);

  return normalizeState({
    ...state,
    board: dropped.board,
    currentPlayer: winner !== null ? state.currentPlayer : (state.currentPlayer === 0 ? 1 : 0),
    winner,
    lastColumn: move.column,
  });
}

export function isSolved(state: ConnectFourState): boolean {
  return isGameOver(state);
}

export function getDifficulty(state: ConnectFourState): Difficulty {
  return computeConnectFourDifficulty(state);
}

export function solveConnectFourState(state: ConnectFourState): Solution {
  return solveConnectFour(normalizeState(state), { maxDepth: 10, timeMs: 8_000 });
}
