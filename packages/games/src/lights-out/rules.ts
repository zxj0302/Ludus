import { buildLightsOutMatrix, solveGF2WithTrace, optimalSolution, applyMoveToGrid } from './solver';
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

export { getDifficulty } from './difficulty';

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
        description: s.descriptionKey,
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
