import type { Solution } from '@ludus/core';
import {
  applyMove,
  legalMoves,
  neighbors4,
  normalizeTerminalState,
} from './rules';
import { searchAdversary } from './adversary';
import type { AdversaryBudget, AdversaryMoveResult, AdversaryTier } from './adversary';
import type { ThiefSiegeMove, ThiefSiegeState } from './types';
import {
  findShortestEscapePath,
  getCell,
  isWalkable,
  samePos,
  shortestEscapePath,
  type EscapeSearchResult,
  type Pos,
} from './pathfinding';

export { isWalkable, shortestEscapePath };

export interface MoveChoice {
  move: ThiefSiegeMove | null;
  tier: AdversaryTier;
  nodesExplored: number;
}

export interface ThiefSiegeAiMoveAction {
  move: ThiefSiegeMove;
  delay: number;
  tier: AdversaryTier;
}

type SearchAdversaryFn = (state: ThiefSiegeState, budget: AdversaryBudget) => AdversaryMoveResult;

const FAST_ADVERSARY_BUDGET: AdversaryBudget = { timeMs: 80, maxDepth: 6, maxPlaceBranch: 10 };

export function getThiefSiegeAdversaryBudget(state: ThiefSiegeState): AdversaryBudget {
  if (state.width <= 11) return { timeMs: 800, maxDepth: Infinity, maxPlaceBranch: 14 };
  if (state.width <= 15) return { timeMs: 500, maxDepth: 10, maxPlaceBranch: 12 };
  return { timeMs: 350, maxDepth: 6, maxPlaceBranch: 10 };
}



function stepMoves(state: ThiefSiegeState): ThiefSiegeMove[] {
  return legalMoves(state).filter((move): move is Extract<ThiefSiegeMove, { type: 'step' }> => (
    move.type === 'step'
  ));
}

function placeMoves(state: ThiefSiegeState): ThiefSiegeMove[] {
  return legalMoves(state).filter((move): move is Extract<ThiefSiegeMove, { type: 'place' }> => (
    move.type === 'place'
  ));
}

function degreeAfterStep(state: ThiefSiegeState, move: ThiefSiegeMove): number {
  if (move.type !== 'step') return 0;
  const stepped = applyMove(state, move);
  return neighbors4(stepped.width, stepped.height, move.row, move.col)
    .filter(pos => isWalkable(stepped, pos.row, pos.col))
    .length;
}

export function chooseBfsThiefStep(state: ThiefSiegeState): ThiefSiegeMove | null {
  const normalized = normalizeTerminalState(state);
  if (normalized.status !== 'playing' || normalized.phase !== 'thief') return null;

  const legalSteps = stepMoves(normalized);
  const immediateExit = legalSteps.find(move => getCell(normalized, move.row, move.col) === 'exit');
  if (immediateExit) return immediateExit;

  const path = shortestEscapePath(normalized);
  if (path != null && path.length > 1) {
    const next = path[1]!;
    const pathStep = legalSteps.find(move => move.row === next.row && move.col === next.col);
    if (pathStep) return pathStep;
  }

  const reachableStep = legalSteps.find(move => shortestEscapePath(applyMove(normalized, move)) != null);
  if (reachableStep) return reachableStep;

  return [...legalSteps].sort((a, b) => degreeAfterStep(normalized, b) - degreeAfterStep(normalized, a))[0] ?? null;
}

export function chooseThiefStepChoice(
  state: ThiefSiegeState,
  budget: AdversaryBudget = FAST_ADVERSARY_BUDGET,
  runAdversary: SearchAdversaryFn = searchAdversary,
): MoveChoice {
  const normalized = normalizeTerminalState(state);
  if (normalized.status !== 'playing' || normalized.phase !== 'thief') {
    return { move: null, tier: 'bfs', nodesExplored: 0 };
  }

  if (normalized.cops.length >= normalized.maxCops && runAdversary === searchAdversary) {
    return {
      move: chooseBfsThiefStep(normalized),
      tier: 'bfs',
      nodesExplored: 0,
    };
  }

  const adversary = runAdversary(normalized, budget);
  if (adversary.move?.type === 'step') {
    return {
      move: adversary.move,
      tier: adversary.tier,
      nodesExplored: adversary.nodesExplored,
    };
  }

  return {
    move: chooseBfsThiefStep(normalized),
    tier: 'bfs',
    nodesExplored: adversary.nodesExplored,
  };
}

export function chooseThiefStep(state: ThiefSiegeState, budget?: AdversaryBudget): ThiefSiegeMove | null {
  return chooseThiefStepChoice(state, budget).move;
}

export function chooseThiefSiegeAiMove(
  state: ThiefSiegeState,
  budget: AdversaryBudget = getThiefSiegeAdversaryBudget(state),
): ThiefSiegeAiMoveAction | null {
  const normalized = normalizeTerminalState(state);
  if (normalized.status !== 'playing' || normalized.phase !== 'thief') return null;

  if (normalized.cops.length >= normalized.maxCops) {
    const fallback = chooseBfsThiefStep(normalized);
    return fallback ? { move: fallback, delay: 200, tier: 'bfs' } : null;
  }

  const result = searchAdversary(normalized, budget);
  if (result.move?.type === 'step') {
    return { move: result.move, delay: Math.max(200, result.timeMs), tier: result.tier };
  }

  const fallback = chooseBfsThiefStep(normalized);
  return fallback ? { move: fallback, delay: 200, tier: 'bfs' } : null;
}

export function suggestCopPlacement(state: ThiefSiegeState): ThiefSiegeMove | null {
  const normalized = normalizeTerminalState(state);
  if (normalized.status !== 'playing' || normalized.phase !== 'cop') return null;

  const legalPlaces = placeMoves(normalized);
  if (legalPlaces.length === 0) return null;

  const path = shortestEscapePath(normalized);
  if (path != null) {
    for (const pos of path.slice(1)) {
      const move = legalPlaces.find(candidate => samePos(candidate, pos));
      if (move) return move;
    }
  }

  return legalPlaces[0]!;
}

export function solveThiefSiege(state: ThiefSiegeState): Solution {
  const startTime = performance.now();
  const normalized = normalizeTerminalState(state);
  const search = findShortestEscapePath(normalized);
  let choice: MoveChoice;
  if (normalized.phase === 'cop' && normalized.status === 'playing') {
    const adversary = searchAdversary(normalized, FAST_ADVERSARY_BUDGET);
    choice = adversary.move?.type === 'place'
      ? { move: adversary.move, tier: adversary.tier, nodesExplored: adversary.nodesExplored }
      : { move: suggestCopPlacement(normalized), tier: 'bfs', nodesExplored: adversary.nodesExplored };
  } else {
    choice = chooseThiefStepChoice(normalized);
  }
  const move = choice.move;
  const moves = move ? [move] : [];
  const escapePath = search.path ?? [];
  const timeMs = Math.round(performance.now() - startTime);

  return {
    solvable: moves.length > 0,
    moves,
    trace: {
      type: 'escape-path',
      steps: [{
        description: search.path == null
          ? 'No escape path reachable'
          : `Shortest escape path length: ${Math.max(0, search.path.length - 1)}`,
        data: { escapePath, recommendedMove: move },
      }],
      visualizationData: { escapePath },
    },
    stats: {
      nodesExplored: search.nodesExplored + choice.nodesExplored,
      timeMs,
      solutionLength: moves.length,
      solverName: `escape-adversary/${choice.tier}`,
      terminated: search.path == null ? 'exhausted' : 'solved',
    },
  };
}
