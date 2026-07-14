import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from './board';
import { findBestMove, findTacticalMove } from './solver';

function playingStateFromBoard(board = createEmptyBoard(), currentPlayer: 0 | 1 = 0) {
  return { board, currentPlayer, phase: 'playing' as const, winner: null };
}

describe('findBestMove', () => {
  it('chooses winning column when available', () => {
    const board = createEmptyBoard();
    board[5]![0] = 1;
    board[5]![1] = 1;
    board[5]![2] = 1;
    const state = { board, currentPlayer: 0 as const, phase: 'playing' as const, winner: null };
    const move = findBestMove(state, 0, { maxDepth: 4, timeMs: 1000 });
    expect(move?.column).toBe(3);
  });

  it('prefers center on empty board', () => {
    const move = findBestMove(playingStateFromBoard(), 0, { maxDepth: 3, timeMs: 1000 });
    expect(move?.column).toBe(3);
  });

  it('blocks opponent winning column', () => {
    const board = createEmptyBoard();
    board[5]![0] = 1;
    board[5]![1] = 1;
    board[5]![2] = 1;
    const state = playingStateFromBoard(board, 1);
    expect(findTacticalMove(state, 1)?.column).toBe(3);
    expect(findBestMove(state, 1, { maxDepth: 4, timeMs: 500 })?.column).toBe(3);
  });
});
