import {
  applyMove,
  legalMoves,
  neighbors4,
  normalizeTerminalState,
} from './rules';
import type { ThiefSiegeMove, ThiefSiegeState } from './types';
import {
  isWalkable,
  posKey,
  samePos,
  shortestEscapePath,
  type Pos,
} from './pathfinding';

export type AdversaryTier = 'perfect' | 'bounded' | 'bfs';

export interface AdversaryBudget {
  timeMs: number;
  maxDepth: number;
  maxPlaceBranch?: number;
}

export interface AdversaryMoveResult {
  move: ThiefSiegeMove | null;
  tier: AdversaryTier;
  score: number;
  nodesExplored: number;
  timeMs: number;
  copWinning?: boolean;
}

type Winner = 'cop' | 'thief';

interface SearchContext {
  deadline: number;
  nodesExplored: number;
  cutOff: boolean;
  maxPlaceBranch?: number;
}

interface SearchOutcome {
  score: number;
  winner?: Winner;
}

const THIEF_WIN_SCORE = 10_000;
const COP_WIN_SCORE = -10_000;
const NO_ESCAPE_SCORE = -5_000;

function nowMs(): number {
  return performance.now();
}

function stateKey(state: ThiefSiegeState): string {
  const cops = state.cops.map(posKey).join('|');
  return [
    state.phase,
    state.status,
    posKey(state.thief),
    cops,
  ].join(';');
}

function cellAt(state: ThiefSiegeState, row: number, col: number) {
  if (row < 0 || row >= state.height || col < 0 || col >= state.width) return undefined;
  return state.cells[row * state.width + col];
}

function reachableExitCount(state: ThiefSiegeState): number {
  const queue: Pos[] = [state.thief];
  let head = 0;
  const seen = new Set<string>([posKey(state.thief)]);
  const exits = new Set<string>();

  while (head < queue.length) {
    const current = queue[head++]!;
    if (cellAt(state, current.row, current.col) === 'exit') {
      exits.add(posKey(current));
    }

    const nextPositions = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ];

    for (const next of nextPositions) {
      const key = posKey(next);
      if (seen.has(key)) continue;
      if (!isWalkable(state, next.row, next.col)) continue;
      seen.add(key);
      queue.push(next);
    }
  }

  return exits.size;
}

export function evaluateState(state: ThiefSiegeState): number {
  const normalized = normalizeTerminalState(state);
  if (normalized.status === 'thief-win') return THIEF_WIN_SCORE;
  if (normalized.status === 'cop-win') return COP_WIN_SCORE;

  const path = shortestEscapePath(normalized);
  if (path == null) return NO_ESCAPE_SCORE;

  const pathSteps = Math.max(1, path.length - 1);
  const exitsReachable = reachableExitCount(normalized);
  const copsLeft = Math.max(0, normalized.maxCops - normalized.cops.length);
  return (1000 / pathSteps) + (exitsReachable * 50) - (copsLeft * 10);
}

function orderMoves(state: ThiefSiegeState, moves: ThiefSiegeMove[], maxPlaceBranch?: number): ThiefSiegeMove[] {
  const path = shortestEscapePath(state) ?? [];
  if (state.phase !== 'cop') {
    if (path.length <= 1) return moves;
    const nextStep = path[1]!;
    return [...moves].sort((a, b) => {
      const aOnPath = samePos(a, nextStep) ? 0 : 1;
      const bOnPath = samePos(b, nextStep) ? 0 : 1;
      return aOnPath - bOnPath;
    });
  }

  const pathRank = new Map<string, number>();
  const pathSteps = path.slice(1);
  if (pathSteps.length > 0) {
    pathRank.set(posKey(pathSteps[pathSteps.length - 1]!), 0);
    pathSteps.forEach((pos, index) => {
      const key = posKey(pos);
      if (!pathRank.has(key)) pathRank.set(key, index + 1);
    });
  }

  const ordered = [...moves].sort((a, b) => {
    const rankA = pathRank.get(posKey(a)) ?? Number.POSITIVE_INFINITY;
    const rankB = pathRank.get(posKey(b)) ?? Number.POSITIVE_INFINITY;
    if (rankA !== rankB) return rankA - rankB;
    return Math.abs(a.row - state.thief.row) + Math.abs(a.col - state.thief.col)
      - (Math.abs(b.row - state.thief.row) + Math.abs(b.col - state.thief.col));
  });

  return maxPlaceBranch == null ? ordered : ordered.slice(0, maxPlaceBranch);
}

function search(
  state: ThiefSiegeState,
  depthLeft: number,
  alpha: number,
  beta: number,
  ctx: SearchContext,
  seen: Set<string>,
): SearchOutcome {
  ctx.nodesExplored += 1;

  const normalized = normalizeTerminalState(state);
  if (normalized.status === 'thief-win') return { score: THIEF_WIN_SCORE, winner: 'thief' };
  if (normalized.status === 'cop-win') return { score: COP_WIN_SCORE, winner: 'cop' };

  if (nowMs() >= ctx.deadline || depthLeft <= 0) {
    ctx.cutOff = true;
    return { score: evaluateState(normalized) };
  }

  const key = stateKey(normalized);
  if (seen.has(key)) {
    ctx.cutOff = true;
    return { score: evaluateState(normalized) };
  }

  const nextSeen = new Set(seen);
  nextSeen.add(key);

  const moves = orderMoves(normalized, legalMoves(normalized), ctx.maxPlaceBranch);
  if (moves.length === 0) return { score: evaluateState(normalized) };

  if (normalized.phase === 'thief') {
    let best: SearchOutcome = { score: Number.NEGATIVE_INFINITY };
    let allCopWins = true;
    let localAlpha = alpha;

    for (const move of moves) {
      const child = search(applyMove(normalized, move), depthLeft - 1, localAlpha, beta, ctx, nextSeen);
      if (child.score > best.score) best = child;
      if (child.winner !== 'cop') allCopWins = false;
      if (child.winner === 'thief') return { score: best.score, winner: 'thief' };
      localAlpha = Math.max(localAlpha, best.score);
      if (localAlpha >= beta) break;
    }

    return allCopWins ? { score: best.score, winner: 'cop' } : best;
  }

  let best: SearchOutcome = { score: Number.POSITIVE_INFINITY };
  let allThiefWins = true;
  let localBeta = beta;

  for (const move of moves) {
    const child = search(applyMove(normalized, move), depthLeft - 1, alpha, localBeta, ctx, nextSeen);
    if (child.score < best.score) best = child;
    if (child.winner !== 'thief') allThiefWins = false;
    if (child.winner === 'cop') return { score: best.score, winner: 'cop' };
    localBeta = Math.min(localBeta, best.score);
    if (alpha >= localBeta) break;
  }

  return allThiefWins ? { score: best.score, winner: 'thief' } : best;
}

export function searchAdversary(
  state: ThiefSiegeState,
  budget: AdversaryBudget,
): AdversaryMoveResult {
  const start = nowMs();
  const ctx: SearchContext = {
    deadline: start + Math.max(0, budget.timeMs),
    nodesExplored: 0,
    cutOff: false,
    maxPlaceBranch: budget.maxPlaceBranch,
  };
  const normalized = normalizeTerminalState(state);

  if (normalized.status !== 'playing') {
    const winner = normalized.status === 'cop-win' ? 'cop' : 'thief';
    return {
      move: null,
      tier: 'perfect',
      score: evaluateState(normalized),
      nodesExplored: 0,
      timeMs: Math.round(nowMs() - start),
      copWinning: winner === 'cop',
    };
  }

  const moves = orderMoves(normalized, legalMoves(normalized), budget.maxPlaceBranch);
  const maximizingThief = normalized.phase === 'thief';
  let bestMove: ThiefSiegeMove | null = null;
  let bestOutcome: SearchOutcome = {
    score: maximizingThief ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  };
  let allOpponentWins = true;
  let alpha = Number.NEGATIVE_INFINITY;
  let beta = Number.POSITIVE_INFINITY;

  for (const move of moves) {
    const child = search(
      applyMove(normalized, move),
      budget.maxDepth - 1,
      alpha,
      beta,
      ctx,
      new Set([stateKey(normalized)]),
    );
    const better = maximizingThief
      ? child.score > bestOutcome.score
      : child.score < bestOutcome.score;
    if (better || bestMove == null) {
      bestMove = move;
      bestOutcome = child;
    }

    if (maximizingThief) {
      if (child.winner !== 'cop') allOpponentWins = false;
      if (child.winner === 'thief') {
        bestOutcome = child;
        bestMove = move;
        break;
      }
      alpha = Math.max(alpha, bestOutcome.score);
    } else {
      if (child.winner !== 'thief') allOpponentWins = false;
      if (child.winner === 'cop') {
        bestOutcome = child;
        bestMove = move;
        break;
      }
      beta = Math.min(beta, bestOutcome.score);
    }

    if (alpha >= beta) break;
  }

  const rootWinner = bestOutcome.winner
    ?? (allOpponentWins ? (maximizingThief ? 'cop' : 'thief') : undefined);
  const tier: AdversaryTier = ctx.cutOff ? 'bounded' : 'perfect';

  return {
    move: bestMove,
    tier,
    score: bestOutcome.score,
    nodesExplored: ctx.nodesExplored,
    timeMs: Math.round(nowMs() - start),
    copWinning: rootWinner == null ? undefined : rootWinner === 'cop',
  };
}

export function copHasWinningStrategy(state: ThiefSiegeState, budget: AdversaryBudget): boolean {
  return searchAdversary(state, budget).copWinning === true;
}
