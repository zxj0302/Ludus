import { describe, expect, it } from 'vitest';
import {
  applyMove,
  chooseHand,
  createInitialState,
  isOwnState,
  isPlayerVictory,
  isSolved,
  legalMoves,
  legalMovesForPlayer,
  normalizeState,
} from './rules';
import type { ConnectFourState } from './types';
import { createEmptyBoard, dropDisc, detectExistingWinner } from './board';

function playingState(board = createEmptyBoard(), currentPlayer: 0 | 1 = 0): ConnectFourState {
  return { board, currentPlayer, phase: 'playing', winner: null };
}

describe('createInitialState', () => {
  it('starts empty in choosing phase', () => {
    const s = createInitialState();
    expect(s.phase).toBe('choosing');
    expect(s.winner).toBeNull();
    expect(s.board.flat().every(cell => cell === 0)).toBe(true);
  });
});

describe('chooseHand', () => {
  it('sets first mover and enters playing', () => {
    const s = chooseHand(createInitialState(), false);
    expect(s.phase).toBe('playing');
    expect(s.currentPlayer).toBe(1);
    expect(s.playerStarts).toBe(false);
  });

  it('hands turn to human after AI opening move', () => {
    const opening = chooseHand(createInitialState(), false);
    const after = applyMove(opening, { column: 3 });
    expect(after.currentPlayer).toBe(0);
    expect(after.winner).toBeNull();
  });

  it('ignores chooseHand when board is not empty', () => {
    const board = createEmptyBoard();
    board[5]![3] = 1;
    const mid = { board, currentPlayer: 1 as const, phase: 'playing' as const, winner: null };
    expect(chooseHand(mid, true)).toBe(mid);
  });
});

describe('normalizeState', () => {
  it('fixes currentPlayer from piece count', () => {
    const board = createEmptyBoard();
    board[5]![3] = 1;
    const fixed = normalizeState({
      board,
      currentPlayer: 0,
      phase: 'playing',
      winner: null,
    });
    expect(fixed.currentPlayer).toBe(1);
  });

  it('detects existing winner on load', () => {
    const board = createEmptyBoard();
    board[5]![0] = 1;
    board[5]![1] = 1;
    board[5]![2] = 1;
    board[5]![3] = 1;
    const fixed = normalizeState({
      board,
      currentPlayer: 0,
      phase: 'playing',
      winner: null,
    });
    expect(fixed.winner).toBe(0);
  });
});

describe('isPlayerVictory', () => {
  it('is true only for human win', () => {
    expect(isPlayerVictory({ ...playingState(), winner: 0 })).toBe(true);
    expect(isPlayerVictory({ ...playingState(), winner: 1 })).toBe(false);
    expect(isPlayerVictory({ ...playingState(), winner: 'draw' })).toBe(false);
  });
});

describe('detectExistingWinner', () => {
  it('detects horizontal win', () => {
    const board = createEmptyBoard();
    board[5]![0] = 1;
    board[5]![1] = 1;
    board[5]![2] = 1;
    board[5]![3] = 1;
    expect(detectExistingWinner(board)).toBe(0);
  });
});

describe('legalMoves', () => {
  it('lists all columns on empty board for human turn', () => {
    expect(legalMoves(playingState()).map(m => m.column)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('returns empty on AI turn', () => {
    expect(legalMoves(playingState(createEmptyBoard(), 1))).toEqual([]);
  });

  it('omits full columns', () => {
    let board = createEmptyBoard();
    for (let row = 0; row < 6; row += 1) {
      board = dropDisc(board, 0, 0)!.board;
    }
    const moves = legalMoves(playingState(board));
    expect(moves.some(m => m.column === 0)).toBe(false);
    expect(moves.length).toBe(6);
  });
});

describe('applyMove', () => {
  it('drops to the bottom row', () => {
    const next = applyMove(playingState(), { column: 3 });
    expect(next.board[5]![3]).toBe(1);
    expect(next.currentPlayer).toBe(1);
    expect(next.lastColumn).toBe(3);
  });

  it('detects horizontal win', () => {
    const board = createEmptyBoard();
    board[5]![0] = 1;
    board[5]![1] = 1;
    board[5]![2] = 1;
    const win = applyMove(playingState(board), { column: 3 });
    expect(win.winner).toBe(0);
    expect(isSolved(win)).toBe(true);
  });

  it('rejects illegal full column', () => {
    let board = createEmptyBoard();
    for (let i = 0; i < 6; i += 1) board = dropDisc(board, 2, 0)!.board;
    const before = playingState(board);
    const after = applyMove(before, { column: 2 });
    expect(after).toBe(before);
  });
});

describe('isOwnState', () => {
  it('accepts valid connect-four state', () => {
    expect(isOwnState(createInitialState())).toBe(true);
  });

  it('rejects nim state', () => {
    expect(isOwnState({ piles: [1], currentPlayer: 0, phase: 'playing' })).toBe(false);
  });
});

describe('legalMovesForPlayer', () => {
  it('allows AI columns when it is AI turn', () => {
    const moves = legalMovesForPlayer(playingState(createEmptyBoard(), 1), 1);
    expect(moves.length).toBe(7);
  });
});
