import { create } from 'zustand';
import type { GamePlugin, GameState, Move, Solution } from '@ludus/core';
import { getGame } from '@ludus/games';
import type { DisclosureLevel } from '@ludus/ui';
import i18n from '../i18n';

// ═══════════════════════════════════════════════════════════════
// 通用 AI 调度 — 通过 plugin.ai 实现，不依赖具体游戏
// ═══════════════════════════════════════════════════════════════

function scheduleAI(get: () => GameStore) {
  setTimeout(() => {
    const s = get();
    if (!s.plugin?.ai || !s.gameState || s.solvePlayback) return;
    if (!s.plugin.ai.isAITurn(s.gameState)) return;
    const action = s.plugin.ai.getAIMove(s.gameState);
    if (!action) return;
    get().applyMove(action.move);
  }, 600);
}

// ═══════════════════════════════════════════════════════════════
// 后台求解 — 对慢求解器延迟 500ms 执行，不阻塞 UI
// ═══════════════════════════════════════════════════════════════

function scheduleBackgroundSolve(
  get: () => GameStore,
  set: (partial: Partial<GameStore>) => void,
  savedState: GameState,
) {
  setTimeout(() => {
    const { plugin: p, gameState: s } = get();
    if (!p || s !== savedState) return;
    const bgSol = p.solve(s);
    if (bgSol.solvable && bgSol.moves.length > 0) {
      set({
        solution: bgSol,
        initialOptimalSteps: bgSol.stats.solutionLength > 0 ? bgSol.stats.solutionLength : null,
        currentOptimalSteps: bgSol.stats.solutionLength > 0 ? bgSol.stats.solutionLength : null,
      });
    }
  }, 500);
}

// ═══════════════════════════════════════════════════════════════
// 关卡生成 — 尝试 generateLevel，失败则 fallback 到 initialState
// ═══════════════════════════════════════════════════════════════

function generatePlayableState(plugin: GamePlugin): GameState {
  try {
    const level = plugin.generateLevel({
      difficultyRange: [10, 50],
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
  initialOptimalSteps: number | null;
  currentOptimalSteps: number | null;

  solvePlayback: boolean;
  solveStepIndex: number;
  prePlaybackHistoryIndex: number;

  startTime: number | null;
  elapsed: number;

  disclosureLevel: DisclosureLevel;
  educationOpen: boolean;

  language: string;
  soundEnabled: boolean;

  loadGame: (gameId: string) => void;
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
  pauseTimer: () => void;
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
  initialOptimalSteps: null,
  currentOptimalSteps: null,
  solvePlayback: false,
  solveStepIndex: 0,
  prePlaybackHistoryIndex: 0,
  startTime: null,
  elapsed: 0,
  disclosureLevel: 1,
  educationOpen: false,
  language: 'zh-CN',
  soundEnabled: true,

  loadGame: (gameId) => {
    const plugin = getGame(gameId);
    if (!plugin) return;
    const state = generatePlayableState(plugin);

    const isFastGame = plugin.metadata.isFastSolver;
    const hasAI = !!plugin.ai;
    const sol = isFastGame ? plugin.solve(state) : null;
    const opt = sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null;

    set({
      gameId,
      plugin,
      gameState: state,
      history: [state],
      historyIndex: 0,
      solverStatus: 'idle',
      solution: sol,
      solveError: null,
      hintMove: null,
      initialOptimalSteps: hasAI ? null : opt,
      currentOptimalSteps: hasAI ? null : opt,
      solvePlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      startTime: Date.now(),
      elapsed: 0,
      educationOpen: false,
    });

    if (!isFastGame) scheduleBackgroundSolve(get, set, state);
    if (hasAI) scheduleAI(get);
  },

  applyMove: (move) => {
    const { plugin, gameState, history, historyIndex, solvePlayback } = get();
    if (!plugin || !gameState) return;
    if (!solvePlayback && plugin.isSolved(gameState)) return;

    const newState = plugin.applyMove(gameState, move);
    if (newState === gameState) return;

    const newHistory = [...history.slice(0, historyIndex + 1), newState];

    const keepExistingSolution = solvePlayback && get().solution;

    let solution = keepExistingSolution ? get().solution! : get().solution;
    if (!keepExistingSolution && plugin.metadata.isFastSolver) {
      solution = plugin.solve(newState);
    }

    set({
      gameState: newState,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      hintMove: null,
      currentOptimalSteps: null,
      solution,
    });

    if (!solvePlayback && plugin.ai) scheduleAI(get);
  },

  undo: () => {
    const { historyIndex, history, solvePlayback, plugin } = get();
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const newState = history[newIdx]!;
      let solution = get().solution;
      if (!solvePlayback && plugin?.metadata.isFastSolver) {
        solution = plugin.solve(newState);
      }
      set({
        historyIndex: newIdx,
        gameState: newState,
        solution,
        currentOptimalSteps: null,
        hintMove: null,
      });
      if (plugin?.ai) scheduleAI(get);
    }
  },

  redo: () => {
    const { historyIndex, history, solvePlayback, plugin } = get();
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      const newState = history[newIdx]!;
      let solution = get().solution;
      if (!solvePlayback && plugin?.metadata.isFastSolver) {
        solution = plugin.solve(newState);
      }
      set({
        historyIndex: newIdx,
        gameState: newState,
        solution,
        currentOptimalSteps: null,
        hintMove: null,
      });
      if (plugin?.ai) scheduleAI(get);
    }
  },

  reset: () => {
    const { history, plugin, solution: prevSol } = get();
    if (history.length === 0) return;
    const initial = history[0]!;
    const isFastGame = plugin?.metadata.isFastSolver;
    const sol = isFastGame ? plugin?.solve(initial) ?? null : prevSol;
    set({
      historyIndex: 0,
      gameState: initial,
      history: [initial],
      solution: sol,
      solveError: null,
      hintMove: null,
      currentOptimalSteps: sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null,
      solverStatus: 'idle',
      solvePlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      startTime: Date.now(),
      elapsed: 0,
    });
  },

  newLevel: () => {
    const { plugin } = get();
    if (!plugin) return;
    const state = generatePlayableState(plugin);
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
      initialOptimalSteps: hasAI ? null : opt,
      currentOptimalSteps: hasAI ? null : opt,
      solvePlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      startTime: Date.now(),
      elapsed: 0,
    });

    if (!isFastGame) scheduleBackgroundSolve(get, set, state);
    if (hasAI) scheduleAI(get);
  },

  loadCustomState: (state: GameState) => {
    const { plugin, solution: prevSol } = get();
    const isFastGame = plugin?.metadata.isFastSolver;
    const hasAI = !!plugin?.ai;
    const sol = isFastGame ? plugin?.solve(state) ?? null : prevSol;
    const opt = sol?.solvable && sol.stats.solutionLength > 0 ? sol.stats.solutionLength : null;
    set({
      gameState: state,
      history: [state],
      historyIndex: 0,
      solverStatus: 'idle',
      solution: sol,
      solveError: null,
      hintMove: null,
      initialOptimalSteps: hasAI ? null : opt,
      currentOptimalSteps: hasAI ? null : opt,
      solvePlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      startTime: Date.now(),
      elapsed: 0,
    });

    if (!isFastGame) scheduleBackgroundSolve(get, set, state);
    if (hasAI) scheduleAI(get);
  },

  requestSolve: () => {
    const { plugin, gameState } = get();
    if (!plugin || !gameState) return;

    set({ solverStatus: 'running', solveError: null });

    setTimeout(() => {
      const { plugin: p, gameState: s } = get();
      if (!p || !s) return;
      const solution = p.solve(s);
      if (solution.solvable && solution.moves.length > 0) {
        set({
          solution,
          solverStatus: 'done',
          solvePlayback: true,
          solveStepIndex: 0,
          prePlaybackHistoryIndex: get().historyIndex,
          hintMove: null,
        });
      } else if (solution.stats.terminated === 'timeout') {
        set({ solution, solverStatus: 'done', solveError: i18n.t('game.status.timedOut') });
      } else {
        set({ solution, solverStatus: 'done' });
      }
    }, 50);
  },

  requestHint: () => {
    const { plugin, gameState } = get();
    if (!plugin || !gameState) return;

    set({ solverStatus: 'running' });
    setTimeout(() => {
      const { plugin: p, gameState: s } = get();
      if (!p || !s) return;
      const solution = p.solve(s);
      if (solution.solvable && solution.moves.length > 0) {
        set({
          hintMove: solution.moves[0]!,
          currentOptimalSteps: solution.stats.solutionLength > 0 ? solution.stats.solutionLength : null,
          solution,
          solverStatus: 'done',
        });
      } else {
        set({
          hintMove: null,
          currentOptimalSteps: null,
          solution,
          solverStatus: 'done',
        });
      }
    }, 50);
  },

  nextPlaybackStep: () => {
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

    if (isLastStep) {
      scheduleAI(get);
    }
  },

  prevPlaybackStep: () => {
    const { solveStepIndex } = get();
    if (solveStepIndex > 0) {
      get().undo();
      set({ solveStepIndex: solveStepIndex - 1 });
    }
  },

  stopPlayback: () => {
    const { prePlaybackHistoryIndex, history } = get();
    const idx = Math.max(0, prePlaybackHistoryIndex);
    set({
      historyIndex: idx,
      gameState: history[idx],
      history: history.slice(0, idx + 1),
      solvePlayback: false,
      solveStepIndex: 0,
    });
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

  tick: () => {
    const { startTime } = get();
    if (startTime) {
      set({ elapsed: Date.now() - startTime });
    }
  },

  pauseTimer: () => {
    const { startTime } = get();
    if (startTime) {
      set({ elapsed: Date.now() - startTime, startTime: null });
    }
  },
}));
