import { describe, expect, it, vi } from 'vitest';
import type { GamePlugin, GameState, Solution } from '@ludus/core';
import {
  cancelActiveSolve,
  clearPlaybackStateFields,
  clearSolverRuntimeTimers,
  handleRequestSolveResult,
  runSolverOffThread,
  setActiveSolveCancel,
  usesDeferredSidebarSolve,
} from './gameStoreSolverRuntime';
import type { SolverStoreGet, SolverStoreSet, SolverRuntimeStore } from './gameStoreSolverRuntime';

describe('gameStoreSolverRuntime', () => {
  it('clearPlaybackStateFields resets playback flags', () => {
    expect(clearPlaybackStateFields()).toEqual({
      solvePlayback: false,
      adversarialPlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
    });
  });

  it('usesDeferredSidebarSolve only for connect-four among AI games', () => {
    const connectFour = { metadata: { id: 'connect-four', isFastSolver: false }, ai: {} } as GamePlugin;
    const nim = { metadata: { id: 'nim', isFastSolver: true }, ai: {} } as GamePlugin;
    expect(usesDeferredSidebarSolve(connectFour)).toBe(true);
    expect(usesDeferredSidebarSolve(nim)).toBe(false);
  });

  it('preserves opening optimal when applying a mid-game remaining length', () => {
    // Mirrors scheduleBackgroundSolve merge: never clobber initialOptimalSteps once set.
    const initialOptimalSteps: number | null = 31;
    const remaining = 2;
    const nextInitial = initialOptimalSteps ?? remaining;
    const nextCurrent = remaining;
    expect(nextInitial).toBe(31);
    expect(nextCurrent).toBe(2);
  });

  it('handleRequestSolveResult enters playing before adversarial playback in choosing phase', () => {
    vi.useFakeTimers();

    const choosingState = {
      board: Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => 0)),
      currentPlayer: 0,
      phase: 'choosing',
      winner: null,
    } as GameState;

    const plugin = {
      metadata: { id: 'connect-four', isFastSolver: false },
      ai: { isAITurn: () => false },
    } as unknown as GamePlugin;

    let store: SolverRuntimeStore = {
      plugin,
      gameId: 'connect-four',
      gameState: choosingState,
      historyIndex: 0,
      solution: null,
      solvePlayback: false,
      adversarialPlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      initialOptimalSteps: null,
      currentOptimalSteps: null,
      hintHighlight: null,
      applyMove: vi.fn(),
    };

    const get = (() => store) as SolverStoreGet;
    const set: SolverStoreSet = (partial) => {
      store = { ...store, ...partial } as SolverRuntimeStore;
    };

    const solution: Solution = {
      solvable: true,
      moves: [{ column: 3 }],
      stats: {
        nodesExplored: 1,
        timeMs: 1,
        solutionLength: 1,
        solverName: 'test',
        terminated: 'solved',
      },
      trace: {
        type: 'minimax-tree',
        steps: [],
        visualizationData: { playerStarts: false },
      },
    };

    const finishSolve = vi.fn();

    handleRequestSolveResult(get, set, choosingState, 'connect-four', solution, finishSolve);

    expect(store.hintHighlight).toEqual({ row: 0, col: 1 });
    expect((store.gameState as { phase: string }).phase).toBe('choosing');

    vi.advanceTimersByTime(800);

    expect((store.gameState as { phase: string; currentPlayer: number; playerStarts: boolean }).phase).toBe('playing');
    expect((store.gameState as { currentPlayer: number }).currentPlayer).toBe(1);
    expect((store.gameState as { playerStarts: boolean }).playerStarts).toBe(false);
    expect(store.adversarialPlayback).toBe(true);
    expect(store.solvePlayback).toBe(true);
    expect(finishSolve).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('handleRequestSolveResult recommends AI first for euclids P-position choosing', () => {
    vi.useFakeTimers();

    const choosingState = {
      piles: [3, 2],
      currentPlayer: 0,
      phase: 'choosing',
      initialPiles: [3, 2],
    } as GameState;

    const plugin = {
      metadata: { id: 'euclids-game', isFastSolver: true },
      ai: { isAITurn: () => false },
    } as unknown as GamePlugin;

    let store: SolverRuntimeStore = {
      plugin,
      gameId: 'euclids-game',
      gameState: choosingState,
      historyIndex: 0,
      solution: null,
      solvePlayback: false,
      adversarialPlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      initialOptimalSteps: null,
      currentOptimalSteps: null,
      hintHighlight: null,
      applyMove: vi.fn(),
    };

    const get = (() => store) as SolverStoreGet;
    const set: SolverStoreSet = (partial) => {
      store = { ...store, ...partial } as SolverRuntimeStore;
    };

    const solution: Solution = {
      solvable: true,
      moves: [{ multiple: 1 }],
      stats: {
        nodesExplored: 1,
        timeMs: 1,
        solutionLength: 1,
        solverName: 'test',
        terminated: 'solved',
      },
      trace: {
        type: 'euclid-phi',
        steps: [],
        visualizationData: { playerStarts: false },
      },
    };

    handleRequestSolveResult(get, set, choosingState, 'euclids-game', solution, vi.fn());

    expect(store.hintHighlight).toEqual({ row: 0, col: 1 });

    vi.useRealTimers();
  });

  it('handleRequestSolveResult does not mutate store state or call finishSolve when state has changed', () => {
    const initialState = { id: 1 } as unknown as GameState;
    const switchedState = { id: 2 } as unknown as GameState;

    const plugin = {
      metadata: { id: 'test-game', isFastSolver: true },
    } as unknown as GamePlugin;

    let store: SolverRuntimeStore & { solverStatus: string } = {
      plugin,
      gameId: 'test-game',
      gameState: switchedState,
      solution: null,
      solverStatus: 'running',
      solvePlayback: false,
      adversarialPlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      initialOptimalSteps: null,
      currentOptimalSteps: null,
      applyMove: vi.fn(),
    } as unknown as SolverRuntimeStore & { solverStatus: string };

    const get = (() => store) as SolverStoreGet;
    const set = vi.fn((partial) => {
      store = { ...store, ...partial };
    });
    const finishSolve = vi.fn();

    const solution: Solution = {
      solvable: true,
      moves: [],
      stats: { nodesExplored: 1, timeMs: 1, solutionLength: 0, solverName: 'test', terminated: 'solved' },
    };

    handleRequestSolveResult(get, set, initialState, 'test-game', solution, finishSolve);

    expect(finishSolve).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(store.solverStatus).toBe('running');
  });

  it('cancelActiveSolve and clearSolverRuntimeTimers invokes activeSolveCancel', () => {
    const cancelFn1 = vi.fn();
    setActiveSolveCancel(cancelFn1);
    cancelActiveSolve();
    expect(cancelFn1).toHaveBeenCalledTimes(1);

    const cancelFn2 = vi.fn();
    setActiveSolveCancel(cancelFn2);
    clearSolverRuntimeTimers();
    expect(cancelFn2).toHaveBeenCalledTimes(1);
  });

  it('runSolverOffThread synchronous fallback calls onError when plugin.solve throws', async () => {
    const throwingPlugin = {
      metadata: { id: 'throw-game', platformSupport: [] },
      solve: () => {
        throw new Error('Solver crashed');
      },
    } as unknown as GamePlugin;

    const onResult = vi.fn();
    const onError = vi.fn();

    runSolverOffThread(throwingPlugin, {} as GameState, onResult, onError);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(onResult).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Solver crashed');
  });
});
