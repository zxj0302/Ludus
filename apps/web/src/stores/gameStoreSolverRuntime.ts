import type { GamePlugin, GameState, Move, Solution, WorkerRequest, WorkerResponse } from '@ludus/core';
import i18n from '../i18n';
import { getPlayerStarts } from '../utils/solution';
import { scheduleTimeout, clearAllPlaybackTimers } from '../utils/playbackController';
import SolverWorker from '../workers/solver.worker?worker';

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
  solution: Solution | null;
  initialOptimalSteps: number | null;
  currentOptimalSteps: number | null;
  applyMove: (move: Move) => void;
}

export type SolverStoreGet = () => SolverRuntimeStore;
export type SolverStoreSet = (partial: Partial<SolverRuntimeStore> & Record<string, unknown>) => void;
type AiMoveAction = { move: Move; delay: number; tier?: string };

let aiTimerId: ReturnType<typeof setTimeout> | null = null;
let bgSolverTimerId: ReturnType<typeof setTimeout> | null = null;
let bgWorkerReqId = 0;
let solveInFlight = false;
let bgSolveCancel: (() => void) | null = null;

export function isSolveInFlight(): boolean {
  return solveInFlight;
}

export function setSolveInFlight(value: boolean): void {
  solveInFlight = value;
}

export function usesWebWorker(plugin: GamePlugin): boolean {
  const web = plugin.metadata.platformSupport.find(p => p.platform === 'web');
  return web?.capabilities.webWorker === true;
}

export function clearPlaybackStateFields(): Partial<PlaybackStateFields> {
  return {
    solvePlayback: false,
    adversarialPlayback: false,
    solveStepIndex: 0,
    prePlaybackHistoryIndex: 0,
  };
}

export function clearSolverRuntimeTimers(): void {
  if (aiTimerId) { clearTimeout(aiTimerId); aiTimerId = null; }
  if (bgSolverTimerId) { clearTimeout(bgSolverTimerId); bgSolverTimerId = null; }
  if (bgSolveCancel) { bgSolveCancel(); bgSolveCancel = null; }
  clearAllPlaybackTimers();
  solveInFlight = false;
}

export function scheduleAI(get: SolverStoreGet): void {
  if (aiTimerId) clearTimeout(aiTimerId);
  const s = get();
  const asyncPath = !!s.plugin?.ai?.getAIMoveAsync;
  const initialDelay = asyncPath ? 0 : 600;

  aiTimerId = setTimeout(async () => {
    aiTimerId = null;
    const current = get();
    if (!current.plugin?.ai || !current.gameState || current.solvePlayback) return;
    if (!current.plugin.ai.isAITurn(current.gameState)) return;

    const requestedAi = current.plugin.ai;
    const requestedState = current.gameState;
    let action: AiMoveAction | null = null;

    if (requestedAi.getAIMoveAsync) {
      action = await requestedAi.getAIMoveAsync(requestedState);
    } else {
      action = requestedAi.getAIMove(requestedState);
    }

    if (!action) return;
    if (asyncPath) {
      await new Promise(resolve => setTimeout(resolve, Math.min(Math.max(0, action.delay ?? 0), 400)));
    }

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
    const endSol = plugin.solve(gameState);
    set({ ...clearPlaybackStateFields(), solution: endSol });
    return;
  }

  if (plugin.ai.isAITurn(gameState)) {
    scheduleTimeout(() => {
      const s = get();
      if (!s.plugin?.ai || !s.gameState || !s.adversarialPlayback) return;
      const aiAction = s.plugin.ai.getAIMove(s.gameState);
      if (!aiAction) {
        set(clearPlaybackStateFields());
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
    set(clearPlaybackStateFields());
  }
}

export function runSolverOffThread(
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

    worker.postMessage({
      id: reqId,
      type: 'solve',
      payload: { gameId: plugin.metadata.id, state: state as Record<string, unknown> },
    } satisfies WorkerRequest);
    return { cancel: () => { if (!done) { done = true; worker.terminate(); } } };
  }

  const timerId = setTimeout(() => {
    onResult(plugin.solve(state));
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

    bgSolveCancel = runSolverOffThread(
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

export function maybeRescheduleBackgroundSolve(get: SolverStoreGet, set: SolverStoreSet): void {
  const { plugin, gameState, gameId, solvePlayback } = get();
  if (!plugin || !gameState || !gameId || solvePlayback) return;
  if (plugin.metadata.isFastSolver || plugin.ai) return;
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
      solveError: isAdversarial
        ? i18n.t('game.status.noWinningMove')
        : solution.stats.terminated === 'timeout'
          ? i18n.t('game.status.timedOut')
          : null,
    });
  }
}
