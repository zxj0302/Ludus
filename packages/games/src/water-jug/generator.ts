import type { Level, LevelConfig } from '@ludus/core';
import { mulberry32, resolveSeed } from '../generator-config';
import type { WaterJugState } from './types';
import { createInitialState, isSolvable, gcd } from './rules';
import { solveWaterJug } from './solver';
import { computeWaterJugDifficulty } from './difficulty';

/**
 * Generate a random integer in [min, max].
 */
function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Pick achievable targets sorted by estimated difficulty (harder first).
 *
 * Harder targets tend to be those that:
 *   - Are NOT direct multiples of any single capacity (requires pouring)
 *   - Are far from simple fills (i.e. not = any capacity, not = |c₁−c₂|)
 *
 * Returns all achievable targets, sorted so that "interesting" (harder) ones
 * come first. The caller picks from the front half for all difficulty modes.
 */
function pickTargetsByDifficulty(capacities: number[]): number[] {
  const maxCap = Math.max(...capacities);
  let g = capacities[0]!;
  for (let i = 1; i < capacities.length; i++) {
    g = gcd(g, capacities[i]!);
  }

  const achievable: number[] = [];
  for (let t = 1; t <= maxCap; t++) {
    if (t % g === 0) achievable.push(t);
  }

  if (achievable.length === 0) return [maxCap];

  // Score each target by "interestingness": penalties for trivial solutions
  const scored = achievable.map(t => {
    let penalty = 0;
    // Direct fill: target equals a capacity → trivially 1 step
    if (capacities.some(c => c === t)) penalty += 100;
    // Target equals capacity difference → often 2 steps (fill large, pour)
    for (let i = 0; i < capacities.length; i++) {
      for (let j = 0; j < capacities.length; j++) {
        if (i !== j && t === Math.abs(capacities[i]! - capacities[j]!)) penalty += 50;
      }
    }
    // Target small relative to max capacity → often fewer steps
    penalty += Math.round((1 - t / maxCap) * 20);
    return { t, penalty };
  });

  // Sort by penalty ascending → harder (low penalty) first
  scored.sort((a, b) => a.penalty - b.penalty);
  return scored.map(s => s.t);
}

/**
 * Generate a water jug puzzle level with rejection sampling.
 */
export function generateWaterJugLevel(config: LevelConfig): Level {
  const seed = resolveSeed(config);
  const rng = mulberry32(seed);
  const [rangeLo, rangeHi] = config.difficultyRange ?? [1, 100];
  // Target score we aim for (sampled within requested range)
  const targetScore = rangeLo + (rangeHi - rangeLo) * rng();

  let capMin: number;
  let capMax: number;
  let numJugs: number;

  if (targetScore <= 33) {
    capMin = 2; capMax = 5; numJugs = 2;
  } else if (targetScore <= 66) {
    capMin = 5; capMax = 8; numJugs = randInt(rng, 2, 3);
  } else {
    capMin = 8; capMax = 12; numJugs = randInt(rng, 2, 3);
  }

  let bestResult: { state: WaterJugState; optimalSteps: number; difficulty: ReturnType<typeof computeWaterJugDifficulty> } | null = null;
  let bestDistance = Infinity;

  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random capacities
    const capacities: number[] = [];
    for (let i = 0; i < numJugs; i++) {
      capacities.push(randInt(rng, capMin, capMax));
    }
    // Ensure at least two different capacities (for 2+ jugs)
    if (numJugs >= 2 && capacities[0] === capacities[1]) {
      capacities[1] = randInt(rng, capMin, capMax);
    }
    // For 3 jugs, ensure diverse capacities
    if (numJugs >= 3 && capacities.every(c => c === capacities[0])) {
      capacities[1] = randInt(rng, capMin, capMax);
      capacities[2] = randInt(rng, capMin, capMax);
    }

    // Pick target from harder half of candidates.
    const candidates = pickTargetsByDifficulty(capacities);
    const hardCount = Math.max(1, Math.ceil(candidates.length / 2));
    const target = candidates[randInt(rng, 0, hardCount - 1)]!;

    if (target === 0 || !isSolvable(capacities, target)) continue;

    // Build state and solve
    const state = createInitialState(capacities, target);
    const solution = solveWaterJug(state);
    if (!solution.solvable) continue;

    const optimalSteps = solution.stats.solutionLength;
    // Reject trivial puzzles: < 3 steps is boring (e.g. target = capacity → 1 fill)
    if (optimalSteps < 3) continue;
    const difficulty = computeWaterJugDifficulty(state, optimalSteps);
    const actualScore = difficulty.score;

    // Check if score falls in requested range
    if (actualScore >= rangeLo && actualScore <= rangeHi) {
      // Exact match — use immediately
      return {
        schemaVersion: 1,
        gameId: 'water-jug',
        levelId: `wj-${seed}-${capacities.join('-')}-${target}`,
        initialState: state,
        difficulty,
        optimalSteps,
        uniqueSolution: false, // BFS finds A shortest path, not necessarily unique
        generatedBy: 'generateWaterJugLevel',
        createdAt: new Date().toISOString(),
      };
    }

    // Track best candidate (closest to requested range)
    const distance = actualScore < rangeLo ? rangeLo - actualScore : actualScore - rangeHi;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestResult = { state, optimalSteps, difficulty };
    }
  }

  // Fallback: return best candidate found (even if outside requested range)
  if (bestResult) {
    return {
      schemaVersion: 1,
      gameId: 'water-jug',
      levelId: `wj-${seed}-${bestResult.state.capacities.join('-')}-${bestResult.state.target}`,
      initialState: bestResult.state,
      difficulty: bestResult.difficulty,
      optimalSteps: bestResult.optimalSteps,
      uniqueSolution: false,
      generatedBy: 'generateWaterJugLevel',
      createdAt: new Date().toISOString(),
    };
  }

  // Ultimate fallback: classic (3, 5) → 4 puzzle
  const fallbackState = createInitialState([3, 5], 4);
  const fallbackSolution = solveWaterJug(fallbackState);
  return {
    schemaVersion: 1,
    gameId: 'water-jug',
    levelId: `wj-${seed}-3-5-4`,
    initialState: fallbackState,
    difficulty: computeWaterJugDifficulty(fallbackState, fallbackSolution.stats.solutionLength),
    optimalSteps: fallbackSolution.stats.solutionLength,
    uniqueSolution: false,
    generatedBy: 'generateWaterJugLevel',
    createdAt: new Date().toISOString(),
  };
}
