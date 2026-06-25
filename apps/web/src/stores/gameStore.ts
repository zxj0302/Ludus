import { create } from 'zustand';
import type { GamePlugin, GameState, Move, Solution } from '@ludus/core';
import { getGame } from '@ludus/games';
import i18n from '../i18n';

export type DisclosureLevel = 1 | 2 | 3;
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

  // 提示
  hintMove: { row: number; col: number } | null;
  // 最优步数：initial = 初始关卡的最优 / current = 当前状态的最优（剩余步数）
  initialOptimalSteps: number | null;
  currentOptimalSteps: number | null;

  // 求解演示
  solvePlayback: boolean;
  solveStepIndex: number;
  /** 演示开始前的 historyIndex，用于 stopPlayback 恢复 */
  prePlaybackHistoryIndex: number;

  // 计时
  startTime: number | null;
  elapsed: number;

  // 教育
  disclosureLevel: DisclosureLevel;
  educationOpen: boolean;

  // 语言 & 音效
  language: string;
  soundEnabled: boolean;

  loadGame: (gameId: string) => void;
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
}

function generatePlayableState(plugin: GamePlugin): GameState {
  try {
    const level = plugin.generateLevel({
      difficultyRange: [10, 50],
      size: 5,
      requireUniqueSolution: false,
    });
    return level.initialState as GameState;
  } catch {
    // fallback: 随机走子直到产生非全灭状态
    let state = plugin.initialState();
    const moves = plugin.legalMoves(state);
    for (let attempt = 0; attempt < 20; attempt++) {
      state = plugin.initialState();
      const numMoves = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < numMoves; i++) {
        const m = moves[Math.floor(Math.random() * moves.length)]!;
        state = plugin.applyMove(state, m);
      }
      if (!plugin.isSolved(state)) break;
    }
    return state;
  }
}

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
    // 始终计算最优步数以持续显示
    const sol = plugin.solve(state);
    const opt = sol.solvable ? sol.stats.solutionLength : null;
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
      initialOptimalSteps: opt,
      currentOptimalSteps: opt,
      solvePlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      startTime: Date.now(),
      elapsed: 0,
      educationOpen: false,
    });
  },

  applyMove: (move) => {
    const { plugin, gameState, history, historyIndex, solvePlayback } = get();
    if (!plugin || !gameState) return;
    if (!solvePlayback && plugin.isSolved(gameState)) return;

    const newState = plugin.applyMove(gameState, move);
    const newHistory = [...history.slice(0, historyIndex + 1), newState];
    const isWin = plugin.isSolved(newState);

    // 始终重新计算当前状态的最优解
    const sol = plugin.solve(newState);
    const currentOpt = sol.solvable ? sol.stats.solutionLength : null;

    // 演示期间不覆盖 solution（保留原始求解结果供步骤列表用）
    const keepExistingSolution = solvePlayback && get().solution;
    set({
      gameState: newState,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      hintMove: null,
      currentOptimalSteps: currentOpt,
      solution: keepExistingSolution ? get().solution! : sol,
    });
  },

  undo: () => {
    const { historyIndex, history, plugin, solvePlayback } = get();
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const newState = history[newIdx]!;
      const sol = plugin?.solve(newState);
      set({
        historyIndex: newIdx,
        gameState: newState,
        // 播放期间不覆盖 solution（保持演示用的解）
        solution: solvePlayback ? get().solution : (sol ?? null),
        currentOptimalSteps: sol?.solvable ? sol.stats.solutionLength : null,
        hintMove: null,
      });
    }
  },

  redo: () => {
    const { historyIndex, history, plugin, solvePlayback } = get();
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      const newState = history[newIdx]!;
      const sol = plugin?.solve(newState);
      set({
        historyIndex: newIdx,
        gameState: newState,
        solution: solvePlayback ? get().solution : (sol ?? null),
        currentOptimalSteps: sol?.solvable ? sol.stats.solutionLength : null,
        hintMove: null,
      });
    }
  },

  reset: () => {
    const { history, plugin } = get();
    if (history.length === 0) return;
    const initial = history[0]!;
    const sol = plugin?.solve(initial);
    set({
      historyIndex: 0,
      gameState: initial,
      history: [initial],
      solution: sol ?? null,
      solveError: null,
      hintMove: null,
      currentOptimalSteps: sol?.solvable ? sol.stats.solutionLength : null,
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
    // 始终计算最优步数
    const sol = plugin.solve(state);
    const opt = sol.solvable ? sol.stats.solutionLength : null;
    set({
      gameState: state,
      history: [state],
      historyIndex: 0,
      solverStatus: 'idle',
      solution: sol,
      solveError: null,
      hintMove: null,
      initialOptimalSteps: opt,
      currentOptimalSteps: opt,
      solvePlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      startTime: Date.now(),
      elapsed: 0,
    });
  },

  requestSolve: () => {
    const { plugin, gameState, historyIndex } = get();
    if (!plugin || !gameState) return;
    set({ solverStatus: 'running', solveError: null });

    const solution = plugin.solve(gameState);
    if (solution.solvable && solution.moves.length > 0) {
      set({
        solution,
        solverStatus: 'done',
        solvePlayback: true,
        solveStepIndex: 0,
        prePlaybackHistoryIndex: get().historyIndex,
        hintMove: null,
      });
    } else {
      set({ solution, solverStatus: 'done' });
    }
  },

  requestHint: () => {
    const { plugin, gameState } = get();
    if (!plugin || !gameState) return;

    const solution = plugin.solve(gameState);
    if (solution.solvable && solution.moves.length > 0) {
      const firstMove = solution.moves[0] as { row: number; col: number };
      set({
        hintMove: { row: firstMove.row, col: firstMove.col },
        currentOptimalSteps: solution.moves.length,
        solution,
      });
    } else {
      set({
        hintMove: null,
        currentOptimalSteps: null,
        solution,
      });
    }
  },

  nextPlaybackStep: () => {
    const { solution, solveStepIndex } = get();
    if (!solution) return;

    const currentMove = solution.moves[solveStepIndex];
    if (!currentMove) return;

    // 走正常的 applyMove 路径（确保 history/undo/currentOptimalSteps 一致）
    get().applyMove(currentMove);

    const nextIdx = solveStepIndex + 1;
    const isLastStep = nextIdx >= solution.moves.length;
    set({
      solveStepIndex: isLastStep ? 0 : nextIdx,
      solvePlayback: !isLastStep,
    });
  },

  prevPlaybackStep: () => {
    const { solveStepIndex } = get();
    if (solveStepIndex > 0) {
      get().undo();
      set({ solveStepIndex: solveStepIndex - 1 });
    }
  },

  stopPlayback: () => {
    // 回退所有演示步骤，恢复到演示前状态
    const { prePlaybackHistoryIndex, historyIndex } = get();
    while (get().historyIndex > prePlaybackHistoryIndex) {
      get().undo();
    }
    set({ solvePlayback: false, solveStepIndex: 0 });
  },

  setDisclosureLevel: (level) => {
    const { plugin, gameState, solvePlayback, solution } = get();
    // 播放期间不覆盖 solution
    if (level >= 2 && plugin && gameState && !solvePlayback) {
      const sol = plugin.solve(gameState);
      set({
        disclosureLevel: level,
        solution: sol,
        currentOptimalSteps: sol.solvable ? sol.stats.solutionLength : null,
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
}));
