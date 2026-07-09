import { buildLightsOutMatrix, solveGF2, optimalSolution, hammingWeight, applyMoveToGrid } from './solver';
import { getDifficulty } from './difficulty';
import type { Level, LevelConfig } from '@ludus/core';
import type { LightsOutState, LightsOutMove } from './types';

export interface GenerateOptions {
  n: number;
  minMoves?: number;
  maxMoves?: number;
  requireUnique?: boolean;
  requireOptimal?: boolean;
  seed?: number;
}

function numParam(config: LevelConfig, key: string, fallback: number): number {
  const value = config.gameParams?.[key];
  return typeof value === 'number' ? value : fallback;
}

function boolParam(config: LevelConfig, key: string, fallback: boolean): boolean {
  const value = config.gameParams?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

// ---- 伪随机数生成器 (mulberry32) ----

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- 生成器 ----

/**
 * 反向求解生成器：
 * 1. 从零状态（全灭/已解）开始
 * 2. 随机应用 minMoves–maxMoves 步操作
 * 3. 验证唯一解 / 计算最优解
 */
export function generateLightsOutLevel(config: LevelConfig & {
  n?: number;
  minMoves?: number;
  maxMoves?: number;
  requireUnique?: boolean;
  requireOptimal?: boolean;
}): Level {
  const n = config.size ?? config.n ?? 5;
  const minMoves = Math.max(1, numParam(config, 'minMoves', config.minMoves ?? 3));
  const maxMoves = Math.max(minMoves, numParam(config, 'maxMoves', config.maxMoves ?? 15));
  let requireUnique = boolParam(config, 'requireUniqueSolution', config.requireUniqueSolution ?? config.requireUnique ?? true);
  const requireOptimal = boolParam(config, 'requireKnownOptimal', config.requireKnownOptimal ?? config.requireOptimal ?? true);
  const seed = config.seed ?? Date.now();

  const rand = mulberry32(seed);
  const A = buildLightsOutMatrix(n);
  const N = n * n;

  // 检查 n×n 矩阵是否可逆（有些尺寸的 Lights Out 矩阵是奇异的）
  const solCheck = solveGF2(A, new Array(N).fill(0));
  const canBeUnique = solCheck.nullity === 0;

  // 矩阵不满秩时无法保证唯一解，自动降级 requireUnique
  if (requireUnique && !canBeUnique) {
    requireUnique = false;
  }

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;

    // 从零状态开始，随机应用步数
    const moves: LightsOutMove[] = [];
    const moveCount = minMoves + Math.floor(rand() * (maxMoves - minMoves + 1));
    const currentGrid = new Array(N).fill(0);

    const pressedCells = new Set<number>();

    let step = 0;
    let pickRetries = 0;
    const maxPickRetries = moveCount * 3;
    while (step < moveCount && pickRetries < maxPickRetries) {
      const idx = Math.floor(rand() * N);
      const row = Math.floor(idx / n);
      const col = idx % n;

      if (pressedCells.has(idx)) { pickRetries++; continue; }

      pressedCells.add(idx);
      applyMoveToGrid(currentGrid, n, row, col);
      moves.push({ row, col });
      step++;
    }

    // 构建 GF(2) 方程组求解
    const sol = solveGF2(A, currentGrid);
    if (sol.particular === null) continue; // 理论上不会发生

    const unique = sol.nullity === 0;
    if (requireUnique && !unique) continue;

    // 计算最优解步数
    const optimal = optimalSolution(sol);
    const optimalSteps = optimal ? hammingWeight(optimal) : null;
    const actualMoves = moves.length;

    // 若要求已知最优解，且实际步数 > 最优步数，跳过
    if (requireOptimal && optimalSteps !== null && actualMoves > optimalSteps) continue;

    const levelId = `lights-out-${n}x${n}-${seed}-${attempts}`;

    const initialState: LightsOutState = {
      n,
      grid: currentGrid,
    };

    // Use shared getDifficulty for consistency between generator and rules
    const difficulty = getDifficulty(initialState);

    return {
      schemaVersion: 1,
      gameId: 'lights-out',
      levelId,
      initialState: initialState as unknown as Record<string, unknown>,
      difficulty,
      optimalSteps,
      uniqueSolution: unique,
      generatedBy: 'reverse-solve-gf2',
      createdAt: new Date().toISOString(),
    };
  }

  // fallback: only when unique/optimal not required
  if (requireUnique || requireOptimal) {
    throw new Error(`Failed to generate lights-out level (n=${n}) meeting requirements after ${maxAttempts} attempts`);
  }

  const fallbackGrid = new Array(N).fill(0);
  for (let i = 0; i < Math.min(minMoves, 5); i++) {
    const idx = Math.floor(rand() * N);
    applyMoveToGrid(fallbackGrid, n, Math.floor(idx / n), idx % n);
  }

  return {
    schemaVersion: 1,
    gameId: 'lights-out',
    levelId: `lights-out-${n}x${n}-fallback-${seed}`,
    initialState: { n, grid: fallbackGrid } as unknown as Record<string, unknown>,
    difficulty: { score: 20, factors: { size: n }, labelKey: 'difficulty.easy' },
    optimalSteps: null,
    uniqueSolution: false,
    generatedBy: 'reverse-solve-gf2-fallback',
    createdAt: new Date().toISOString(),
  };
}
