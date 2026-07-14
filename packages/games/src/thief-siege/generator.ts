import type { Level, LevelConfig } from '@ludus/core';
import { mulberry32, resolveSeed } from '../generator-config';
import { copHasWinningStrategy, searchAdversary } from './adversary';
import { cellIndex, neighbors4 } from './rules';
import { getDifficulty } from './difficulty';
import { isWalkable, shortestEscapePath } from './solver';
import type { CellKind, ThiefSiegeState } from './types';

type Pos = { row: number; col: number };

function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

const ALLOWED_SIZES = [11, 15, 19] as const;

function normalizeSize(raw: number): number {
  if (raw === 11 || raw === 15 || raw === 19) return raw;
  return ALLOWED_SIZES.reduce((best, candidate) =>
    Math.abs(candidate - raw) < Math.abs(best - raw) ? candidate : best,
  );
}

function chooseSize(score: number): number {
  if (score <= 33) return 11;
  if (score <= 66) return 15;
  return 19;
}

function chooseMaxCops(rand: () => number, score: number): number {
  if (score <= 33) return randInt(rand, 16, 20);
  if (score <= 66) return randInt(rand, 12, 16);
  return randInt(rand, 8, 12);
}

function buildIrregularCells(rand: () => number, size: number, targetScore: number): CellKind[] {
  const cells: CellKind[] = new Array(size * size).fill('obstacle');
  const center = (size - 1) / 2;
  const rx = center * (0.9 + rand() * 0.16);
  const ry = center * (0.9 + rand() * 0.16);
  const insideMask: boolean[] = new Array(size * size).fill(false);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const dx = (col - center) / rx;
      const dy = (row - center) / ry;
      const wobble = (rand() - 0.5) * 0.18;
      insideMask[cellIndex(size, row, col)] = dx * dx + dy * dy <= 1 + wobble;
    }
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const idx = cellIndex(size, row, col);
      if (!insideMask[idx]) continue;

      const border = neighbors4(size, size, row, col).length < 4
        || neighbors4(size, size, row, col).some(pos => !insideMask[cellIndex(size, pos.row, pos.col)]);
      cells[idx] = border ? 'exit' : 'floor';
    }
  }

  const exitCandidates: Pos[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cells[cellIndex(size, row, col)] === 'exit') exitCandidates.push({ row, col });
    }
  }
  const exitBudget = targetScore <= 33 ? 1 : targetScore <= 66 ? 2 : 3;
  const shuffledExits = [...exitCandidates].sort(() => rand() - 0.5);
  const keptExits = new Set(shuffledExits.slice(0, Math.min(exitBudget, shuffledExits.length)).map(pos => cellIndex(size, pos.row, pos.col)));
  for (const pos of exitCandidates) {
    const idx = cellIndex(size, pos.row, pos.col);
    if (!keptExits.has(idx)) cells[idx] = 'floor';
  }
  const direction = randInt(rand, 0, 3);
  const primaryExit = direction === 0
    ? { row: 0, col: center }
    : direction === 1
      ? { row: size - 1, col: center }
      : direction === 2
        ? { row: center, col: 0 }
        : { row: center, col: size - 1 };
  const gate = direction === 0
    ? { row: center - 1, col: center }
    : direction === 1
      ? { row: center + 1, col: center }
      : direction === 2
        ? { row: center, col: center - 1 }
        : { row: center, col: center + 1 };

  const obstacleRate = targetScore <= 33 ? 0.22 : targetScore <= 66 ? 0.16 : 0.1;
  const centerSafeRadius = targetScore <= 33 ? 1 : 2;
  for (let row = 1; row < size - 1; row++) {
    for (let col = 1; col < size - 1; col++) {
      const idx = cellIndex(size, row, col);
      if (cells[idx] !== 'floor') continue;
      const centerDistance = Math.abs(row - center) + Math.abs(col - center);
      if (centerDistance <= centerSafeRadius) continue;
      if (rand() < obstacleRate) cells[idx] = 'obstacle';
    }
  }

  if (primaryExit.row === center) {
    const lo = Math.min(primaryExit.col, center);
    const hi = Math.max(primaryExit.col, center);
    for (let col = lo; col <= hi; col++) cells[cellIndex(size, center, col)] = 'floor';
  } else {
    const lo = Math.min(primaryExit.row, center);
    const hi = Math.max(primaryExit.row, center);
    for (let row = lo; row <= hi; row++) cells[cellIndex(size, row, center)] = 'floor';
  }
  cells[cellIndex(size, primaryExit.row, primaryExit.col)] = 'exit';
  cells[cellIndex(size, center, center)] = 'floor';
  for (const neighbor of neighbors4(size, size, center, center)) {
    if (neighbor.row === gate.row && neighbor.col === gate.col) continue;
    cells[cellIndex(size, neighbor.row, neighbor.col)] = 'obstacle';
  }
  cells[cellIndex(size, gate.row, gate.col)] = 'floor';

  return cells;
}

function buildBottleneckWinCells(rand: () => number, size: number): { cells: CellKind[]; thief: Pos } {
  const cells: CellKind[] = new Array(size * size).fill('obstacle');
  const center = (size - 1) / 2;
  const direction = randInt(rand, 0, 3);
  const thief = { row: center, col: center };
  cells[cellIndex(size, thief.row, thief.col)] = 'floor';

  const carve = (row: number, col: number, kind: CellKind): void => {
    cells[cellIndex(size, row, col)] = kind;
  };

  if (direction === 0) {
    for (let row = center - 1; row >= 0; row--) carve(row, center, row === 0 ? 'exit' : 'floor');
  } else if (direction === 1) {
    for (let row = center + 1; row < size; row++) carve(row, center, row === size - 1 ? 'exit' : 'floor');
  } else if (direction === 2) {
    for (let col = center - 1; col >= 0; col--) carve(center, col, col === 0 ? 'exit' : 'floor');
  } else {
    for (let col = center + 1; col < size; col++) carve(center, col, col === size - 1 ? 'exit' : 'floor');
  }

  return { cells, thief };
}

function findThiefStart(rand: () => number, size: number, cells: CellKind[]): Pos | null {
  const center = (size - 1) / 2;
  if (cells[cellIndex(size, center, center)] === 'floor') return { row: center, col: center };

  const candidates: Pos[] = [];

  for (let row = 1; row < size - 1; row++) {
    for (let col = 1; col < size - 1; col++) {
      if (cells[cellIndex(size, row, col)] === 'floor') candidates.push({ row, col });
    }
  }

  candidates.sort((a, b) => {
    const da = Math.abs(a.row - center) + Math.abs(a.col - center);
    const db = Math.abs(b.row - center) + Math.abs(b.col - center);
    return da - db;
  });

  const centralCandidates = candidates.slice(0, Math.max(1, Math.min(candidates.length, 6)));
  return centralCandidates[Math.floor(rand() * centralCandidates.length)] ?? null;
}

function createState(size: number, cells: CellKind[], thief: Pos, maxCops: number): ThiefSiegeState {
  return {
    width: size,
    height: size,
    cells,
    thief,
    cops: [],
    phase: 'cop',
    currentPlayer: 0,
    maxCops,
    status: 'playing',
  };
}

function isPlaceablePathCell(state: ThiefSiegeState, pos: Pos): boolean {
  if (pos.row === state.thief.row && pos.col === state.thief.col) return false;
  if (!isWalkable(state, pos.row, pos.col)) return false;
  return !state.cops.some(cop => cop.row === pos.row && cop.col === pos.col);
}

function passesWinGate(state: ThiefSiegeState, targetScore: number): boolean {
  const path = shortestEscapePath(state);
  if (path == null) return false;

  if (targetScore <= 33) {
    return copHasWinningStrategy(state, {
      timeMs: 1500,
      maxDepth: Infinity,
      maxPlaceBranch: 12,
    });
  }

  const placeableOnPath = path.slice(1).filter(pos => isPlaceablePathCell(state, pos)).length;
  if (state.maxCops < Math.min(placeableOnPath, 3)) return false;

  return searchAdversary(state, {
    timeMs: 200,
    maxDepth: 4,
    maxPlaceBranch: 8,
  }).copWinning !== false;
}

function createConstructiveCandidate(
  rand: () => number,
  size: number,
  maxCops: number,
  targetScore: number,
): ThiefSiegeState | null {
  const { cells, thief } = buildBottleneckWinCells(rand, size);
  const state = createState(size, cells, thief, maxCops);
  return passesWinGate(state, targetScore) ? state : null;
}

function createIrregularCandidate(
  rand: () => number,
  size: number,
  maxCops: number,
  targetScore: number,
): ThiefSiegeState | null {
  const cells = buildIrregularCells(rand, size, targetScore);
  const thief = findThiefStart(rand, size, cells);
  if (thief == null) return null;

  const state = createState(size, cells, thief, maxCops);
  return passesWinGate(state, targetScore) ? state : null;
}

function createCandidate(rand: () => number, size: number, maxCops: number, targetScore: number): ThiefSiegeState | null {
  return createIrregularCandidate(rand, size, maxCops, targetScore)
    ?? createConstructiveCandidate(rand, size, maxCops, targetScore);
}

function createFallbackState(maxCops: number, targetScore: number): ThiefSiegeState {
  const fallbackSize = 11;
  const fallbackMaxCops = Math.max(maxCops, 3);
  const candidate = createConstructiveCandidate(mulberry32(0x51e9e), fallbackSize, fallbackMaxCops, targetScore);
  if (candidate != null) return candidate;

  for (const seed of [0x71eaf, 0xa11e7, 0xc0f17, 0xf411b]) {
    const { cells, thief } = buildBottleneckWinCells(mulberry32(seed), fallbackSize);
    const alternate = createState(fallbackSize, cells, thief, fallbackMaxCops);
    if (passesWinGate(alternate, targetScore)) return alternate;
  }

  throw new Error(`Unable to create thief-siege fallback that passes the win gate for score ${targetScore}.`);
}

export function generateThiefSiegeLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const rand = mulberry32(seed);
  const [rangeLo, rangeHi] = config.difficultyRange ?? [1, 100];
  const targetScore = rangeLo + rand() * (rangeHi - rangeLo);
  const size = normalizeSize(config.size ?? chooseSize(targetScore));
  const maxCops = chooseMaxCops(rand, targetScore);
  const maxAttempts = 100;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const initialState = createCandidate(rand, size, maxCops, targetScore);
    if (initialState == null) continue;

    return {
      schemaVersion: 1,
      gameId: 'thief-siege',
      levelId: `thief-siege-${size}x${size}-${seed}-${attempt}`,
      initialState,
      difficulty: getDifficulty(initialState),
      optimalSteps: null,
      uniqueSolution: false,
      generatedBy: 'generateThiefSiegeLevel',
      createdAt: new Date(seed).toISOString(),
    };
  }

  const fallbackState = createFallbackState(maxCops, targetScore);

  return {
    schemaVersion: 1,
    gameId: 'thief-siege',
    levelId: `thief-siege-fallback-${seed}`,
    initialState: fallbackState,
    difficulty: getDifficulty(fallbackState),
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'generateThiefSiegeLevel',
    createdAt: new Date(seed).toISOString(),
  };
}
