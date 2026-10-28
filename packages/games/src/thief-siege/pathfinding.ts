import { cellIndex, inBounds, neighbors4 } from './rules';
import type { ThiefSiegeState } from './types';

export type Pos = { row: number; col: number };

export interface EscapeSearchResult {
  path: Pos[] | null;
  nodesExplored: number;
}

export function samePos(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col;
}

export function posKey(pos: Pos): string {
  return `${pos.row},${pos.col}`;
}

export function isCopAt(state: ThiefSiegeState, row: number, col: number): boolean {
  return state.cops.some(cop => cop.row === row && cop.col === col);
}

export function getCell(state: ThiefSiegeState, row: number, col: number) {
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

export function findShortestEscapePath(state: ThiefSiegeState): EscapeSearchResult {
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
