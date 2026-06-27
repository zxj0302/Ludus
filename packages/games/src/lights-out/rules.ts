import type { GameState, Move, Difficulty } from '@ludus/core';
import { buildLightsOutMatrix, solveGF2, solveGF2WithTrace, optimalSolution, hammingWeight, applyMoveToGrid } from './solver';
import type { LightsOutState, LightsOutMove } from './types';

// ---- 状态创建 ----

export function createLightsOutState(n = 5): LightsOutState {
  return {
    n,
    grid: new Array(n * n).fill(0),
  };
}

export function createLightsOutStateFromGrid(grid: number[], n?: number): LightsOutState {
  const size = n ?? Math.round(Math.sqrt(grid.length));
  return { n: size, grid: [...grid] };
}

// ---- 规则引擎 ----

export function legalMoves(state: LightsOutState): LightsOutMove[] {
  const moves: LightsOutMove[] = [];
  for (let r = 0; r < state.n; r++) {
    for (let c = 0; c < state.n; c++) {
      moves.push({ row: r, col: c });
    }
  }
  return moves;
}

export function applyMove(state: LightsOutState, move: LightsOutMove): LightsOutState {
  const grid = [...state.grid];
  applyMoveToGrid(grid, state.n, move.row, move.col);
  return { n: state.n, grid };
}

export function isSolved(state: LightsOutState): boolean {
  return state.grid.every(cell => cell === 0);
}

// ---- 难度 ----

export function getDifficulty(state: LightsOutState): Difficulty {
  const N = state.n * state.n;
  const A = buildLightsOutMatrix(state.n);
  const sol = solveGF2(A, state.grid);
  const optimal = optimalSolution(sol);
  const optimalSteps = optimal ? hammingWeight(optimal) : null;

  // 难度主要基于最优解步数，辅以尺寸因子（与 generator 的 computeDifficulty 一致）
  if (optimalSteps === 0) {
    return { score: 0, factors: { size: state.n, optimalSteps: 0, nullity: sol.nullity }, labelKey: 'difficulty.easy' };
  }

  const moveFactor = optimalSteps != null ? Math.min(optimalSteps / 30, 1) : 0.5;
  const sizeFactor = (state.n - 3) / 7; // 0 at 3×3, 1 at 10×10
  const uniqueBonus = sol.nullity === 0 ? 0 : 5; // 多解略微降低难度

  const score = Math.round(sizeFactor * 25 + moveFactor * 50 + (1 - uniqueBonus / 100) * 25);
  const clamped = Math.max(0, Math.min(100, score));

  const labelKey = clamped <= 20 ? 'difficulty.easy'
    : clamped <= 50 ? 'difficulty.medium'
    : 'difficulty.hard';

  return {
    score: clamped,
    factors: {
      size: state.n,
      optimalSteps: optimalSteps ?? -1,
      nullity: sol.nullity,
    },
    labelKey,
  };
}

// ---- 求解器 ----

export function solveLightsOut(state: LightsOutState) {
  const { n, grid } = state;
  const A = buildLightsOutMatrix(n);
  const sol = solveGF2WithTrace(A, grid);
  const optimal = optimalSolution(sol);

  const moves: LightsOutMove[] = [];
  if (optimal) {
    for (let i = 0; i < optimal.length; i++) {
      if (optimal[i] === 1) {
        moves.push({ row: Math.floor(i / n), col: i % n });
      }
    }
  }

  return {
    solvable: sol.particular !== null,
    moves,
    trace: {
      type: 'matrix-transform' as const,
      steps: sol.eliminationSteps.map(s => ({
        description: s.description,
        data: s,
      })),
      visualizationData: {
        matrix: A,
        vector: grid,
        solution: optimal,
        rank: sol.rank,
        nullity: sol.nullity,
        nullSpace: sol.nullSpace,
        eliminationSteps: sol.eliminationSteps,
      },
    },
    stats: {
      nodesExplored: 1,
      timeMs: -1, // 由外层 measure 覆盖
      solutionLength: moves.length,
      solverName: 'GF(2) Gaussian Elimination',
    },
  };
}
