import { create } from 'zustand';
import type { GamePlugin, GameState, Move, Solution } from '@ludus/core';
import { getGame, solveNimState, solveWythoffState } from '@ludus/games';
import { findWinningMove } from '@ludus/core';
import { findWythoffWinningMove, isWythoffPPosition } from '@ludus/core';
import i18n from '../i18n';

export type DisclosureLevel = 1 | 2 | 3;

function scheduleNimAI(get: () => GameStore) {
  setTimeout(() => {
    const s = get();
    if (!s.plugin || s.plugin.metadata.id !== 'nim' || s.solvePlayback) return;
    const ns = s.gameState as unknown as { piles: number[]; currentPlayer: 0 | 1; phase: string } | null;
    if (!ns || ns.currentPlayer !== 1 || ns.phase !== 'playing') return;
    if (ns.piles.every((v: number) => v === 0)) return;
    const wm = findWinningMove(ns.piles);
    if (wm) {
      s.applyMove({ pileIndex: wm.pileIndex, removeCount: wm.removeCount } as Move);
    } else {
      const firstNonEmpty = ns.piles.findIndex((v: number) => v > 0);
      if (firstNonEmpty >= 0) {
        s.applyMove({ pileIndex: firstNonEmpty, removeCount: 1 } as Move);
      }
    }
  }, 600);
}

function scheduleWythoffAI(get: () => GameStore) {
  setTimeout(() => {
    const s = get();
    if (!s.plugin || s.plugin.metadata.id !== 'wythoff' || s.solvePlayback) return;
    const ws = s.gameState as unknown as { piles: [number, number]; currentPlayer: 0 | 1; phase: string } | null;
    if (!ws || ws.currentPlayer !== 1 || ws.phase !== 'playing') return;
    if (ws.piles[0] === 0 && ws.piles[1] === 0) return;
    const wm = findWythoffWinningMove({ piles: ws.piles, currentPlayer: 1, initialPiles: ws.piles, phase: 'playing' });
    if (wm) {
      s.applyMove(wm as Move);
    } else {
      // P-position: take 1 from the larger pile (consistent with solveWythoffState)
      if (ws.piles[0]! >= ws.piles[1]! && ws.piles[0]! > 0) {
        s.applyMove({ type: 'single', pileIndex: 0, removeCount: 1 } as Move);
      } else if (ws.piles[1]! > 0) {
        s.applyMove({ type: 'single', pileIndex: 1, removeCount: 1 } as Move);
      }
    }
  }, 600);
}

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
  hintMove: Move | null;
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
    const isAdversarial = gameId === 'nim' || gameId === 'wythoff';
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
      initialOptimalSteps: isAdversarial ? null : opt,
      currentOptimalSteps: isAdversarial ? null : opt,
      solvePlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      startTime: Date.now(),
      elapsed: 0,
      educationOpen: false,
    });

    if (!isFastGame) scheduleBackgroundSolve(get, set, state);
    else if (gameId === 'nim') scheduleNimAI(get);
    else if (gameId === 'wythoff') scheduleWythoffAI(get);
  },

  applyMove: (move) => {
    const { plugin, gameState, history, historyIndex, solvePlayback } = get();
    if (!plugin || !gameState) return;
    if (!solvePlayback && plugin.isSolved(gameState)) return;

    const newState = plugin.applyMove(gameState, move);
    // 非法移动返回原引用，跳过
    if (newState === gameState) return;

    const newHistory = [...history.slice(0, historyIndex + 1), newState];

    // 演示期间不覆盖 solution
    const keepExistingSolution = solvePlayback && get().solution;

    // Lights Out 的 GF(2) 求解 < 1ms，每一步都重新求解以保持可视化同步
    // Sokoban 的 BFS 可能很慢，保留旧解，不阻塞 UI
    let solution = keepExistingSolution ? get().solution! : get().solution;
    const isNim = plugin.metadata.id === 'nim';
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

    if (plugin.metadata.id === 'nim' && !solvePlayback) {
      scheduleNimAI(get);
    } else if (plugin.metadata.id === 'wythoff' && !solvePlayback) {
      scheduleWythoffAI(get);
    }
  },

  undo: () => {
    const { historyIndex, history, solvePlayback, plugin } = get();
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const newState = history[newIdx]!;
      // Lights Out 的 GF(2) 求解 < 1ms，撤销后同步刷新可视化
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
      if (plugin?.metadata.id === 'nim') scheduleNimAI(get);
      else if (plugin?.metadata.id === 'wythoff') scheduleWythoffAI(get);
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
      if (plugin?.metadata.id === 'nim') scheduleNimAI(get);
      else if (plugin?.metadata.id === 'wythoff') scheduleWythoffAI(get);
    }
  },

  reset: () => {
    const { history, plugin, solution: prevSol } = get();
    if (history.length === 0) return;
    const initial = history[0]!;
    const isFastGame = plugin?.metadata.isFastSolver;
    // 重置回初始状态，旧解如果存在就是针对这个状态的，保留它
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
    const isAdversarial = plugin.metadata.id === 'nim' || plugin.metadata.id === 'wythoff';
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
      initialOptimalSteps: isAdversarial ? null : opt,
      currentOptimalSteps: isAdversarial ? null : opt,
      solvePlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      startTime: Date.now(),
      elapsed: 0,
    });

    if (!isFastGame) scheduleBackgroundSolve(get, set, state);
    else if (plugin.metadata.id === 'nim') scheduleNimAI(get);
    else if (plugin.metadata.id === 'wythoff') scheduleWythoffAI(get);
  },

  loadCustomState: (state: GameState) => {
    const { plugin, solution: prevSol } = get();
    const isFastGame = plugin?.metadata.isFastSolver;
    const isAdversarial = plugin?.metadata.id === 'nim' || plugin?.metadata.id === 'wythoff';
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
      initialOptimalSteps: isAdversarial ? null : opt,
      currentOptimalSteps: isAdversarial ? null : opt,
      solvePlayback: false,
      solveStepIndex: 0,
      prePlaybackHistoryIndex: 0,
      startTime: Date.now(),
      elapsed: 0,
    });

    if (!isFastGame) scheduleBackgroundSolve(get, set, state);
    else if (plugin?.metadata.id === 'nim') scheduleNimAI(get);
    else if (plugin?.metadata.id === 'wythoff') scheduleWythoffAI(get);
  },

  requestSolve: () => {
    const { plugin, gameState } = get();
    if (!plugin || !gameState) return;

    const isAdversarial = plugin.metadata.id === 'nim' || plugin.metadata.id === 'wythoff';
    const ns = gameState as unknown as { piles?: number[]; phase?: string; currentPlayer?: number } | null;

    // Adversarial choosing phase: highlight recommendation then auto-choose and play
    if (isAdversarial && ns?.phase === 'choosing' && ns?.piles) {
      const piles = ns.piles;
      const isNim = plugin.metadata.id === 'nim';
      // Nim: N-position if nimSum ≠ 0 (XOR ALL piles). Wythoff: N-position if not a P-position
      const isNPosition = isNim
        ? piles.reduce((a: number, b: number) => a ^ b, 0) !== 0
        : !isWythoffPPosition(piles[0]!, piles[1]!);
      const playerFirst = isNPosition;
      set({ solverStatus: 'running', solveError: null, hintMove: { pileIndex: -1, removeCount: playerFirst ? 0 : 1 } as Move });
      setTimeout(() => {
        let state: Record<string, unknown> = {
          ...ns, currentPlayer: playerFirst ? 0 : 1, phase: 'playing',
          piles: [...piles], initialPiles: [...piles],
        };
        if (!playerFirst) {
          const wm = isNim
            ? findWinningMove(piles as number[])
            : findWythoffWinningMove({ piles: piles as [number, number], currentPlayer: 1, initialPiles: piles as [number, number], phase: 'playing' });
          if (wm) {
            const newPiles = [...piles];
            if ('pileIndex' in wm && wm.pileIndex != null) {
              newPiles[wm.pileIndex]! -= wm.removeCount;
            } else {
              newPiles[0]! -= wm.removeCount;
              newPiles[1]! -= wm.removeCount;
            }
            state.piles = newPiles;
          } else {
            const idx = piles.findIndex((v: number) => v > 0);
            if (idx >= 0) {
              const newPiles = [...piles];
              newPiles[idx]! -= 1;
              state.piles = newPiles;
            }
          }
          state.currentPlayer = 0;
        }
        set({ gameState: state as GameState, hintMove: null });
        const sol = isNim
          ? solveNimState(state as Parameters<typeof solveNimState>[0])
          : solveWythoffState(state as Parameters<typeof solveWythoffState>[0]);
        if (sol.solvable && sol.moves.length > 0) {
          set({ solution: sol, solverStatus: 'done', solvePlayback: true, solveStepIndex: 0, prePlaybackHistoryIndex: 0, hintMove: null });
        } else {
          const errKey = isNim ? 'nim.noWinningStrategy' : 'wythoff.noWinningStrategy';
          set({ solution: sol, solverStatus: 'done', solveError: i18n.t(errKey) });
        }
      }, 300);
      return;
    }

    // Adversarial playing phase: use game-specific alternating solver
    if (isAdversarial) {
      set({ solverStatus: 'running', solveError: null });
      setTimeout(() => {
        const gameId = plugin.metadata.id;
        const sol = gameId === 'nim'
          ? solveNimState(gameState as Parameters<typeof solveNimState>[0])
          : solveWythoffState(gameState as Parameters<typeof solveWythoffState>[0]);
        if (sol.solvable && sol.moves.length > 0) {
          set({ solution: sol, solverStatus: 'done', solvePlayback: true, solveStepIndex: 0, prePlaybackHistoryIndex: get().historyIndex, hintMove: null });
        } else {
          const errKey = plugin.metadata.id === 'nim' ? 'nim.noWinningStrategy' : 'wythoff.noWinningStrategy';
          set({ solution: sol, solverStatus: 'done', solveError: i18n.t(errKey) });
        }
      }, 50);
      return;
    }

    set({ solverStatus: 'running', solveError: null });

    // 延迟让 'running' 状态有机会 render（BFS 会阻塞主线程）
    setTimeout(() => {
      const { plugin, gameState } = get();
      if (!plugin || !gameState) return;
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

    // Adversarial choosing phase: set hintMove to recommend hand
    const ns = gameState as unknown as { piles?: number[]; phase?: string } | null;
    const isAdversarial = plugin.metadata.id === 'nim' || plugin.metadata.id === 'wythoff';
    if (isAdversarial && ns?.phase === 'choosing' && ns?.piles) {
      const piles = ns.piles;
      // P-position → choose AI-first (后手, removeCount=1); N-position → choose player-first (先手, removeCount=0)
      let isP: boolean;
      if (plugin.metadata.id === 'nim') {
        isP = (piles as number[]).reduce((a: number, b: number) => a ^ b, 0) === 0;
      } else {
        isP = isWythoffPPosition(piles[0]!, piles[1]!);
      }
      set({ solverStatus: 'done', hintMove: { pileIndex: -1, removeCount: isP ? 1 : 0 } as Move });
      return;
    }

    set({ solverStatus: 'running' });
    // setTimeout 让 'running' 状态有机会 render（BFS 会阻塞主线程）
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
          // Adversarial: P-position — inform player there is no winning move
          solveError: plugin.metadata.id === 'nim' ? i18n.t('nim.noWinningMove')
            : plugin.metadata.id === 'wythoff' ? i18n.t('wythoff.noWinningMove')
            : null,
        });
      }
    }, 50);
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

    if (isLastStep) {
      if (get().plugin?.metadata.id === 'wythoff') scheduleWythoffAI(get);
      else scheduleNimAI(get);
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
    // 一次性回退所有演示步骤，避免多次重渲染
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
    // 播放期间不覆盖 solution
    if (level >= 2 && plugin && gameState && !solvePlayback) {
      // Lights Out GF(2) 瞬时求解；Sokoban BFS 可能很慢，保留旧解避免阻塞 UI
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
