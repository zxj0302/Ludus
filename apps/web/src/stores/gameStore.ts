import { create } from 'zustand';
import type { GamePlugin, GameState, Level, Move, Solution } from '@ludus/core';
import { getGame, getGameEntry } from '@ludus/games';
import type { HighlightCell } from '@ludus/games';
import type { DisclosureLevel } from '@ludus/ui';
import i18n from '../i18n';
import { getPlayerStarts } from '../utils/solution';
import { scheduleTimeout, clearAllPlaybackTimers } from '../utils/playbackController';
import { getCurrentElapsedMs, timerFieldsForSession } from '../utils/progressSnapshot';
import { parseRestorableSnapshot, useProgressStore } from './progressStore';
import { persistGameSession } from './gameStoreProgress';
import { getGeneratorParams, type GeneratorParamValue, type GeneratorParams } from '../generatorControls';
import {
  fallbackLevel,
  generatePlayableLevel,
  getDifficultyRangeForGame,
} from './gameStoreLevelGeneration';
import {
  adversarialSolveStep,
  applyHintFromSolution,
  clearPlaybackStateFields,
  clearSolverRuntimeTimers,
  isSolveInFlight,
  maybeRescheduleBackgroundSolve,
  runSolverOffThread,
  scheduleAI,
  scheduleBackgroundSolve,
  setSolveInFlight,
  usesWebWorker,
} from './gameStoreSolverRuntime';

// ═══════════════════════════════════════════════════════════════
// 进度持久化 — 见 gameStoreProgress.ts
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 关卡生成 — 见 gameStoreLevelGeneration.ts
// ═══════════════════════════════════════════════════════════════

function isValidGeneratorParamValue(value: GeneratorParamValue): boolean {
  return typeof value !== 'number' || Number.isFinite(value);
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
  hintHighlight: HighlightCell | null;
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
  difficultyRangeByGame: Record<string, [number, number]>;
  setDifficultyRange: (range: [number, number]) => void;
  generatorParamsByGame: Record<string, GeneratorParams>;
  lastGeneratedLevel: Level | null;
  generatorError: string | null;
  setGeneratorParam: (gameId: string, key: string, value: GeneratorParamValue) => void;
  resetGeneratorParams: (gameId: string) => void;

  loadGame: (gameId: string, options?: { resume?: boolean }) => void;
  loadCustomState: (state: GameState, meta?: { optimalSteps?: number | null }) => void;
  prependHistory: (state: GameState) => void;
  applyMove: (move: Move) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  newLevel: (options?: { useGeneratorParams?: boolean; difficultyRange?: [number, number] }) => void;
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
  difficultyRangeByGame: {},
  generatorParamsByGame: {},
  lastGeneratedLevel: null,
  generatorError: null,

  loadGame: (gameId, options) => {
    clearSolverRuntimeTimers();
    const plugin = getGame(gameId);
    const entry = getGameEntry(gameId);
    if (!plugin) return;

    let state: GameState | undefined;
    let history: GameState[] | undefined;
    let historyIndex: number | undefined;
    let generatedLevel: Level | null = null;
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

    const progressRecord = useProgressStore.getState().getRecord(gameId);

    if (!state || !history || historyIndex === undefined) {
      const generated = generatePlayableLevel(
        plugin,
        getDifficultyRangeForGame(get().difficultyRangeByGame, gameId),
        null,
      );
      generatedLevel = generated.ok ? generated.level : fallbackLevel(plugin);
      state = generatedLevel.initialState as GameState;
      history = [state];
      historyIndex = 0;
      restored = false;
    }

    // 最终防线：state 必须与本游戏 isOwnState 匹配，否则回退 initialState
    if (!entry?.isOwnState(state)) {
      generatedLevel = fallbackLevel(plugin);
      state = generatedLevel.initialState as GameState;
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
    const solvedLength = sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null;
    // Catalog / generated levels may carry known optimal without a sync solve (e.g. peg-solitaire).
    // Resume restores optimalSteps from progress store.
    const opt = solvedLength
      ?? generatedLevel?.optimalSteps
      ?? (restored ? progressRecord?.optimalSteps ?? null : null)
      ?? null;
    const savedElapsed = restored ? (progressRecord?.elapsedMs ?? 0) : 0;
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
      ...clearPlaybackStateFields(),
      startTime: timer.startTime,
      elapsed: timer.elapsed,
      educationOpen: false,
      lastGeneratedLevel: restored ? null : generatedLevel,
      generatorError: null,
    });

    persistGameSession({
      gameId,
      plugin,
      gameState: state,
      history,
      historyIndex,
      optimalSteps: opt,
      elapsedMs: timer.elapsed,
      newSession: !restored,
    });

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
      persistGameSession({
        gameId,
        plugin,
        gameState: newState,
        history: newHistory,
        historyIndex: newIndex,
        optimalSteps: optSteps,
        elapsedMs,
        wonJustNow,
      });
    }

    if (!solvePlayback && plugin.ai && !nowSolved) scheduleAI(get);
    if (!solvePlayback && !plugin.ai) maybeRescheduleBackgroundSolve(get, set);
  },

  prependHistory: (state) => {
    const { plugin, gameId, history, historyIndex, solvePlayback, startTime, elapsed } = get();
    const entry = gameId ? getGameEntry(gameId) : null;
    if (!plugin || !gameId || !entry?.isOwnState(state) || solvePlayback) return;

    const newHistory = [state, ...history];
    const newIndex = historyIndex + 1;
    const optimalSteps = get().currentOptimalSteps ?? get().initialOptimalSteps;

    set({
      history: newHistory,
      historyIndex: newIndex,
      hintMove: null,
      hintHighlight: null,
      solveError: null,
      lastGeneratedLevel: null,
    });

    persistGameSession({
      gameId,
      plugin,
      gameState: get().gameState,
      history: newHistory,
      historyIndex: newIndex,
      optimalSteps,
      elapsedMs: getCurrentElapsedMs(startTime, elapsed),
    });

    if (plugin.ai) scheduleAI(get);
    else maybeRescheduleBackgroundSolve(get, set);
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
        lastGeneratedLevel: null,
      });
      const s = get();
      persistGameSession({
        gameId: s.gameId,
        plugin: s.plugin,
        gameState: newState,
        history: s.history,
        historyIndex: newIdx,
        optimalSteps: s.currentOptimalSteps ?? s.initialOptimalSteps,
        elapsedMs: getCurrentElapsedMs(s.startTime, s.elapsed),
      });
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
        lastGeneratedLevel: null,
      });
      const s = get();
      persistGameSession({
        gameId: s.gameId,
        plugin: s.plugin,
        gameState: newState,
        history: s.history,
        historyIndex: newIdx,
        optimalSteps: s.currentOptimalSteps ?? s.initialOptimalSteps,
        elapsedMs: getCurrentElapsedMs(s.startTime, s.elapsed),
      });
      if (plugin?.ai) scheduleAI(get);
      if (!solvePlayback) maybeRescheduleBackgroundSolve(get, set);
    }
  },

  reset: () => {
    clearSolverRuntimeTimers();
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
      ...clearPlaybackStateFields(),
      startTime: Date.now(),
      elapsed: 0,
      lastGeneratedLevel: null,
    });
    persistGameSession({
      gameId: gameId ?? null,
      plugin: plugin ?? null,
      gameState: initial,
      history: [initial],
      historyIndex: 0,
      optimalSteps: opt,
      elapsedMs: 0,
    });
    if (!isFastGame && plugin && gameId) scheduleBackgroundSolve(get, set, initial, gameId);
    if (hasAI) scheduleAI(get);
  },

  newLevel: (options) => {
    clearSolverRuntimeTimers();
    const { plugin, gameId } = get();
    if (!plugin || !gameId) return;
    const difficultyRange = options?.difficultyRange
      ?? getDifficultyRangeForGame(get().difficultyRangeByGame, gameId);
    const params = options?.useGeneratorParams
      ? getGeneratorParams(plugin.metadata.id, get().generatorParamsByGame[plugin.metadata.id])
      : null;
    const generated = generatePlayableLevel(
      plugin,
      difficultyRange,
      params,
      { strict: options?.useGeneratorParams },
    );
    if (!generated.ok) {
      set({ generatorError: generated.error });
      return;
    }
    const level = generated.level;
    const state = level.initialState as GameState;
    const isFastGame = plugin.metadata.isFastSolver;
    const hasAI = !!plugin.ai;
    const sol = isFastGame ? plugin.solve(state) : null;
    const solvedLength = sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null;
    const opt = solvedLength ?? level.optimalSteps ?? null;
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
      ...clearPlaybackStateFields(),
      startTime: Date.now(),
      elapsed: 0,
      lastGeneratedLevel: level,
      generatorError: null,
    });

    persistGameSession({
      gameId: gameId ?? null,
      plugin,
      gameState: state,
      history: [state],
      historyIndex: 0,
      optimalSteps: opt,
      elapsedMs: 0,
      newSession: true,
    });

    if (!isFastGame && gameId) scheduleBackgroundSolve(get, set, state, gameId);
    if (hasAI) scheduleAI(get);
  },

  loadCustomState: (state: GameState, meta?: { optimalSteps?: number | null }) => {
    clearSolverRuntimeTimers();
    const { plugin, gameId } = get();
    const isFastGame = plugin?.metadata.isFastSolver;
    const hasAI = !!plugin?.ai;
    const sol = isFastGame ? plugin?.solve(state) ?? null : null;
    const solvedOpt = sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null;
    const opt = hasAI ? null : (meta?.optimalSteps ?? solvedOpt);
    set({
      gameState: state,
      history: [state],
      historyIndex: 0,
      solverStatus: 'idle',
      solution: sol,
      solveError: null,
      hintMove: null,
      hintHighlight: null,
      initialOptimalSteps: opt,
      currentOptimalSteps: opt,
      ...clearPlaybackStateFields(),
      startTime: Date.now(),
      elapsed: 0,
      lastGeneratedLevel: null,
    });

    const elapsedMs = getCurrentElapsedMs(get().startTime, get().elapsed);
    persistGameSession({
      gameId: gameId ?? null,
      plugin: plugin ?? null,
      gameState: state,
      history: [state],
      historyIndex: 0,
      optimalSteps: opt,
      elapsedMs,
    });

    if (!isFastGame && gameId) scheduleBackgroundSolve(get, set, state, gameId);
    if (hasAI) scheduleAI(get);
  },

  requestSolve: () => {
    const { plugin, gameState, solverStatus } = get();
    if (!plugin || !gameState || solverStatus === 'running' || isSolveInFlight()) return;

    setSolveInFlight(true);
    const savedState = gameState;
    const savedGameId = plugin.metadata.id;
    set({ solverStatus: 'running', solveError: null });

    const finishSolve = (partial: Partial<GameStore>) => {
      setSolveInFlight(false);
      set(partial);
    };

    if (usesWebWorker(plugin)) {
      runSolverOffThread(plugin, gameState, (solution) => {
        const { gameState: s, gameId: gid } = get();
        if (!s || s !== savedState || gid !== savedGameId) {
          finishSolve({ solverStatus: 'idle' });
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
          finishSolve({
            solution,
            solverStatus: 'done',
            solveError: i18n.t('game.status.timedOut'),
          });
        } else {
          finishSolve({ solution, solverStatus: 'done' });
        }
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
            setSolveInFlight(false);
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
      ...clearPlaybackStateFields(),
    });
    setSolveInFlight(false);
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
  setDifficultyRange: (range) => {
    const gameId = get().gameId;
    if (!gameId) return;
    set(s => ({
      difficultyRangeByGame: {
        ...s.difficultyRangeByGame,
        [gameId]: range,
      },
    }));
  },
  setGeneratorParam: (gameId, key, value) => {
    if (!isValidGeneratorParamValue(value)) return;
    set(s => ({
      generatorError: null,
      generatorParamsByGame: {
        ...s.generatorParamsByGame,
        [gameId]: {
          ...getGeneratorParams(gameId, s.generatorParamsByGame[gameId]),
          [key]: value,
        },
      },
    }));
  },
  resetGeneratorParams: (gameId) => set(s => ({
    generatorError: null,
    generatorParamsByGame: {
      ...s.generatorParamsByGame,
      [gameId]: getGeneratorParams(gameId),
    },
  })),

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
    persistGameSession({
      gameId: s.gameId,
      plugin: s.plugin,
      gameState: s.gameState,
      history: s.history,
      historyIndex: s.historyIndex,
      optimalSteps: s.currentOptimalSteps ?? s.initialOptimalSteps,
      elapsedMs,
    });
  },
}));
