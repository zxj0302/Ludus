import type { GameState } from '@ludus/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from './gameStore';
import { useProgressStore } from './progressStore';

beforeEach(() => {
  useGameStore.setState({
    gameId: null,
    plugin: null,
    gameState: null,
    history: [],
    historyIndex: -1,
    generatorParamsByGame: {},
    lastGeneratedLevel: null,
    generatorError: null,
    difficultyRangeByGame: {},
  });
  useProgressStore.setState({ records: {}, recentGameId: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gameStore generator params', () => {
  it('does not apply Create-card advanced params to default toolbar generation', () => {
    const store = useGameStore.getState();

    store.loadGame('lights-out');
    store.setGeneratorParam('lights-out', 'size', 3);
    store.newLevel();

    const state = useGameStore.getState().gameState as { n: number; grid: number[] };

    expect(state.n).toBe(5);
    expect(state.grid).toHaveLength(25);
  });

  it('passes advanced generator params into explicit advanced generation', () => {
    const store = useGameStore.getState();

    store.loadGame('lights-out');
    store.setGeneratorParam('lights-out', 'size', 3);
    store.setGeneratorParam('lights-out', 'minMoves', 2);
    store.setGeneratorParam('lights-out', 'maxMoves', 2);
    store.setGeneratorParam('lights-out', 'requireUniqueSolution', true);
    store.setGeneratorParam('lights-out', 'requireKnownOptimal', false);
    store.newLevel({ useGeneratorParams: true });

    const state = useGameStore.getState().gameState as { n: number; grid: number[] };
    const level = useGameStore.getState().lastGeneratedLevel;

    expect(state.n).toBe(3);
    expect(state.grid).toHaveLength(9);
    expect(level?.gameId).toBe('lights-out');
    expect(level?.uniqueSolution).toBe(true);
  });

  it('ignores invalid numeric generator params instead of storing NaN', () => {
    const store = useGameStore.getState();

    store.setGeneratorParam('lights-out', 'minMoves', Number.NaN);

    expect(useGameStore.getState().generatorParamsByGame['lights-out']?.minMoves).toBeUndefined();
  });

  it('clears the generated-level summary when resetting away from generated flow', () => {
    const store = useGameStore.getState();

    store.loadGame('lights-out');
    store.setGeneratorParam('lights-out', 'size', 3);
    store.newLevel({ useGeneratorParams: true });
    expect(useGameStore.getState().lastGeneratedLevel?.gameId).toBe('lights-out');

    store.reset();

    expect(useGameStore.getState().lastGeneratedLevel).toBeNull();
  });

  it('prepends plugin-created history through the store persistence path', () => {
    const store = useGameStore.getState();

    store.loadGame('lights-out');
    const introState = { n: 5, grid: Array.from({ length: 25 }, (_, idx) => (idx === 0 ? 1 : 0)) };

    const actionStore = useGameStore.getState() as typeof store & {
      prependHistory?: (state: GameState) => void;
    };
    actionStore.prependHistory?.(introState);

    const state = useGameStore.getState();
    const progress = useProgressStore.getState().getRecord('lights-out');

    expect(state.history[0]).toEqual(introState);
    expect(state.historyIndex).toBe(1);
    expect(progress?.snapshot.moveHistory[0]).toEqual(introState);
    expect(progress?.snapshot.stepCount).toBe(1);
  });

  it('keeps the current level when advanced generation fails', () => {
    const store = useGameStore.getState();

    store.loadGame('lights-out');
    const beforeState = useGameStore.getState().gameState;
    const beforeLevel = useGameStore.getState().lastGeneratedLevel;
    const plugin = useGameStore.getState().plugin!;

    vi.spyOn(plugin, 'generateLevel').mockImplementation(() => {
      throw new Error('constraints not met');
    });

    store.setGeneratorParam('lights-out', 'size', 3);
    store.newLevel({ useGeneratorParams: true });

    const after = useGameStore.getState();
    expect(after.gameState).toBe(beforeState);
    expect(after.lastGeneratedLevel).toBe(beforeLevel);
    expect(after.generatorError).toBe('constraints not met');
  });

  it('still falls back for default toolbar generation failures', () => {
    const store = useGameStore.getState();

    store.loadGame('lights-out');
    const beforeState = useGameStore.getState().gameState;
    const plugin = useGameStore.getState().plugin!;

    vi.spyOn(plugin, 'generateLevel').mockImplementation(() => {
      throw new Error('constraints not met');
    });

    store.newLevel();

    const after = useGameStore.getState();
    expect(after.gameState).not.toBe(beforeState);
    expect(after.generatorError).toBeNull();
    expect(after.lastGeneratedLevel?.generatedBy).toBe('initial-state-fallback');
  });

  it('keeps difficulty presets per game instead of sharing one global range', () => {
    const store = useGameStore.getState();

    store.loadGame('lights-out');
    store.setDifficultyRange([34, 66]);
    store.loadGame('sudoku');
    store.setDifficultyRange([1, 33]);
    store.loadGame('lights-out');

    expect(useGameStore.getState().difficultyRangeByGame['lights-out']).toEqual([34, 66]);
    expect(useGameStore.getState().difficultyRangeByGame['sudoku']).toEqual([1, 33]);
  });
});
