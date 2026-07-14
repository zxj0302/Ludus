import type { Solution } from '@ludus/core';
import type { ConnectFourMove, ConnectFourState } from './types';
import { COLS, ROWS } from './types';
import { countPieces } from './board';
import { applyMove, legalMovesForPlayer, normalizeState } from './rules';

const WIN_SCORE = 1_000_000;
const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_TIME_MS = 4_500;

export interface AlphaBetaOptions {
  maxDepth?: number;
  timeMs?: number;
}

interface SearchResult {
  score: number;
  move: ConnectFourMove | null;
  nodesExplored: number;
  terminated: 'solved' | 'timeout' | 'exhausted';
  maxDepthReached: number;
}

function opponent(player: 0 | 1): 0 | 1 {
  return player === 0 ? 1 : 0;
}

function evaluateTerminal(state: ConnectFourState, rootPlayer: 0 | 1): number {
  if (state.winner === 'draw') return 0;
  if (state.winner === rootPlayer) return WIN_SCORE;
  if (state.winner === opponent(rootPlayer)) return -WIN_SCORE;
  return 0;
}

function centerPreference(column: number): number {
  const centers = [3, 2, 4, 1, 5, 0, 6];
  const idx = centers.indexOf(column);
  return (COLS - (idx >= 0 ? idx : column)) * 2;
}

/** Win immediately or block opponent's winning threat. */
export function findTacticalMove(state: ConnectFourState, player: 0 | 1): ConnectFourMove | null {
  const playState = { ...state, currentPlayer: player };
  const moves = legalMovesForPlayer(playState, player);
  for (const move of moves) {
    const next = applyMove(playState, move);
    if (next.winner === player) return move;
  }
  const opp = opponent(player);
  for (const move of moves) {
    const threat = applyMove({ ...playState, currentPlayer: opp }, move);
    if (threat.winner === opp) return move;
  }
  return null;
}

function alphaBeta(
  state: ConnectFourState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: 0 | 1,
  rootPlayer: 0 | 1,
  deadline: number,
  stats: { nodes: number; depthFromRoot: number },
): number {
  stats.nodes += 1;
  stats.depthFromRoot = Math.max(stats.depthFromRoot, depth);

  if (performance.now() >= deadline) return evaluateTerminal(state, rootPlayer);
  if (state.winner !== null) return evaluateTerminal(state, rootPlayer);
  if (depth === 0) return centerPreference(state.lastColumn ?? 3);

  const player = maximizingPlayer;
  const moves = legalMovesForPlayer({ ...state, currentPlayer: player }, player);
  if (moves.length === 0) return evaluateTerminal(state, rootPlayer);

  moves.sort((a, b) => centerPreference(b.column) - centerPreference(a.column));

  if (maximizingPlayer === rootPlayer) {
    let value = -Infinity;
    for (const move of moves) {
      const child = applyMove({ ...state, currentPlayer: player }, move);
      value = Math.max(
        value,
        alphaBeta(child, depth - 1, alpha, beta, opponent(player), rootPlayer, deadline, stats),
      );
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  let value = Infinity;
  for (const move of moves) {
    const child = applyMove({ ...state, currentPlayer: player }, move);
    value = Math.min(
      value,
      alphaBeta(child, depth - 1, alpha, beta, opponent(player), rootPlayer, deadline, stats),
    );
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
}

function searchBestMove(
  state: ConnectFourState,
  player: 0 | 1,
  options: AlphaBetaOptions = {},
): SearchResult {
  const normalized = normalizeState(state);
  const playState = { ...normalized, currentPlayer: player };
  const tactical = findTacticalMove(playState, player);
  if (tactical) {
    return {
      score: WIN_SCORE,
      move: tactical,
      nodesExplored: 1,
      terminated: 'solved',
      maxDepthReached: 1,
    };
  }

  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const timeMs = options.timeMs ?? DEFAULT_TIME_MS;
  const deadline = performance.now() + timeMs;
  const stats = { nodes: 0, depthFromRoot: 0 };

  const moves = legalMovesForPlayer(playState, player);
  if (moves.length === 0) {
    return { score: 0, move: null, nodesExplored: 0, terminated: 'exhausted', maxDepthReached: 0 };
  }

  moves.sort((a, b) => centerPreference(b.column) - centerPreference(a.column));

  let bestMove = moves[0]!;
  let bestScore = -Infinity;
  let timedOut = false;

  for (const move of moves) {
    if (performance.now() >= deadline) {
      timedOut = true;
      break;
    }
    const child = applyMove({ ...playState }, move);
    const score = alphaBeta(
      child,
      maxDepth - 1,
      -Infinity,
      Infinity,
      opponent(player),
      player,
      deadline,
      stats,
    );
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return {
    score: bestScore,
    move: bestMove,
    nodesExplored: stats.nodes,
    terminated: timedOut ? 'timeout' : 'solved',
    maxDepthReached: stats.depthFromRoot,
  };
}

export function findBestMove(
  state: ConnectFourState,
  player: 0 | 1,
  options?: AlphaBetaOptions,
): ConnectFourMove | null {
  return searchBestMove(state, player, options).move;
}

function recommendPlayerStarts(state: ConnectFourState, options?: AlphaBetaOptions): boolean {
  const shallow = { maxDepth: 4, timeMs: 600, ...options };
  const asFirst = searchBestMove(
    { ...state, phase: 'playing', currentPlayer: 0, winner: null },
    0,
    shallow,
  ).score;
  const asSecond = searchBestMove(
    { ...state, phase: 'playing', currentPlayer: 1, winner: null },
    1,
    shallow,
  ).score;
  return asFirst >= asSecond;
}

export function solveConnectFour(state: ConnectFourState, options?: AlphaBetaOptions): Solution {
  const startedAt = performance.now();
  const normalized = normalizeState(state);

  let playerStarts: boolean;
  if (normalized.playerStarts !== undefined) {
    playerStarts = normalized.playerStarts;
  } else if (normalized.phase === 'choosing') {
    playerStarts = countPieces(normalized.board) === 0
      ? recommendPlayerStarts(normalized, options)
      : normalized.currentPlayer === 0;
  } else {
    const pieces = countPieces(normalized.board);
    playerStarts = (pieces % 2 === 0) === (normalized.currentPlayer === 0);
  }

  const moves: ConnectFourMove[] = [];
  const traceSteps: { description: string; data: unknown }[] = [];
  let sim: ConnectFourState = normalized.phase === 'choosing'
    ? {
      ...normalized,
      phase: 'playing',
      currentPlayer: playerStarts ? 0 : 1,
      playerStarts,
    }
    : normalized;
  let totalNodes = 0;
  let terminated: 'solved' | 'timeout' | 'exhausted' = 'solved';
  let maxDepthReached = 0;

  while (sim.winner === null) {
    const actor = sim.currentPlayer;
    const result = searchBestMove(sim, actor, options);
    totalNodes += result.nodesExplored;
    maxDepthReached = Math.max(maxDepthReached, result.maxDepthReached);
    if (result.terminated === 'timeout') terminated = 'timeout';

    if (!result.move) break;
    moves.push(result.move);
    traceSteps.push({
      description: `${actor === 0 ? 'Player' : 'AI'} column ${result.move.column + 1}`,
      data: { column: result.move.column, player: actor, score: result.score },
    });
    sim = applyMove(sim, result.move);
    if (moves.length > ROWS * COLS) break;
  }

  const playerMoves = moves.filter((_, i) => (playerStarts ? i % 2 === 0 : i % 2 === 1)).length;
  const timeMs = Math.round(performance.now() - startedAt);

  return {
    solvable: moves.length > 0 || normalized.phase === 'choosing',
    moves,
    trace: {
      type: 'minimax-tree',
      steps: traceSteps,
      visualizationData: { playerStarts, nodesExplored: totalNodes, maxDepth: maxDepthReached },
    },
    stats: {
      nodesExplored: totalNodes,
      timeMs,
      solutionLength: playerMoves,
      solverName: 'Alpha-Beta (depth-limited)',
      terminated,
    },
  };
}
