import { create } from 'zustand';
import type { GamePlugin, GameState, Move, Solution } from '@ludus/core';
import { getGame } from '@ludus/games';
import type { DisclosureLevel } from '@ludus/ui';
import i18n from '../i18n';

// ═══════════════════════════════════════════════════════════════
// 通用 AI 调度 — 通过 plugin.ai 实现，不依赖具体游戏
// ═══════════════════════════════════════════════════════════════

function getPlayerStarts(solution: Solution | null): boolean {
  return (solution?.trace?.visualizationData as Record<string, unknown> | undefined)?.playerStarts as boolean ?? true;
}

function scheduleAI(get: () => GameStore) {
  setTimeout(() => {
    const s = get();
    if (!s.plugin?.ai || !s.gameState || s.solvePlayback) return;
    if (!s.plugin.ai.isAITurn(s.gameState)) return;
    const action = s.plugin.ai.getAIMove(s.gameState);
    if (!action) return;
    get().applyMove(action.move);
    // applyMove 已自动重求解（solver 现支持 currentPlayer 视角），无需再手动更新
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

  // 游戏结束 → 停止播放，更新 solution 为终局结果（触发最优解卡片显示"游戏结束"）
  if (plugin.isSolved(gameState)) {
    const endSol = plugin.solve(gameState);
    set({ solvePlayback: false, adversarialPlayback: false, solution: endSol });
    return;
  }

  // AI 的回合 → 让真实 AI 走子，然后继续
  if (plugin.ai.isAITurn(gameState)) {
    setTimeout(() => {
      const s = get();
      if (!s.plugin?.ai || !s.gameState || !s.adversarialPlayback) return;
      const aiAction = s.plugin.ai.getAIMove(s.gameState);
      if (!aiAction) {
        set({ solvePlayback: false, adversarialPlayback: false });
        return;
      }
      get().applyMove(aiAction.move);
      // 等 AI 走子高亮显示后，继续下一步
      setTimeout(() => adversarialSolveStep(get, set), 600);
    }, 600);
    return;
  }

  // 玩家的回合 → 动态求解当前状态的最佳走子
  const solution = plugin.solve(gameState);
  set({ solution });

  if (solution.solvable && solution.moves.length > 0) {
    setTimeout(() => {
      const s = get();
      if (!s.adversarialPlayback) return;
      get().applyMove(solution.moves[0]!);
      // 走子后轮到 AI，延迟后继续
      setTimeout(() => adversarialSolveStep(get, set), 600);
    }, 400);
  } else {
    // P-position 或不可解 → 停止
    set({ solvePlayback: false, adversarialPlayback: false });
  }
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
  /** 绕过 moveToHighlight 的直接高亮坐标（对抗游戏选先后手等场景） */
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
      hintHighlight: null,
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
      hintHighlight: null,
      currentOptimalSteps: null,
      solveError: null,
      solution,
    });

    if (!solvePlayback && plugin.ai && !plugin.isSolved(newState)) scheduleAI(get);
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
        hintHighlight: null,
        solveError: null,
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
        hintHighlight: null,
        solveError: null,
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
      hintHighlight: null,
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
      hintHighlight: null,
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
      hintHighlight: null,
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

      // 对抗游戏：逐步播放，每步动态求解 + AI 用真实 getAIMove 响应
      const isAdversarial = !!p.ai;
      if (isAdversarial) {
        const sAny = s as any;

        // 选先后手阶段：先高亮最优选择，短暂延迟后自动选定并开始播放
        if (sAny.phase === 'choosing') {
          const playerStarts = getPlayerStarts(solution);
          // 先高亮按钮告诉玩家选择了什么
          set({
            hintHighlight: { row: 0, col: playerStarts ? 0 : 1 },
            solution,
            solverStatus: 'done',
          });
          // 短暂展示后自动选定并开始播放
          setTimeout(() => {
            const cur = get();
            if (!cur.plugin?.ai) return;
            const playingState = { ...sAny, currentPlayer: playerStarts ? 0 : 1, phase: 'playing' };
            set({
              gameState: playingState,
              history: [s, playingState],
              historyIndex: 1,
              solvePlayback: true,
              adversarialPlayback: true,
              solveStepIndex: 0,
              prePlaybackHistoryIndex: 0,
              hintMove: null,
              hintHighlight: null,
            });
            setTimeout(() => adversarialSolveStep(get, set), 600);
          }, 800);
          return;
        }

        // 博弈阶段 P-position（必输）：不播放，告知用户无必胜策略
        if (!solution.solvable || solution.moves.length === 0) {
          set({ solution, solverStatus: 'done', solveError: i18n.t('game.status.noWinningMove') });
          return;
        }

        set({
          solution,
          solverStatus: 'done',
          solvePlayback: true,
          adversarialPlayback: true,
          solveStepIndex: 0,
          prePlaybackHistoryIndex: get().historyIndex,
          hintMove: null,
          hintHighlight: null,
        });
        setTimeout(() => adversarialSolveStep(get, set), 400);
        return;
      }

      if (solution.solvable && solution.moves.length > 0) {
        set({
          solution,
          solverStatus: 'done',
          solvePlayback: true,
          solveStepIndex: 0,
          prePlaybackHistoryIndex: get().historyIndex,
          hintMove: null,
          hintHighlight: null,
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
      const isAdversarial = !!p.ai;

      // 对抗游戏选先后手阶段：高亮"先手"或"后手"按钮
      if (isAdversarial && (s as any).phase === 'choosing') {
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
    }, 50);
  },

  nextPlaybackStep: () => {
    if (get().adversarialPlayback) return; // 对抗播放时禁用手动步进
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
    if (get().adversarialPlayback) return; // 对抗播放时禁用手动步进
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
      adversarialPlayback: false,
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
