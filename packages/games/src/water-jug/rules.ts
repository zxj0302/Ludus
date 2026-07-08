import type { Difficulty } from '@ludus/core';
import type { WaterJugState, WaterJugMove } from './types';
import { solveWaterJug } from './solver';
import { computeWaterJugDifficulty } from './difficulty';

export type { WaterJugState, WaterJugMove };

export function createInitialState(capacities: number[], target: number): WaterJugState {
  return {
    jugs: capacities.map(() => 0),
    capacities: [...capacities],
    target,
  };
}

/** Compute greatest common divisor */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** Check if the target is theoretically achievable (Bézout's identity) */
export function isSolvable(capacities: number[], target: number): boolean {
  if (target === 0) return true;
  const maxCap = Math.max(...capacities);
  if (target > maxCap) return false;
  // Compute GCD of all capacities
  let g = capacities[0]!;
  for (let i = 1; i < capacities.length; i++) {
    g = gcd(g, capacities[i]!);
  }
  return target % g === 0;
}

export function legalMoves(state: WaterJugState): WaterJugMove[] {
  const { jugs, capacities } = state;
  const moves: WaterJugMove[] = [];

  for (let i = 0; i < jugs.length; i++) {
    // Fill a non-full jug
    if (jugs[i]! < capacities[i]!) {
      moves.push({ type: 'fill', jugIndex: i });
    }
    // Empty a non-empty jug
    if (jugs[i]! > 0) {
      moves.push({ type: 'empty', jugIndex: i });
    }
    // Pour from i to j
    for (let j = 0; j < jugs.length; j++) {
      if (i === j) continue;
      if (jugs[i]! > 0 && jugs[j]! < capacities[j]!) {
        moves.push({ type: 'pour', from: i, to: j });
      }
    }
  }

  return moves;
}

export function applyMove(state: WaterJugState, move: WaterJugMove): WaterJugState {
  const newJugs = [...state.jugs];

  if (move.type === 'fill') {
    newJugs[move.jugIndex] = state.capacities[move.jugIndex]!;
  } else if (move.type === 'empty') {
    newJugs[move.jugIndex] = 0;
  } else if (move.type === 'pour') {
    const { from, to } = move;
    const amount = Math.min(
      newJugs[from]!,
      state.capacities[to]! - newJugs[to]!,
    );
    newJugs[from] = newJugs[from]! - amount;
    newJugs[to] = newJugs[to]! + amount;
  }

  return {
    jugs: newJugs,
    capacities: [...state.capacities],
    target: state.target,
  };
}

export function isSolved(state: WaterJugState): boolean {
  return state.jugs.some(amount => amount === state.target);
}

export function getDifficulty(state: WaterJugState): Difficulty {
  // Use BFS optimal depth for accurate difficulty scoring (water jug is fast-solver: < 1ms)
  const solution = solveWaterJug(state);
  const optimalDepth = solution.solvable ? solution.stats.solutionLength : 0;
  return computeWaterJugDifficulty(state, optimalDepth);
}
