import type { Solution, SolutionStats, SolverTrace, TraceStep } from '@ludus/core';
import { D4_PERMUTATIONS } from './geometry';
import { applyMove, hasPeg, legalMoves, meetsGoal, popcount } from './rules';
import type { PegSolitaireMove, PegSolitaireState } from './types';

const DEFAULT_TIME_MS = 5000;
const SHORTEST_POPCOUNT_THRESHOLD = 10;

interface SearchNode {
  state: PegSolitaireState;
  moves: PegSolitaireMove[];
  depth: number;
}

type Termination = 'solved' | 'timeout' | 'exhausted';

function now(): number {
  return performance.now();
}

function transformPegs(pegs: number, permutation: ReadonlyArray<number>): number {
  let transformed = 0;

  for (let hole = 0; hole < permutation.length; hole += 1) {
    if (hasPeg(pegs, hole)) {
      transformed += 2 ** permutation[hole]!;
    }
  }

  return transformed;
}

export function canonicalKey(pegs: number): number {
  let best = Number.POSITIVE_INFINITY;

  for (const permutation of D4_PERMUTATIONS) {
    best = Math.min(best, transformPegs(pegs, permutation));
  }

  return best;
}

export function solvePegSolitaire(
  state: PegSolitaireState,
  options: { timeMs?: number; findShortest?: boolean } = {},
): Solution {
  const startedAt = now();
  const timeBudget = options.timeMs ?? DEFAULT_TIME_MS;
  const useShortest = options.findShortest === true || popcount(state.pegs) <= SHORTEST_POPCOUNT_THRESHOLD;

  if (meetsGoal(state.pegs, state.goal)) {
    return buildSolution(true, [], [], 0, startedAt, 'solved', useShortest, 0);
  }

  return useShortest
    ? searchBreadthFirst(state, timeBudget, startedAt)
    : searchDepthFirst(state, timeBudget, startedAt);
}

function searchBreadthFirst(state: PegSolitaireState, timeBudget: number, startedAt: number): Solution {
  const visited = new Set<number>([canonicalKey(state.pegs)]);
  const queue: SearchNode[] = [{ state, moves: [], depth: 0 }];
  const traceSteps: TraceStep[] = [buildTraceStep(0, 0, 1)];
  let head = 0;
  let nodesExplored = 0;
  let maxDepth = 0;

  while (head < queue.length) {
    if (now() - startedAt > timeBudget) {
      return buildSolution(false, [], traceSteps, nodesExplored, startedAt, 'timeout', true, maxDepth);
    }

    const current = queue[head++]!;
    nodesExplored += 1;
    maxDepth = Math.max(maxDepth, current.depth);

    for (const move of legalMoves(current.state)) {
      const nextState = applyMove(current.state, move);
      const key = canonicalKey(nextState.pegs);
      if (visited.has(key)) continue;
      visited.add(key);

      const nextMoves = [...current.moves, move];
      if (meetsGoal(nextState.pegs, nextState.goal)) {
        return buildSolution(true, nextMoves, traceSteps, nodesExplored, startedAt, 'solved', true, current.depth + 1);
      }

      queue.push({ state: nextState, moves: nextMoves, depth: current.depth + 1 });
      if (current.depth + 1 > maxDepth) {
        maxDepth = current.depth + 1;
        traceSteps.push(buildTraceStep(maxDepth, nodesExplored, queue.length - head));
      }
    }
  }

  return buildSolution(false, [], traceSteps, nodesExplored, startedAt, 'exhausted', true, maxDepth);
}

function searchDepthFirst(state: PegSolitaireState, timeBudget: number, startedAt: number): Solution {
  const visited = new Set<number>([canonicalKey(state.pegs)]);
  const stack: SearchNode[] = [{ state, moves: [], depth: 0 }];
  const traceSteps: TraceStep[] = [buildTraceStep(0, 0, 1)];
  let nodesExplored = 0;
  let maxDepth = 0;

  while (stack.length > 0) {
    if (now() - startedAt > timeBudget) {
      return buildSolution(false, [], traceSteps, nodesExplored, startedAt, 'timeout', false, maxDepth);
    }

    const current = stack.pop()!;
    nodesExplored += 1;
    maxDepth = Math.max(maxDepth, current.depth);

    for (const move of legalMoves(current.state)) {
      const nextState = applyMove(current.state, move);
      const key = canonicalKey(nextState.pegs);
      if (visited.has(key)) continue;
      visited.add(key);

      const nextMoves = [...current.moves, move];
      if (meetsGoal(nextState.pegs, nextState.goal)) {
        return buildSolution(true, nextMoves, traceSteps, nodesExplored, startedAt, 'solved', false, current.depth + 1);
      }

      stack.push({ state: nextState, moves: nextMoves, depth: current.depth + 1 });
      if (current.depth + 1 > maxDepth) {
        maxDepth = current.depth + 1;
        traceSteps.push(buildTraceStep(maxDepth, nodesExplored, stack.length));
      }
    }
  }

  return buildSolution(false, [], traceSteps, nodesExplored, startedAt, 'exhausted', false, maxDepth);
}

function buildTraceStep(depth: number, nodesExplored: number, frontier: number): TraceStep {
  return {
    description: `Depth ${depth}: explored ${nodesExplored} nodes, frontier ${frontier}`,
    data: { depth, nodesExplored, frontier },
  };
}

function buildSolution(
  solvable: boolean,
  moves: PegSolitaireMove[],
  traceSteps: TraceStep[],
  nodesExplored: number,
  startedAt: number,
  terminated: Termination,
  shortest: boolean,
  maxDepth: number,
): Solution {
  return {
    solvable,
    moves,
    trace: buildTrace(traceSteps, nodesExplored, moves, startedAt, terminated, shortest, maxDepth),
    stats: buildStats(nodesExplored, moves.length, startedAt, terminated, shortest),
  };
}

function buildTrace(
  steps: TraceStep[],
  nodesExplored: number,
  moves: PegSolitaireMove[],
  startedAt: number,
  terminated: Termination,
  shortest: boolean,
  maxDepth: number,
): SolverTrace {
  const timeMs = Math.round(now() - startedAt);
  return {
    type: 'search-tree',
    steps,
    visualizationData: {
      nodesExplored,
      timeMs,
      solutionLength: moves.length,
      path: moves,
      maxDepth,
      terminated,
      symmetry: 'D4',
      search: shortest ? 'bfs' : 'dfs',
    },
  };
}

function buildStats(
  nodesExplored: number,
  solutionLength: number,
  startedAt: number,
  terminated: Termination,
  shortest: boolean,
): SolutionStats {
  return {
    nodesExplored,
    timeMs: Math.round(now() - startedAt),
    solutionLength,
    solverName: shortest ? 'peg-bfs+D4' : 'peg-dfs+D4',
    terminated,
  };
}
