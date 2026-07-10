import type { Level, LevelConfig } from '@ludus/core';
import { mulberry32, resolveSeed } from '../generator-config';
import { cellIndex, neighbors4 } from './rules';
import { getDifficulty } from './difficulty';
import { shortestEscapePath } from './solver';
import type { CellKind, ThiefSiegeState } from './types';

type Pos = { row: number; col: number };

function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function chooseSize(score: number): number {
  if (score <= 33) return 7;
  if (score <= 66) return 9;
  return 11;
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

  const obstacleRate = targetScore <= 33 ? 0.16 : targetScore <= 66 ? 0.12 : 0.08;
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

  return cells;
}

function findThiefStart(rand: () => number, size: number, cells: CellKind[]): Pos | null {
  const center = (size - 1) / 2;
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

function createCandidate(rand: () => number, size: number, maxCops: number, targetScore: number): ThiefSiegeState | null {
  const cells = buildIrregularCells(rand, size, targetScore);
  const thief = findThiefStart(rand, size, cells);
  if (thief == null) return null;

  const state: ThiefSiegeState = {
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

  return shortestEscapePath(state) == null ? null : state;
}

export function generateThiefSiegeLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const rand = mulberry32(seed);
  const [rangeLo, rangeHi] = config.difficultyRange ?? [1, 100];
  const targetScore = rangeLo + rand() * (rangeHi - rangeLo);
  const size = config.size ?? chooseSize(targetScore);
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

  const fallbackState: ThiefSiegeState = {
    width: 5,
    height: 5,
    cells: [
      'exit', 'exit', 'exit', 'exit', 'exit',
      'exit', 'floor', 'floor', 'floor', 'exit',
      'exit', 'floor', 'floor', 'floor', 'exit',
      'exit', 'floor', 'floor', 'floor', 'exit',
      'exit', 'exit', 'exit', 'exit', 'exit',
    ],
    thief: { row: 2, col: 2 },
    cops: [],
    phase: 'cop',
    currentPlayer: 0,
    maxCops,
    status: 'playing',
  };

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
