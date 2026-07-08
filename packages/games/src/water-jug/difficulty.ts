import type { Difficulty } from '@ludus/core';
import type { WaterJugState } from './types';

/**
 * Compute difficulty based on the optimal solution path length and state space.
 *
 * Difficulty formula (two components):
 *   1. Depth score (0–80): optimalDepth / maxPossibleDepth × 80
 *      where maxPossibleDepth = sum(capacities) — the theoretical upper bound
 *      for 2-jug BFS (≈ a + b steps via extended Euclidean algorithm).
 *   2. State-space bonus (0–20): stateSpace / maxStateSpace × 20
 *      Larger state spaces feel harder even at the same depth.
 *
 * Examples:
 *   (3, 5)→4: depth=6, maxDepth=8, stateSpace=36  → score=60+0=60 (Medium)
 *   (5, 7)→4: depth=8, maxDepth=12, stateSpace=48 → score=53+1=54 (Medium)
 *   (11,12)→1: depth≈21, maxDepth=23, stateSpace=156 → score=73+1=74 (Hard)
 *   (4, 6)→2: depth=4, maxDepth=10, stateSpace=35   → score=32+0=32 (Easy)
 *
 * @param state    — the initial puzzle state
 * @param optimalDepth — the BFS shortest path length (from generator/solver)
 */
export function computeWaterJugDifficulty(
  state: WaterJugState,
  optimalDepth: number,
): Difficulty {
  const capacities = state.capacities;
  const sumCaps = capacities.reduce((a, b) => a + b, 0);
  // max possible BFS depth for this puzzle — at least 6 so tiny puzzles
  // like (2,3) still get meaningful scores
  const maxDepth = Math.max(sumCaps, 6);

  // Depth component: 0–80 points
  const capped = Math.min(optimalDepth, maxDepth);
  const depthScore = Math.round((capped / maxDepth) * 80);

  // State-space component: 0–20 points
  const stateSpace = capacities.reduce((p, c) => p * (c + 1), 1);
  const maxStateSpace = 13 * 13 * 13; // 3 jugs × capacity 12 = 2197
  const spaceBonus = Math.round(Math.min(stateSpace / maxStateSpace, 1) * 20);

  const score = Math.min(depthScore + spaceBonus, 100);

  let labelKey: string;
  if (score <= 33) labelKey = 'difficulty.easy';
  else if (score <= 66) labelKey = 'difficulty.medium';
  else labelKey = 'difficulty.hard';

  return {
    score,
    factors: {
      optimalDepth,
      numJugs: capacities.length,
      maxCapacity: Math.max(...capacities),
      target: state.target,
      stateSpace,
    },
    labelKey,
  };
}
