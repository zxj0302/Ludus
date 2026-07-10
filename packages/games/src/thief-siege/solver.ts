import type { Solution } from '@ludus/core';
import {
  applyMove,
  cellIndex,
  inBounds,
  legalMoves,
  neighbors4,
  normalizeTerminalState,
} from './rules';
import type { ThiefSiegeMove, ThiefSiegeState } from './types';

type Pos = { row: number; col: number };

interface EscapeSearchResult {
  path: Pos[] | null;
  nodesExplored: number;
}

function samePos(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col;
}

function posKey(pos: Pos): string {
  return `${pos.row},${pos.col}`;
}

function isCopAt(state: ThiefSiegeState, row: number, col: number): boolean {
  return state.cops.some(cop => cop.row === row && cop.col === col);
}

function getCell(state: ThiefSiegeState, row: number, col: number) {
  if (!inBounds(state.width, state.height, row, col)) return undefined;
  return state.cells[cellIndex(state.width, row, col)];
}

export function isWalkable(state: ThiefSiegeState, row: number, col: number): boolean {
  const cell = getCell(state, row, col);
  if (cell !== 'floor' && cell !== 'exit') return false;
  return !isCopAt(state, row, col);
}

function reconstructPath(cameFrom: Map<string, string | null>, end: Pos): Pos[] {
  const path: Pos[] = [];
  let cursor: string | null = posKey(end);

  while (cursor != null) {
    const [row, col] = cursor.split(',').map(Number) as [number, number];
    path.push({ row, col });
    cursor = cameFrom.get(cursor) ?? null;
  }

  return path.reverse();
}

function findShortestEscapePath(state: ThiefSiegeState): EscapeSearchResult {
  const start = state.thief;
  if (!isWalkable(state, start.row, start.col)) {
    return { path: null, nodesExplored: 0 };
  }

  const queue: Pos[] = [start];
  let head = 0;
  let nodesExplored = 0;
  const cameFrom = new Map<string, string | null>([[posKey(start), null]]);

  while (head < queue.length) {
    const current = queue[head++]!;
    nodesExplored += 1;
    const currentCell = getCell(state, current.row, current.col);
    if (currentCell === 'exit') {
      return { path: reconstructPath(cameFrom, current), nodesExplored };
    }

    for (const next of neighbors4(state.width, state.height, current.row, current.col)) {
      if (!isWalkable(state, next.row, next.col)) continue;
      const key = posKey(next);
      if (cameFrom.has(key)) continue;
      cameFrom.set(key, posKey(current));
      queue.push(next);
    }
  }

  return { path: null, nodesExplored };
}

export function shortestEscapePath(state: ThiefSiegeState): Pos[] | null {
  return findShortestEscapePath(state).path;
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

export function chooseThiefStep(state: ThiefSiegeState): ThiefSiegeMove | null {
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
  const move = normalized.phase === 'cop'
    ? suggestCopPlacement(normalized)
    : chooseThiefStep(normalized);
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
      nodesExplored: search.nodesExplored,
      timeMs,
      solutionLength: moves.length,
      solverName: 'escape-bfs + cut-heuristic',
      terminated: search.path == null ? 'exhausted' : 'solved',
    },
  };
}
