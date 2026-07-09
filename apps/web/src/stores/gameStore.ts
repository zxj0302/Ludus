import { create } from 'zustand';
import type { GamePlugin, GameState, Move, Solution, WorkerRequest, WorkerResponse } from '@ludus/core';
import { getGame, getGameEntry } from '@ludus/games';
import type { DisclosureLevel } from '@ludus/ui';
import i18n from '../i18n';
import { getPlayerStarts } from '../utils/solution';
import { scheduleTimeout, clearAllPlaybackTimers } from '../utils/playbackController';
import SolverWorker from '../workers/solver.worker?worker';
import { buildProgressSnapshot, getCurrentElapsedMs, timerFieldsForSession } from '../utils/progressSnapshot';
import { useProgressStore, parseRestorableSnapshot } from './progressStore';

// ═══════════════════════════════════════════════════════════════
// 通用 AI 调度 — 通过 plugin.ai 实现，不依赖具体游戏
// ═══════════════════════════════════════════════════════════════

let aiTimerId: ReturnType<typeof setTimeout> | null = null;
let bgSolverTimerId: ReturnType<typeof setTimeout> | null = null;
let bgWorkerReqId = 0;
let solveInFlight = false;

function usesWebWorker(plugin: GamePlugin): boolean {
  const web = plugin.metadata.platformSupport.find(p => p.platform === 'web');
  return web?.capabilities.webWorker === true;
}

function clearTimers() {
  if (aiTimerId) { clearTimeout(aiTimerId); aiTimerId = null; }
  if (bgSolverTimerId) { clearTimeout(bgSolverTimerId); bgSolverTimerId = null; }
  if (bgSolveCancel) { bgSolveCancel(); bgSolveCancel = null; }
  clearAllPlaybackTimers();
  solveInFlight = false;
}

function clearPlaybackState(): Partial<GameStore> {
  return {
    solvePlayback: false,
    adversarialPlayback: false,
    solveStepIndex: 0,
    prePlaybackHistoryIndex: 0,
  };
}

function scheduleAI(get: () => GameStore) {
  if (aiTimerId) clearTimeout(aiTimerId);
  aiTimerId = setTimeout(() => {
    aiTimerId = null;
    const s = get();
    if (!s.plugin?.ai || !s.gameState || s.solvePlayback) return;
    if (!s.plugin.ai.isAITurn(s.gameState)) return;
    const action = s.plugin.ai.getAIMove(s.gameState);
    if (!action) return;
    get().applyMove(action.move);
  }, 600);
}

// ═══════════════════════════════════════════════════════════════
// 对抗游戏逐步求解播放 — 每步动态计算，AI 用真实 getAIMove
// ═══════════════════════════════════════════════════════════════

function adversarialSolveStep(
  get: () => GameStore,
  set: (partial: Partial<GameStore>) => void,
) {
  const { plugin, gameState, adversarialPlayback } = get();
  if (!plugin?.ai || !gameState || !adversarialPlayback) return;

  if (plugin.isSolved(gameState)) {
    const endSol = plugin.solve(gameState);
    set({ ...clearPlaybackState(), solution: endSol });
    return;
  }

  if (plugin.ai.isAITurn(gameState)) {
    scheduleTimeout(() => {
      const s = get();
      if (!s.plugin?.ai || !s.gameState || !s.adversarialPlayback) return;
      const aiAction = s.plugin.ai.getAIMove(s.gameState);
      if (!aiAction) {
        set(clearPlaybackState());
        return;
      }
      get().applyMove(aiAction.move);
      scheduleTimeout(() => adversarialSolveStep(get, set), 600);
    }, 600);
    return;
  }

  const solution = plugin.solve(gameState);
  set({ solution });

  if (solution.solvable && solution.moves.length > 0) {
    scheduleTimeout(() => {
      const s = get();
      if (!s.adversarialPlayback) return;
      get().applyMove(solution.moves[0]!);
      scheduleTimeout(() => adversarialSolveStep(get, set), 600);
    }, 400);
  } else {
    set(clearPlaybackState());
  }
}

// ═══════════════════════════════════════════════════════════════
// 离线程求解 — Web Worker 或 setTimeout fallback
// ═══════════════════════════════════════════════════════════════

function runSolverOffThread(
  plugin: GamePlugin,
  state: GameState,
  onResult: (solution: Solution) => void,
  onError?: (message: string) => void,
): { cancel: () => void } {
  if (usesWebWorker(plugin)) {
    const worker = new SolverWorker();
    const reqId = `solve-${++bgWorkerReqId}`;
    let done = false;

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.id !== reqId || done) return;
      done = true;
      worker.terminate();
      if (e.data.error) { onError?.(e.data.error); return; }
      const result = e.data.result as Solution | undefined;
      if (result) onResult(result);
      else onError?.(i18n.t('game.status.emptySolverResult'));
    };

    worker.onerror = (err) => {
      if (done) return;
      done = true;
      worker.terminate();
      onError?.(i18n.t('game.status.workerError', { message: err.message || 'failed' }));
    };

    worker.postMessage({ id: reqId, type: 'solve', payload: { gameId: plugin.metadata.id, state: state as Record<string, unknown> } } satisfies WorkerRequest);
    return { cancel: () => { if (!done) { done = true; worker.terminate(); } } };
  }

  const timerId = setTimeout(() => {
    onResult(plugin.solve(state));
  }, 0);
  return { cancel: () => clearTimeout(timerId) };
}

// ═══════════════════════════════════════════════════════════════
// 后台求解 — 异步调度，不阻塞 UI
// ═══════════════════════════════════════════════════════════════

let bgSolveCancel: (() => void) | null = null;

function scheduleBackgroundSolve(
  get: () => GameStore,
  set: (partial: Partial<GameStore>) => void,
  savedState: GameState,
  savedGameId: string,
) {
  if (bgSolverTimerId) { clearTimeout(bgSolverTimerId); bgSolverTimerId = null; }
  if (bgSolveCancel) { bgSolveCancel(); bgSolveCancel = null; }

  const { plugin: p } = get();
  if (!p) return;

  bgSolverTimerId = setTimeout(() => {
    bgSolverTimerId = null;
    const { plugin: currentP, gameState: currentS, gameId: currentId } = get();
    if (!currentP || currentS !== savedState || currentId !== savedGameId) return;

    bgSolveCancel = runSolverOffThread(
      currentP,
      currentS,
      (bgSol) => {
        bgSolveCancel = null;
        const { gameState: latestS, gameId: latestId } = get();
        if (latestS !== savedState || latestId !== savedGameId) return;
        if (bgSol.solvable && bgSol.moves.length > 0) {
          set({
            solution: bgSol,
            initialOptimalSteps: bgSol.stats.solutionLength > 0 ? bgSol.stats.solutionLength : null,
            currentOptimalSteps: bgSol.stats.solutionLength > 0 ? bgSol.stats.solutionLength : null,
          });
        } else {
          set({ currentOptimalSteps: null });
        }
      },
      () => { bgSolveCancel = null; },
    ).cancel;
  }, 500);
}

function maybeRescheduleBackgroundSolve(get: () => GameStore, set: (partial: Partial<GameStore>) => void) {
  const { plugin, gameState, gameId, solvePlayback } = get();
  if (!plugin || !gameState || !gameId || solvePlayback) return;
  if (plugin.metadata.isFastSolver || plugin.ai) return;
  scheduleBackgroundSolve(get, set, gameState, gameId);
}

function persistGameProgress(
  gameId: string | null,
  plugin: GamePlugin | null,
  gameState: GameState | null,
  history: GameState[],
  historyIndex: number,
  optimalSteps: number | null,
  elapsedMs: number,
  opts?: { wonJustNow?: boolean; newSession?: boolean },
) {
  if (!gameId || !plugin || !gameState) return;
  useProgressStore.getState().saveSession({
    gameId,
    snapshot: buildProgressSnapshot(gameId, gameState, history, historyIndex),
    isSolved: plugin.isSolved(gameState),
    optimalSteps,
    elapsedMs,
    wonJustNow: opts?.wonJustNow,
    newSession: opts?.newSession,
  });
}

function applyHintFromSolution(
  get: () => GameStore,
  set: (partial: Partial<GameStore>) => void,
  savedState: GameState,
  savedGameId: string,
  solution: Solution,
) {
  const { plugin, gameState: s, gameId: gid } = get();
  if (!plugin || !s || s !== savedState || gid !== savedGameId) {
    set({ solverStatus: 'idle' });
    return;
  }

  const isAdversarial = !!plugin.ai;

  if (isAdversarial && (s as Record<string, unknown>).phase === 'choosing') {
    const playerStarts = getPlayerStarts(solution);
    set({
      hintMove: null,
      hintHighlight: { row: 0, col: playerStarts ? 0 : 1 },
      solution,
      solverStatus: 'done',
      solveError: null,
    });
    return;
  }

  if (solution.solvable && solution.moves.length > 0) {
    set({
      hintMove: solution.moves[0]!,
      hintHighlight: null,
      currentOptimalSteps: solution.stats.solutionLength > 0 ? solution.stats.solutionLength : null,
      solution,
      solverStatus: 'done',
      solveError: null,
    });
  } else {
    set({
      hintMove: null,
      hintHighlight: null,
      currentOptimalSteps: null,
      solution,
      solverStatus: 'done',
      solveError: isAdversarial ? i18n.t('game.status.noWinningMove') : null,
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 关卡生成 — 尝试 generateLevel，失败则 fallback 到 initialState
// ═══════════════════════════════════════════════════════════════

function generatePlayableState(plugin: GamePlugin, difficultyRange?: [number, number]): GameState {
  try {
    const level = plugin.generateLevel({
      difficultyRange: difficultyRange ?? [1, 100],
      size: 5,
      requireUniqueSolution: false,
    });
    return level.initialState as GameState;
  } catch {
    return plugin.initialState();
  }
}

// ═══════════════════════════════════════════════════════════════
// Store 类型
// ═══════════════════════════════════════════════════════════════

type SolverStatus = 'idle' | 'running' | 'done';

interface GameStore {
  gameId: string | null;
  plugin: GamePlugin | null;
  gameState: GameState | null;
  history: GameState[];
  historyIndex: number;

  solverStatus: SolverStatus;
  solution: Solution | null;
  solveError: string | null;

  hintMove: Move | null;
  hintHighlight: { row: number; col: number; value?: number } | null;
  initialOptimalSteps: number | null;
  currentOptimalSteps: number | null;

  solvePlayback: boolean;
  solveStepIndex: number;
  prePlaybackHistoryIndex: number;
  adversarialPlayback: boolean;

  startTime: number | null;
  elapsed: number;

  disclosureLevel: DisclosureLevel;
  educationOpen: boolean;

  language: string;
  soundEnabled: boolean;
  difficultyRange: [number, number];
  setDifficultyRange: (range: [number, number]) => void;

  loadGame: (gameId: string, options?: { resume?: boolean }) => void;
  loadCustomState: (state: GameState) => void;
  applyMove: (move: Move) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  newLevel: () => void;
  requestSolve: () => void;
  requestHint: () => void;
  nextPlaybackStep: () => void;
  prevPlaybackStep: () => void;
  stopPlayback: () => void;
  setDisclosureLevel: (level: DisclosureLevel) => void;
  setEducationOpen: (open: boolean) => void;
  setLanguage: (lang: string) => void;
  toggleSound: () => void;
  tick: () => void;
  flushProgress: () => void;
}

// ═══════════════════════════════════════════════════════════════
// Store 实现
// ═══════════════════════════════════════════════════════════════

export const useGameStore = create<GameStore>()((set, get) => ({
  gameId: null,
  plugin: null,
  gameState: null,
  history: [],
  historyIndex: -1,
  solverStatus: 'idle',
  solution: null,
  solveError: null,
  hintMove: null,
  hintHighlight: null,
  initialOptimalSteps: null,
  currentOptimalSteps: null,
  solvePlayback: false,
  solveStepIndex: 0,
  prePlaybackHistoryIndex: 0,
  adversarialPlayback: false,
  startTime: null,
  elapsed: 0,
  disclosureLevel: 1,
  educationOpen: false,
  language: 'zh-CN',
  soundEnabled: true,
  difficultyRange: [1, 100],

  loadGame: (gameId, options) => {
    clearTimers();
    const plugin = getGame(gameId);
    const entry = getGameEntry(gameId);
    if (!plugin) return;

    let state: GameState | undefined;
    let history: GameState[] | undefined;
    let historyIndex: number | undefined;
    let restored = false;

    if (options?.resume) {
      const record = useProgressStore.getState().getRecord(gameId);
      const restoredData = parseRestorableSnapshot(gameId, record?.snapshot);
      if (restoredData && entry?.isOwnState(restoredData.state as GameState)) {
        state = restoredData.state as GameState;
        history = restoredData.history as GameState[];
        historyIndex = restoredData.historyIndex;
        restored = true;
      }
    }

    if (!state || !history || historyIndex === undefined) {
      state = generatePlayableState(plugin, get().difficultyRange);
      history = [state];
      historyIndex = 0;
      restored = false;
    }

    // 最终防线：state 必须与本游戏 isOwnState 匹配，否则回退 initialState
    if (!entry?.isOwnState(state)) {
      state = plugin.initialState();
      history = [state];
      historyIndex = 0;
      restored = false;
    }

    const isFastGame = plugin.metadata.isFastSolver;
    const hasAI = !!plugin.ai;
    let sol: Solution | null = null;
    if (isFastGame && !hasAI) {
      try {
        sol = plugin.solve(state);
      } catch {
        sol = null;
      }
    }
    const opt = sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null;
    const savedElapsed = restored
      ? (useProgressStore.getState().getRecord(gameId)?.elapsedMs ?? 0)
      : 0;
    const isSolved = plugin.isSolved(state);
    const timer = timerFieldsForSession(restored, savedElapsed, isSolved);

    set({
      gameId,
      plugin,
      gameState: state,
      history,
      historyIndex,
      solverStatus: 'idle',
      solution: sol,
      solveError: null,
      hintMove: null,
      hintHighlight: null,
      initialOptimalSteps: hasAI ? null : opt,
      currentOptimalSteps: hasAI ? null : opt,
      ...clearPlaybackState(),
      startTime: timer.startTime,
      elapsed: timer.elapsed,
      educationOpen: false,
    });

    persistGameProgress(gameId, plugin, state, history, historyIndex, opt, timer.elapsed, { newSession: !restored });

    if (!isFastGame) scheduleBackgroundSolve(get, set, state, gameId);
    if (hasAI) scheduleAI(get);
  },

  applyMove: (move) => {
    const { plugin, gameState, history, historyIndex, solvePlayback, gameId, initialOptimalSteps } = get();
    if (!plugin || !gameState) return;
    if (!solvePlayback && plugin.isSolved(gameState)) return;

    const wasSolved = plugin.isSolved(gameState);
    const newState = plugin.applyMove(gameState, move);
    if (newState === gameState) return;

    const newHistory = [...history.slice(0, historyIndex + 1), newState];
    const keepExistingSolution = solvePlayback && get().solution;

    let solution = keepExistingSolution ? get().solution! : null;
    if (!keepExistingSolution && plugin.metadata.isFastSolver && !plugin.ai) {
      solution = plugin.solve(newState);
    }

    const newIndex = newHistory.length - 1;
    const nowSolved = plugin.isSolved(newState);
    const wonJustNow = !solvePlayback && !wasSolved && nowSolved && historyIndex >= 0;
    const optSteps = solution?.stats.solutionLength
      ? (solution.stats.solutionLength > 0 ? solution.stats.solutionLength : null)
      : get().currentOptimalSteps ?? initialOptimalSteps;

    set({
      gameState: newState,
      history: newHistory,
      historyIndex: newIndex,
      hintMove: null,
      hintHighlight: null,
      currentOptimalSteps: null,
      solveError: null,
      solution,
    });

    if (!solvePlayback) {
      const elapsedMs = getCurrentElapsedMs(get().startTime, get().elapsed);
      persistGameProgress(gameId, plugin, newState, newHistory, newIndex, optSteps, elapsedMs, { wonJustNow });
    }

    if (!solvePlayback && plugin.ai && !nowSolved) scheduleAI(get);
    if (!solvePlayback && !plugin.ai) maybeRescheduleBackgroundSolve(get, set);
  },

  undo: () => {
    const { historyIndex, history, solvePlayback, plugin } = get();
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const newState = history[newIdx]!;
      let solution = get().solution;
      if (!solvePlayback && plugin?.metadata.isFastSolver && !plugin.ai) {
        solution = plugin.solve(newState);
      } else if (!solvePlayback && !plugin?.metadata.isFastSolver) {
        solution = null;
      }
      set({
        historyIndex: newIdx,
        gameState: newState,
        solution,
        currentOptimalSteps: null,
        hintMove: null,
        hintHighlight: null,
        solveError: null,
      });
      const s = get();
      persistGameProgress(
        s.gameId, s.plugin, newState, s.history, newIdx,
        s.currentOptimalSteps ?? s.initialOptimalSteps,
        getCurrentElapsedMs(s.startTime, s.elapsed),
      );
      if (plugin?.ai) scheduleAI(get);
      if (!solvePlayback) maybeRescheduleBackgroundSolve(get, set);
    }
  },

  redo: () => {
    const { historyIndex, history, solvePlayback, plugin } = get();
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      const newState = history[newIdx]!;
      let solution = get().solution;
      if (!solvePlayback && plugin?.metadata.isFastSolver && !plugin.ai) {
        solution = plugin.solve(newState);
      } else if (!solvePlayback && !plugin?.metadata.isFastSolver) {
        solution = null;
      }
      set({
        historyIndex: newIdx,
        gameState: newState,
        solution,
        currentOptimalSteps: null,
        hintMove: null,
        hintHighlight: null,
        solveError: null,
      });
      const s = get();
      persistGameProgress(
        s.gameId, s.plugin, newState, s.history, newIdx,
        s.currentOptimalSteps ?? s.initialOptimalSteps,
        getCurrentElapsedMs(s.startTime, s.elapsed),
      );
      if (plugin?.ai) scheduleAI(get);
      if (!solvePlayback) maybeRescheduleBackgroundSolve(get, set);
    }
  },

  reset: () => {
    clearTimers();
    const { history, plugin, gameId } = get();
    if (history.length === 0) return;
    const initial = history[0]!;
    const isFastGame = plugin?.metadata.isFastSolver;
    const hasAI = !!plugin?.ai;
    const sol = isFastGame ? plugin?.solve(initial) ?? null : null;
    const opt = sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null;
    set({
      historyIndex: 0,
      gameState: initial,
      history: [initial],
      solution: sol,
      solveError: null,
      hintMove: null,
      hintHighlight: null,
      currentOptimalSteps: hasAI ? null : opt,
      initialOptimalSteps: hasAI ? null : opt,
      solverStatus: 'idle',
      ...clearPlaybackState(),
      startTime: Date.now(),
      elapsed: 0,
    });
    persistGameProgress(gameId ?? null, plugin ?? null, initial, [initial], 0, opt, 0);
    if (!isFastGame && plugin && gameId) scheduleBackgroundSolve(get, set, initial, gameId);
    if (hasAI) scheduleAI(get);
  },

  newLevel: () => {
    clearTimers();
    const { plugin, difficultyRange, gameId } = get();
    if (!plugin) return;
    const state = generatePlayableState(plugin, difficultyRange);
    const isFastGame = plugin.metadata.isFastSolver;
    const hasAI = !!plugin.ai;
    const sol = isFastGame ? plugin.solve(state) : null;
    const opt = sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null;
    set({
      gameState: state,
      history: [state],
      historyIndex: 0,
      solverStatus: 'idle',
      solution: sol,
      solveError: null,
      hintMove: null,
      hintHighlight: null,
      initialOptimalSteps: hasAI ? null : opt,
      currentOptimalSteps: hasAI ? null : opt,
      ...clearPlaybackState(),
      startTime: Date.now(),
      elapsed: 0,
    });

    persistGameProgress(gameId ?? null, plugin, state, [state], 0, opt, 0, { newSession: true });

    if (!isFastGame && gameId) scheduleBackgroundSolve(get, set, state, gameId);
    if (hasAI) scheduleAI(get);
  },

  loadCustomState: (state: GameState) => {
    clearTimers();
    const { plugin, gameId } = get();
    const isFastGame = plugin?.metadata.isFastSolver;
    const hasAI = !!plugin?.ai;
    const sol = isFastGame ? plugin?.solve(state) ?? null : null;
    const opt = sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null;
    set({
      gameState: state,
      history: [state],
      historyIndex: 0,
      solverStatus: 'idle',
      solution: sol,
      solveError: null,
      hintMove: null,
      hintHighlight: null,
      initialOptimalSteps: hasAI ? null : opt,
      currentOptimalSteps: hasAI ? null : opt,
      ...clearPlaybackState(),
      startTime: Date.now(),
      elapsed: 0,
    });

    const elapsedMs = getCurrentElapsedMs(get().startTime, get().elapsed);
    persistGameProgress(gameId ?? null, plugin ?? null, state, [state], 0, opt, elapsedMs);

    if (!isFastGame && gameId) scheduleBackgroundSolve(get, set, state, gameId);
    if (hasAI) scheduleAI(get);
  },

  requestSolve: () => {
    const { plugin, gameState, solverStatus } = get();
    if (!plugin || !gameState || solverStatus === 'running' || solveInFlight) return;

    solveInFlight = true;
    const savedState = gameState;
    const savedGameId = plugin.metadata.id;
    set({ solverStatus: 'running', solveError: null });

    const finishSolve = (partial: Partial<GameStore>) => {
      solveInFlight = false;
      set(partial);
    };

    if (usesWebWorker(plugin)) {
      runSolverOffThread(plugin, gameState, (solution) => {
        const { gameState: s, gameId: gid } = get();
        if (!s || s !== savedState || gid !== savedGameId) {
          finishSolve({ solverStatus: 'idle' });
          return;
        }
        finishSolve({
          solution,
          solverStatus: 'done',
          solvePlayback: true,
          solveStepIndex: 0,
          prePlaybackHistoryIndex: get().historyIndex,
          hintMove: null,
          hintHighlight: null,
        });
      }, (errMsg) => {
        finishSolve({ solverStatus: 'idle', solveError: errMsg });
      });
      return;
    }

    scheduleTimeout(() => {
      const { plugin: p, gameState: s } = get();
      if (!p || !s || s !== savedState) {
        finishSolve({ solverStatus: 'idle' });
        return;
      }
      const solution = p.solve(s);
      const isAdversarial = !!p.ai;

      if (isAdversarial) {
        const sAny = s as Record<string, unknown>;

        if (sAny.phase === 'choosing') {
          const playerStarts = getPlayerStarts(solution);
          set({
            hintHighlight: { row: 0, col: playerStarts ? 0 : 1 },
            solution,
            solverStatus: 'done',
          });
          scheduleTimeout(() => {
            const cur = get();
            if (!cur.plugin?.ai) { finishSolve({}); return; }
            const playingState = { ...sAny, currentPlayer: playerStarts ? 0 : 1, phase: 'playing' };
            set({
              gameState: playingState as GameState,
              history: [s, playingState as GameState],
              historyIndex: 1,
              solvePlayback: true,
              adversarialPlayback: true,
              solveStepIndex: 0,
              prePlaybackHistoryIndex: 0,
              hintMove: null,
              hintHighlight: null,
            });
            solveInFlight = false;
            scheduleTimeout(() => adversarialSolveStep(get, set), 600);
          }, 800);
          return;
        }

        if (!solution.solvable || solution.moves.length === 0) {
          finishSolve({ solution, solverStatus: 'done', solveError: i18n.t('game.status.noWinningMove') });
          return;
        }

        finishSolve({
          solution,
          solverStatus: 'done',
          solvePlayback: true,
          adversarialPlayback: true,
          solveStepIndex: 0,
          prePlaybackHistoryIndex: get().historyIndex,
          hintMove: null,
          hintHighlight: null,
        });
        scheduleTimeout(() => adversarialSolveStep(get, set), 400);
        return;
      }

      if (solution.solvable && solution.moves.length > 0) {
        finishSolve({
          solution,
          solverStatus: 'done',
          solvePlayback: true,
          solveStepIndex: 0,
          prePlaybackHistoryIndex: get().historyIndex,
          hintMove: null,
          hintHighlight: null,
        });
      } else if (solution.stats.terminated === 'timeout') {
        finishSolve({ solution, solverStatus: 'done', solveError: i18n.t('game.status.timedOut') });
      } else {
        finishSolve({ solution, solverStatus: 'done' });
      }
    }, 50);
  },

  requestHint: () => {
    const { plugin, gameState, solverStatus } = get();
    if (!plugin || !gameState || solverStatus === 'running') return;

    const savedState = gameState;
    const savedGameId = plugin.metadata.id;
    set({ solverStatus: 'running' });

    if (usesWebWorker(plugin)) {
      runSolverOffThread(
        plugin,
        gameState,
        (solution) => applyHintFromSolution(get, set, savedState, savedGameId, solution),
        () => set({ solverStatus: 'idle', solveError: i18n.t('game.status.workerError', { message: 'failed' }) }),
      );
      return;
    }

    scheduleTimeout(() => {
      const { plugin: p, gameState: s } = get();
      if (!p || !s || s !== savedState) {
        set({ solverStatus: 'idle' });
        return;
      }
      applyHintFromSolution(get, set, savedState, savedGameId, p.solve(s));
    }, 50);
  },

  nextPlaybackStep: () => {
    if (get().adversarialPlayback) return;
    if (!get().solvePlayback) return;
    const { solution, solveStepIndex } = get();
    if (!solution) return;

    const currentMove = solution.moves[solveStepIndex];
    if (!currentMove) return;

    get().applyMove(currentMove);

    const nextIdx = solveStepIndex + 1;
    const isLastStep = nextIdx >= solution.moves.length;
    set({
      solveStepIndex: isLastStep ? 0 : nextIdx,
      solvePlayback: !isLastStep,
    });

    if (isLastStep) scheduleAI(get);
  },

  prevPlaybackStep: () => {
    if (get().adversarialPlayback) return;
    const { solveStepIndex } = get();
    if (solveStepIndex > 0) {
      get().undo();
      set({ solveStepIndex: solveStepIndex - 1 });
    }
  },

  stopPlayback: () => {
    clearAllPlaybackTimers();
    const { prePlaybackHistoryIndex, history } = get();
    const idx = Math.max(0, prePlaybackHistoryIndex);
    set({
      historyIndex: idx,
      gameState: history[idx],
      history: history.slice(0, idx + 1),
      ...clearPlaybackState(),
    });
    solveInFlight = false;
  },

  setDisclosureLevel: (level) => {
    const { plugin, gameState, solvePlayback, solution: prevSol } = get();
    if (level >= 2 && plugin && gameState && !solvePlayback) {
      const isFastGame = plugin.metadata.isFastSolver;
      const sol = isFastGame ? plugin.solve(gameState) : prevSol;
      set({
        disclosureLevel: level,
        solution: sol,
        currentOptimalSteps: sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null,
      });
      if (!isFastGame) maybeRescheduleBackgroundSolve(get, set);
    } else {
      set({ disclosureLevel: level });
    }
  },
  setEducationOpen: (open) => set({ educationOpen: open }),
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },

  toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),
  setDifficultyRange: (range) => set({ difficultyRange: range }),

  tick: () => {
    const { startTime } = get();
    if (startTime) {
      set({ elapsed: Date.now() - startTime });
    }
  },

  flushProgress: () => {
    const s = get();
    if (!s.gameId || !s.plugin || !s.gameState) return;
    const elapsedMs = getCurrentElapsedMs(s.startTime, s.elapsed);
    if (s.startTime) {
      set({ elapsed: elapsedMs, startTime: null });
    }
    persistGameProgress(
      s.gameId,
      s.plugin,
      s.gameState,
      s.history,
      s.historyIndex,
      s.currentOptimalSteps ?? s.initialOptimalSteps,
      elapsedMs,
    );
  },
}));
