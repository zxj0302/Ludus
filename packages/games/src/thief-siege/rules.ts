import type { ThiefSiegeState, ThiefSiegeMove, CellKind } from './types';

export type { ThiefSiegeState, ThiefSiegeMove, CellKind };

const INITIAL_WIDTH = 5;
const INITIAL_HEIGHT = 5;
const INITIAL_THIEF_ROW = 2;
const INITIAL_THIEF_COL = 2;
const INITIAL_MAX_COPS = 10;

export function cellIndex(width: number, row: number, col: number): number {
  return row * width + col;
}

export function inBounds(
  width: number,
  height: number,
  row: number,
  col: number,
): boolean {
  return row >= 0 && row < height && col >= 0 && col < width;
}

export function neighbors4(
  width: number,
  height: number,
  row: number,
  col: number,
): { row: number; col: number }[] {
  const deltas = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  return deltas
    .map(d => ({ row: row + d.row, col: col + d.col }))
    .filter(pos => inBounds(width, height, pos.row, pos.col));
}

function buildInitialCells(width: number, height: number): CellKind[] {
  const cells: CellKind[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const onBorder = row === 0 || row === height - 1 || col === 0 || col === width - 1;
      cells.push(onBorder ? 'exit' : 'floor');
    }
  }
  return cells;
}

export function createInitialState(): ThiefSiegeState {
  return {
    width: INITIAL_WIDTH,
    height: INITIAL_HEIGHT,
    cells: buildInitialCells(INITIAL_WIDTH, INITIAL_HEIGHT),
    thief: { row: INITIAL_THIEF_ROW, col: INITIAL_THIEF_COL },
    cops: [],
    phase: 'cop',
    currentPlayer: 0,
    maxCops: INITIAL_MAX_COPS,
    status: 'playing',
  };
}

function getCell(state: ThiefSiegeState, row: number, col: number): CellKind | undefined {
  if (!inBounds(state.width, state.height, row, col)) return undefined;
  return state.cells[cellIndex(state.width, row, col)];
}

function isCopAt(state: ThiefSiegeState, row: number, col: number): boolean {
  return state.cops.some(cop => cop.row === row && cop.col === col);
}

function isWalkableCell(state: ThiefSiegeState, row: number, col: number): boolean {
  const cell = getCell(state, row, col);
  if (cell !== 'floor' && cell !== 'exit') return false;
  return !isCopAt(state, row, col);
}

function isValidPlaceTarget(state: ThiefSiegeState, row: number, col: number): boolean {
  if (state.thief.row === row && state.thief.col === col) return false;
  return isWalkableCell(state, row, col);
}

function thiefStepMoves(state: ThiefSiegeState): ThiefSiegeMove[] {
  const { thief, width, height } = state;
  return neighbors4(width, height, thief.row, thief.col)
    .filter(pos => isWalkableCell(state, pos.row, pos.col))
    .map(pos => ({ type: 'step' as const, row: pos.row, col: pos.col }));
}

function copPlaceMoves(state: ThiefSiegeState): ThiefSiegeMove[] {
  if (state.cops.length >= state.maxCops) return [];

  const moves: ThiefSiegeMove[] = [];
  for (let row = 0; row < state.height; row++) {
    for (let col = 0; col < state.width; col++) {
      if (isValidPlaceTarget(state, row, col)) {
        moves.push({ type: 'place', row, col });
      }
    }
  }
  return moves;
}

export function normalizeTerminalState(state: ThiefSiegeState): ThiefSiegeState {
  if (state.status !== 'playing') return state;

  const steps = thiefStepMoves(state);
  if (steps.length === 0) return { ...state, status: 'cop-win' };

  if (state.phase === 'cop' && copPlaceMoves(state).length === 0) {
    return { ...state, phase: 'thief', currentPlayer: 1 };
  }

  return state;
}

export function legalMoves(state: ThiefSiegeState): ThiefSiegeMove[] {
  const normalized = normalizeTerminalState(state);
  if (normalized.status !== 'playing') return [];

  if (normalized.phase === 'cop') {
    return copPlaceMoves(normalized);
  }

  return thiefStepMoves(normalized);
}

export function applyMove(state: ThiefSiegeState, move: ThiefSiegeMove): ThiefSiegeState {
  const normalized = normalizeTerminalState(state);
  if (normalized.status !== 'playing') return normalized;

  if (move.type === 'place') {
    if (normalized.phase !== 'cop') return normalized;
    if (!isValidPlaceTarget(normalized, move.row, move.col)) return normalized;
    if (normalized.cops.length >= normalized.maxCops) return normalized;

    const next: ThiefSiegeState = {
      ...normalized,
      cops: [...normalized.cops, { row: move.row, col: move.col }],
      phase: 'thief',
      currentPlayer: 1,
    };
    return normalizeTerminalState(next);
  }

  if (normalized.phase !== 'thief') return normalized;

  const { thief } = normalized;
  const isNeighbor = neighbors4(normalized.width, normalized.height, thief.row, thief.col)
    .some(pos => pos.row === move.row && pos.col === move.col);
  if (!isNeighbor || !isWalkableCell(normalized, move.row, move.col)) return normalized;

  const cell = getCell(normalized, move.row, move.col)!;
  if (cell === 'exit') {
    return {
      ...normalized,
      thief: { row: move.row, col: move.col },
      status: 'thief-win',
    };
  }

  const next: ThiefSiegeState = {
    ...normalized,
    thief: { row: move.row, col: move.col },
    phase: 'cop',
    currentPlayer: 0,
  };
  return normalizeTerminalState(next);
}

export function isSolved(state: ThiefSiegeState): boolean {
  return state.status === 'cop-win';
}

export function isOwnState(state: unknown): state is ThiefSiegeState {
  if (state == null || typeof state !== 'object') return false;

  const s = state as Record<string, unknown>;
  const thief = s.thief;
  if (thief == null || typeof thief !== 'object') return false;

  const thiefPos = thief as { row?: unknown; col?: unknown };
  if (typeof thiefPos.row !== 'number' || typeof thiefPos.col !== 'number') return false;
  if (!Array.isArray(s.cells) || !Array.isArray(s.cops)) return false;
  if (typeof s.width !== 'number' || typeof s.height !== 'number') return false;
  if (typeof s.maxCops !== 'number') return false;
  if (s.phase !== 'cop' && s.phase !== 'thief') return false;
  if (s.currentPlayer !== 0 && s.currentPlayer !== 1) return false;
  if (s.status !== 'playing' && s.status !== 'cop-win' && s.status !== 'thief-win') {
    return false;
  }

  return true;
}
