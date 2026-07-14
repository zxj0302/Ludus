import { describe, expect, it } from 'vitest';
import { generateConnectFourLevel, prepareConnectFourLoadedState } from './generator';
import { createInitialState, isOwnState, normalizeState } from './rules';
import type { ConnectFourState } from './types';
import { createEmptyBoard } from './board';

describe('generateConnectFourLevel', () => {
  it('always starts empty in choosing phase', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const level = generateConnectFourLevel({ seed, difficultyRange: [0, 100] });
      const state = level.initialState as unknown as ConnectFourState;
      expect(isOwnState(state)).toBe(true);
      expect(state.phase).toBe('choosing');
      expect(state.winner).toBeNull();
      expect(state.board.flat().every(c => c === 0)).toBe(true);
      expect(state.aiMaxDepth).toBeGreaterThanOrEqual(4);
      expect(state.aiMaxDepth).toBeLessThanOrEqual(9);
    }
  });

  it('sets lower aiMaxDepth for easy preset range', () => {
    const level = generateConnectFourLevel({ seed: 42, difficultyRange: [1, 33] });
    const state = level.initialState as unknown as ConnectFourState;
    expect(state.aiMaxDepth).toBe(4);
    expect(level.difficulty.score).toBeLessThanOrEqual(33);
  });

  it('sets higher aiMaxDepth for hard preset range', () => {
    const level = generateConnectFourLevel({ seed: 42, difficultyRange: [67, 100] });
    const state = level.initialState as unknown as ConnectFourState;
    expect(state.aiMaxDepth).toBe(9);
    expect(level.difficulty.score).toBeGreaterThanOrEqual(67);
  });
});

describe('prepareConnectFourLoadedState', () => {
  it('resets fresh sessions to choosing while keeping aiMaxDepth from generated level', () => {
    const legacyMidgame: ConnectFourState = {
      board: (() => {
        const b = createEmptyBoard();
        b[5]![3] = 1;
        return b;
      })(),
      currentPlayer: 1,
      phase: 'playing',
      winner: null,
    };
    const fresh = prepareConnectFourLoadedState(legacyMidgame, { fresh: true });
    expect(fresh).toEqual(createInitialState());

    const generated: ConnectFourState = { ...createInitialState(), aiMaxDepth: 9 };
    const freshWithDepth = prepareConnectFourLoadedState(generated, { fresh: true });
    expect(freshWithDepth.phase).toBe('choosing');
    expect(freshWithDepth.aiMaxDepth).toBe(9);
  });

  it('normalizes resumed sessions without wiping progress', () => {
    const board = createEmptyBoard();
    board[5]![3] = 1;
    const resumed = prepareConnectFourLoadedState(
      { board, currentPlayer: 1, phase: 'playing', winner: null, playerStarts: true },
      { fresh: false },
    );
    expect(resumed.phase).toBe('playing');
    expect(resumed.currentPlayer).toBe(1);
    expect(normalizeState(resumed).winner).toBeNull();
  });
});
