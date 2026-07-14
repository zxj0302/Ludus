import type { Solution, SolutionStats, SolverTrace, TraceStep } from '@ludus/core';
import { D4_PERMUTATIONS, holeNotation } from './geometry';
import { applyMove, hasPeg, legalMoves, meetsGoal, popcount } from './rules';
import type { PegSolitaireMove, PegSolitaireState } from './types';

const DEFAULT_TIME_MS = 5000;
const SHORTEST_POPCOUNT_THRESHOLD = 10;
/** Cap recorded tree sample so React Flow stays readable. */
const MAX_TREE_NODES = 36;
const MAX_BRANCH_PER_NODE = 3;

export interface PegTreeNode {
  id: string;
  parentId: string | null;
  depth: number;
  onPath: boolean;
  /** Move label into this node, or null for root */
  moveLabel: string | null;
}

interface SearchNode {
  state: PegSolitaireState;
  moves: PegSolitaireMove[];
  depth: number;
  nodeId: string;
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

function moveLabel(move: PegSolitaireMove): string {
  return `${holeNotation(move.from)}→${holeNotation(move.to)}`;
}

function sameMove(a: PegSolitaireMove, b: PegSolitaireMove): boolean {
  return a.from === b.from && a.over === b.over && a.to === b.to;
}

/**
 * Build a readable search-tree *sample* for React Flow:
 * principal variation (amber) + up to MAX_BRANCH_PER_NODE sibling tips per depth (grey).
 * Not the full state space — peg solitaire is too large; this is honest progressive disclosure.
 */
export function sampleSolutionTree(
  start: PegSolitaireState,
  moves: PegSolitaireMove[],
): PegTreeNode[] {
  const nodes: PegTreeNode[] = [];
  let nextId = 0;
  const rootId = `n${nextId++}`;
  nodes.push({
    id: rootId,
    parentId: null,
    depth: 0,
    onPath: true,
    moveLabel: null,
  });

  let state = start;
  let parentId = rootId;

  for (let depth = 0; depth < moves.length; depth += 1) {
    const pathMove = moves[depth]!;
    let branches = 0;

    for (const alt of legalMoves(state)) {
      if (sameMove(alt, pathMove)) continue;
      if (branches >= MAX_BRANCH_PER_NODE) break;
      if (nodes.length >= MAX_TREE_NODES) break;
      nodes.push({
        id: `n${nextId++}`,
        parentId,
        depth: depth + 1,
        onPath: false,
        moveLabel: moveLabel(alt),
      });
      branches += 1;
    }

    if (nodes.length >= MAX_TREE_NODES) break;

    const childId = `n${nextId++}`;
    nodes.push({
      id: childId,
      parentId,
      depth: depth + 1,
      onPath: true,
      moveLabel: moveLabel(pathMove),
    });
    state = applyMove(state, pathMove);
    parentId = childId;
  }

  return nodes;
}

/** Exploratory sample when search ends without a solution (timeout / exhausted). */
function createExploreRecorder() {
  const nodes: PegTreeNode[] = [{
    id: 'n0',
    parentId: null,
    depth: 0,
    onPath: false,
    moveLabel: null,
  }];
  let nextId = 1;
  const branchCount = new Map<string, number>([['n0', 0]]);

  function tryAdd(parentId: string, depth: number, move: PegSolitaireMove): string | null {
    if (nodes.length >= MAX_TREE_NODES) return null;
    const used = branchCount.get(parentId) ?? 0;
    if (used >= MAX_BRANCH_PER_NODE) return null;
    const id = `n${nextId++}`;
    branchCount.set(parentId, used + 1);
    branchCount.set(id, 0);
    nodes.push({
      id,
      parentId,
      depth,
      onPath: false,
      moveLabel: moveLabel(move),
    });
    return id;
  }

  return { nodes, tryAdd, rootId: 'n0' };
}

export function solvePegSolitaire(
  state: PegSolitaireState,
  options: { timeMs?: number; findShortest?: boolean } = {},
): Solution {
  const startedAt = now();
  // Allow hint/solve after a mistaken "stuck" status if moves still exist under playing.
  const searchState: PegSolitaireState =
    state.status === 'stuck'
      ? { ...state, status: 'playing' }
      : state;
  const pegsLeft = popcount(searchState.pegs);
  const timeBudget = options.timeMs
    ?? (pegsLeft <= 16 ? 8_000 : DEFAULT_TIME_MS);
  const useShortest = options.findShortest === true || pegsLeft <= SHORTEST_POPCOUNT_THRESHOLD;

  if (meetsGoal(searchState.pegs, searchState.goal)) {
    return buildSolution(true, [], [], 0, startedAt, 'solved', useShortest, 0, []);
  }

  return useShortest
    ? searchBreadthFirst(searchState, timeBudget, startedAt)
    : searchDepthFirst(searchState, timeBudget, startedAt);
}

function searchBreadthFirst(state: PegSolitaireState, timeBudget: number, startedAt: number): Solution {
  const rootKey = canonicalKey(state.pegs);
  const explore = createExploreRecorder();
  const visited = new Set<number>([rootKey]);
  const queue: SearchNode[] = [{ state, moves: [], depth: 0, nodeId: explore.rootId }];
  const traceSteps: TraceStep[] = [buildTraceStep(0, 0, 1)];
  let head = 0;
  let nodesExplored = 0;
  let maxDepth = 0;

  while (head < queue.length) {
    if (now() - startedAt > timeBudget) {
      return buildSolution(false, [], traceSteps, nodesExplored, startedAt, 'timeout', true, maxDepth, explore.nodes);
    }

    const current = queue[head++]!;
    nodesExplored += 1;
    maxDepth = Math.max(maxDepth, current.depth);

    for (const move of legalMoves(current.state)) {
      const nextState = applyMove(current.state, move);
      const key = canonicalKey(nextState.pegs);
      if (visited.has(key)) continue;
      visited.add(key);
      const childId = explore.tryAdd(current.nodeId, current.depth + 1, move) ?? current.nodeId;

      const nextMoves = [...current.moves, move];
      if (meetsGoal(nextState.pegs, nextState.goal)) {
        return buildSolution(
          true,
          nextMoves,
          traceSteps,
          nodesExplored,
          startedAt,
          'solved',
          true,
          current.depth + 1,
          sampleSolutionTree(state, nextMoves),
        );
      }

      queue.push({ state: nextState, moves: nextMoves, depth: current.depth + 1, nodeId: childId });
      if (current.depth + 1 > maxDepth) {
        maxDepth = current.depth + 1;
        traceSteps.push(buildTraceStep(maxDepth, nodesExplored, queue.length - head));
      }
    }
  }

  return buildSolution(false, [], traceSteps, nodesExplored, startedAt, 'exhausted', true, maxDepth, explore.nodes);
}

function searchDepthFirst(state: PegSolitaireState, timeBudget: number, startedAt: number): Solution {
  const rootKey = canonicalKey(state.pegs);
  const explore = createExploreRecorder();
  const visited = new Set<number>([rootKey]);
  const stack: SearchNode[] = [{ state, moves: [], depth: 0, nodeId: explore.rootId }];
  const traceSteps: TraceStep[] = [buildTraceStep(0, 0, 1)];
  let nodesExplored = 0;
  let maxDepth = 0;

  while (stack.length > 0) {
    if (now() - startedAt > timeBudget) {
      return buildSolution(false, [], traceSteps, nodesExplored, startedAt, 'timeout', false, maxDepth, explore.nodes);
    }

    const current = stack.pop()!;
    nodesExplored += 1;
    maxDepth = Math.max(maxDepth, current.depth);

    for (const move of legalMoves(current.state)) {
      const nextState = applyMove(current.state, move);
      const key = canonicalKey(nextState.pegs);
      if (visited.has(key)) continue;
      visited.add(key);
      const childId = explore.tryAdd(current.nodeId, current.depth + 1, move) ?? current.nodeId;

      const nextMoves = [...current.moves, move];
      if (meetsGoal(nextState.pegs, nextState.goal)) {
        return buildSolution(
          true,
          nextMoves,
          traceSteps,
          nodesExplored,
          startedAt,
          'solved',
          false,
          current.depth + 1,
          sampleSolutionTree(state, nextMoves),
        );
      }

      stack.push({ state: nextState, moves: nextMoves, depth: current.depth + 1, nodeId: childId });
      if (current.depth + 1 > maxDepth) {
        maxDepth = current.depth + 1;
        traceSteps.push(buildTraceStep(maxDepth, nodesExplored, stack.length));
      }
    }
  }

  return buildSolution(false, [], traceSteps, nodesExplored, startedAt, 'exhausted', false, maxDepth, explore.nodes);
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
  treeNodes: PegTreeNode[],
): Solution {
  return {
    solvable,
    moves,
    trace: buildTrace(traceSteps, nodesExplored, moves, startedAt, terminated, shortest, maxDepth, treeNodes),
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
  treeNodes: PegTreeNode[],
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
      treeNodes,
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
