import type { GamePlugin, GameState, Move, Solution, WorkerRequest, WorkerResponse } from '@ludus/core';
import i18n from '../i18n';
import { getPlayerStarts } from '../utils/solution';
import { scheduleTimeout, clearAllPlaybackTimers } from '../utils/playbackController';
import SolverWorker from '../workers/solver.worker?worker';

import * as solverRuntime from './gameStoreSolverRuntime';

export interface PlaybackStateFields {
  solvePlayback: boolean;
  adversarialPlayback: boolean;
  solveStepIndex: number;
  prePlaybackHistoryIndex: number;
}

export interface SolverRuntimeStore extends PlaybackStateFields {
  gameId: string | null;
  plugin: GamePlugin | null;
  gameState: GameState | null;
  historyIndex?: number;
  solution: Solution | null;
  initialOptimalSteps: number | null;
  currentOptimalSteps: number | null;
  hintMove?: Move | null;
  hintHighlight?: { row: number; col: number } | null;
  applyMove: (move: Move) => void;
}

export type SolverStoreGet = () => SolverRuntimeStore;
export type SolverStoreSet = (partial: Partial<SolverRuntimeStore> & Record<string, unknown>) => void;
type AiMoveAction = { move: Move; delay: number; tier?: string };

let aiTimerId: ReturnType<typeof setTimeout> | null = null;
let aiRunId = 0;
let bgSolverTimerId: ReturnType<typeof setTimeout> | null = null;
let bgWorkerReqId = 0;
let solveInFlight = false;
let bgSolveCancel: (() => void) | null = null;
let activeSolveCancel: (() => void) | null = null;

export function cancelActiveSolve(): void {
  if (activeSolveCancel) {
    activeSolveCancel();
    activeSolveCancel = null;
  }
}

export function setActiveSolveCancel(cancel: (() => void) | null): void {
  if (activeSolveCancel) {
    activeSolveCancel();
  }
  activeSolveCancel = cancel;
}

export function isSolveInFlight(): boolean {
  return solveInFlight;
}

export function setSolveInFlight(value: boolean): void {
  solveInFlight = value;
}

export function hasWorkerSupport(): boolean {
  return typeof Worker !== 'undefined';
}

export function usesWebWorker(plugin: GamePlugin): boolean {
  const web = plugin.metadata.platformSupport.find(p => p.platform === 'web');
  return web?.capabilities.webWorker === true;
}

function requestWorkerAiMove(plugin: GamePlugin, state: GameState): Promise<AiMoveAction | null> {
  if (!hasWorkerSupport()) {
    return Promise.reject(new Error('Web Worker is not available in this environment'));
  }
  return new Promise((resolve, reject) => {
    const worker = new SolverWorker();
    const reqId = `ai-${++bgWorkerReqId}`;
    let done = false;

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.id !== reqId || done) return;
      done = true;
      worker.terminate();
      if (e.data.error) {
        reject(new Error(e.data.error));
        return;
      }
      resolve((e.data.result ?? null) as AiMoveAction | null);
    };

    worker.onerror = (err) => {
      if (done) return;
      done = true;
      worker.terminate();
      reject(new Error(err.message || 'AI Worker failed'));
    };

    worker.postMessage({
      id: reqId,
      type: 'ai-move',
      payload: { gameId: plugin.metadata.id, state: state as Record<string, unknown> },
    } satisfies WorkerRequest);
  });
}

export function clearPlaybackStateFields(): Partial<PlaybackStateFields> {
  return {
    solvePlayback: false,
    adversarialPlayback: false,
    solveStepIndex: 0,
    prePlaybackHistoryIndex: 0,
  };
}

export function cancelBackgroundSolve(): void {
  if (bgSolverTimerId) { clearTimeout(bgSolverTimerId); bgSolverTimerId = null; }
  if (bgSolveCancel) { bgSolveCancel(); bgSolveCancel = null; }
}

export function clearSolverRuntimeTimers(): void {
  if (aiTimerId) { clearTimeout(aiTimerId); aiTimerId = null; }
  aiRunId += 1;
  cancelBackgroundSolve();
  if (activeSolveCancel) {
    activeSolveCancel();
    activeSolveCancel = null;
  }
  clearAllPlaybackTimers();
  solveInFlight = false;
}

export function scheduleAI(get: SolverStoreGet): void {
  if (aiTimerId) clearTimeout(aiTimerId);
  const s = get();
  if (!s.plugin?.ai || !s.gameState || s.solvePlayback) return;
  if (!s.plugin.ai.isAITurn(s.gameState)) return;

  const workerSupported = hasWorkerSupport();
  const asyncPath = !!s.plugin?.ai?.getAIMoveAsync
    || (s.plugin?.metadata.id === 'thief-siege' && usesWebWorker(s.plugin) && workerSupported)
    || (s.plugin?.metadata.id === 'connect-four' && usesWebWorker(s.plugin) && workerSupported);
  const initialDelay = asyncPath ? 0 : 600;
  const runId = ++aiRunId;

  aiTimerId = setTimeout(async () => {
    aiTimerId = null;
    if (runId !== aiRunId) return;
    const current = get();
    if (!current.plugin?.ai || !current.gameState || current.solvePlayback) return;
    if (!current.plugin.ai.isAITurn(current.gameState)) return;

    const requestedPlugin = current.plugin;
    const requestedAi = current.plugin.ai;
    const requestedState = current.gameState;
    let action: AiMoveAction | null = null;

    if (
      (requestedPlugin.metadata.id === 'thief-siege' || requestedPlugin.metadata.id === 'connect-four')
      && usesWebWorker(requestedPlugin)
      && workerSupported
    ) {
      try {
        action = await requestWorkerAiMove(requestedPlugin, requestedState);
      } catch {
        action = requestedAi.getAIMoveAsync
          ? await requestedAi.getAIMoveAsync(requestedState)
          : requestedAi.getAIMove(requestedState);
      }
    } else if (requestedAi.getAIMoveAsync) {
      action = await requestedAi.getAIMoveAsync(requestedState);
    } else {
      action = requestedAi.getAIMove(requestedState);
    }

    if (!action || runId !== aiRunId) return;
    if (asyncPath) {
      await new Promise(resolve => setTimeout(resolve, Math.min(Math.max(0, action.delay ?? 0), 400)));
    }

    if (runId !== aiRunId) return;
    const latest = get();
    if (latest.gameState !== requestedState) return;
    if (!latest.plugin?.ai || latest.solvePlayback || !latest.gameState) return;
    if (!latest.plugin.ai.isAITurn(latest.gameState)) return;
    get().applyMove(action.move);
  }, initialDelay);
}

export function adversarialSolveStep(get: SolverStoreGet, set: SolverStoreSet): void {
  const { plugin, gameState, adversarialPlayback } = get();
  if (!plugin?.ai || !gameState || !adversarialPlayback) return;

  if (plugin.isSolved(gameState)) {
    const endSol = plugin.metadata.isFastSolver ? plugin.solve(gameState) : get().solution;
    set({ ...clearPlaybackStateFields(), solution: endSol });
    return;
  }

  if (plugin.ai.isAITurn(gameState)) {
    scheduleTimeout(() => {
      const s = get();
      if (!s.plugin?.ai || !s.gameState || !s.adversarialPlayback) return;
      const requestedPlugin = s.plugin;
      const requestedAi = s.plugin.ai;
      const requestedState = s.gameState;

      const applyAiPlaybackMove = (aiAction: AiMoveAction | null) => {
        const cur = get();
        if (!cur.plugin?.ai || cur.gameState !== requestedState || !cur.adversarialPlayback) return;
        if (!aiAction) {
          set(clearPlaybackStateFields());
          return;
        }
        get().applyMove(aiAction.move);
        scheduleTimeout(() => solverRuntime.adversarialSolveStep(get, set), 600);
      };

      if (
        (requestedPlugin.metadata.id === 'thief-siege' || requestedPlugin.metadata.id === 'connect-four')
        && usesWebWorker(requestedPlugin)
        && hasWorkerSupport()
      ) {
        requestWorkerAiMove(requestedPlugin, requestedState)
          .catch(() => (
            requestedAi.getAIMoveAsync
              ? requestedAi.getAIMoveAsync(requestedState)
              : requestedAi.getAIMove(requestedState)
          ))
          .then(applyAiPlaybackMove);
        return;
      }

      if (requestedAi.getAIMoveAsync) {
        requestedAi.getAIMoveAsync(requestedState).then(applyAiPlaybackMove);
        return;
      }

      applyAiPlaybackMove(requestedAi.getAIMove(requestedState));
    }, 600);
    return;
  }

  const handlePlayerSolution = (solution: Solution) => {
    const cur = get();
    if (cur.gameState !== gameState || !cur.adversarialPlayback) return;
    set({ solution });

    if (solution.solvable && solution.moves.length > 0) {
      scheduleTimeout(() => {
        const s = get();
        if (!s.adversarialPlayback) return;
        get().applyMove(solution.moves[0]!);
        scheduleTimeout(() => solverRuntime.adversarialSolveStep(get, set), 600);
      }, 400);
    } else {
      set(clearPlaybackStateFields());
    }
  };

  if (!plugin.metadata.isFastSolver && usesWebWorker(plugin) && hasWorkerSupport()) {
    solverRuntime.cancelActiveSolve();
    const { cancel } = solverRuntime.runSolverOffThread(
      plugin,
      gameState,
      (sol) => {
        solverRuntime.setActiveSolveCancel(null);
        handlePlayerSolution(sol);
      },
      () => {
        solverRuntime.setActiveSolveCancel(null);
        set(clearPlaybackStateFields());
      },
    );
    solverRuntime.setActiveSolveCancel(cancel);
    return;
  }

  handlePlayerSolution(plugin.solve(gameState));
}

export function runSolverOffThread(
  plugin: GamePlugin,
  state: GameState,
  onResult: (solution: Solution) => void,
  onError?: (message: string) => void,
): { cancel: () => void } {
  if (usesWebWorker(plugin) && hasWorkerSupport()) {
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

    worker.postMessage({
      id: reqId,
      type: 'solve',
      payload: { gameId: plugin.metadata.id, state: state as Record<string, unknown> },
    } satisfies WorkerRequest);
    return { cancel: () => { if (!done) { done = true; worker.terminate(); } } };
  }

  const timerId = setTimeout(() => {
    try {
      onResult(plugin.solve(state));
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Solver failed'));
    }
  }, 0);
  return { cancel: () => clearTimeout(timerId) };
}

export function scheduleBackgroundSolve(
  get: SolverStoreGet,
  set: SolverStoreSet,
  savedState: GameState,
  savedGameId: string,
): void {
  if (bgSolverTimerId) { clearTimeout(bgSolverTimerId); bgSolverTimerId = null; }
  if (bgSolveCancel) { bgSolveCancel(); bgSolveCancel = null; }

  const { plugin: p } = get();
  if (!p) return;

  bgSolverTimerId = setTimeout(() => {
    bgSolverTimerId = null;
    const { plugin: currentP, gameState: currentS, gameId: currentId } = get();
    if (!currentP || currentS !== savedState || currentId !== savedGameId) return;

    bgSolveCancel = solverRuntime.runSolverOffThread(
      currentP,
      currentS,
      (bgSol) => {
        bgSolveCancel = null;
        const { gameState: latestS, gameId: latestId, initialOptimalSteps } = get();
        if (latestS !== savedState || latestId !== savedGameId) return;
        if (bgSol.solvable && bgSol.moves.length > 0) {
          const len = bgSol.stats.solutionLength > 0 ? bgSol.stats.solutionLength : null;
          // Do not overwrite opening / catalog optimal after mid-game re-solves.
          set({
            solution: bgSol,
            initialOptimalSteps: initialOptimalSteps ?? len,
            currentOptimalSteps: len,
          });
        } else {
          // Do NOT copy opening optimal into currentOptimalSteps (would mislabel remaining).
          // Still attach timeout explore sample for Live Analysis viz.
          set({
            solution: bgSol.trace ? bgSol : get().solution,
            currentOptimalSteps: null,
          });
        }
      },
      () => { bgSolveCancel = null; },
    ).cancel;
  }, 500);
}

/** AI games that still need deferred full-position analysis for the education sidebar. */
export function usesDeferredSidebarSolve(plugin: GamePlugin): boolean {
  return plugin.metadata.id === 'connect-four';
}

export function maybeRescheduleBackgroundSolve(get: SolverStoreGet, set: SolverStoreSet): void {
  const { plugin, gameState, gameId, solvePlayback } = get();
  if (!plugin || !gameState || !gameId || solvePlayback) return;
  if (plugin.metadata.isFastSolver) return;
  if (plugin.ai && !usesDeferredSidebarSolve(plugin)) return;
  scheduleBackgroundSolve(get, set, gameState, gameId);
}

export function applyHintFromSolution(
  get: SolverStoreGet,
  set: SolverStoreSet,
  savedState: GameState,
  savedGameId: string,
  solution: Solution,
): void {
  const { plugin, gameState: s, gameId: gid } = get();
  if (!plugin || !s || s !== savedState || gid !== savedGameId) {
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
      solveError: isAdversarial
        ? i18n.t('game.status.noWinningMove')
        : solution.stats.terminated === 'timeout'
          ? i18n.t('game.status.timedOut')
          : null,
    });
  }
}

export type FinishSolvePatch = Partial<SolverRuntimeStore> & {
  solverStatus?: 'idle' | 'running' | 'done';
  solveError?: string | null;
};

/** Shared completion handler for toolbar Solve (sync + Worker paths). */
export function handleRequestSolveResult(
  get: SolverStoreGet,
  set: SolverStoreSet,
  savedState: GameState,
  savedGameId: string,
  solution: Solution,
  finishSolve: (partial: FinishSolvePatch) => void,
): void {
  const { plugin: p, gameState: s, gameId: gid } = get();
  if (!p || !s || s !== savedState || gid !== savedGameId) {
    return;
  }

  const isAdversarial = !!p.ai;

  if (isAdversarial) {
    const sAny = s as Record<string, unknown>;

    if (sAny.phase === 'choosing') {
      const playerStarts = getPlayerStarts(solution);
      set({
        hintHighlight: { row: 0, col: playerStarts ? 0 : 1 },
        solution,
        solverStatus: 'done',
        solvePlayback: true,
        adversarialPlayback: true,
        solveStepIndex: 0,
        prePlaybackHistoryIndex: get().historyIndex ?? 0,
      });
      scheduleTimeout(() => {
        const cur = get();
        if (!cur.plugin?.ai) {
          finishSolve(clearPlaybackStateFields());
          return;
        }
        if (cur.gameState !== savedState || cur.gameId !== savedGameId || !cur.solvePlayback) {
          finishSolve({ ...clearPlaybackStateFields(), solverStatus: 'idle' });
          return;
        }
        const playingState = {
          ...sAny,
          currentPlayer: playerStarts ? 0 : 1,
          phase: 'playing',
          playerStarts,
        };
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
        scheduleTimeout(() => solverRuntime.adversarialSolveStep(get, set), 600);
      }, 800);
      return;
    }

    if (!solution.solvable || solution.moves.length === 0) {
      finishSolve({
        solution,
        solverStatus: 'done',
        solveError: i18n.t('game.status.noWinningMove'),
      });
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
    scheduleTimeout(() => solverRuntime.adversarialSolveStep(get, set), 400);
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
}
