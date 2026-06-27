import type { Solution } from '@ludus/core';
import type { WythoffState, WythoffMove } from './types';

const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Check whether (a, b) is a P-position in Wythoff's game.
 * For a ≤ b: P-position iff a = ⌊(b - a) * φ⌋
 */
export function isWythoffPPosition(a: number, b: number): boolean {
  if (a === 0 && b === 0) return true;
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  const k = hi - lo;
  // ε guards against IEEE 754 rounding near integer boundaries
  return lo === Math.floor(k * PHI + 1e-12);
}

/**
 * Find the best winning move — the one that leaves the fewest total stones
 * (closest to terminal state). Returns null if already in a P-position.
 */
export function findWythoffWinningMove(state: WythoffState): WythoffMove | null {
  const [a, b] = state.piles;
  let bestMove: WythoffMove | null = null;
  let bestRemaining = Infinity;

  // Check single-pile moves
  for (let i = 0; i < 2; i++) {
    const count = state.piles[i]!;
    for (let r = 1; r <= count; r++) {
      const newPiles: [number, number] = [...state.piles] as [number, number];
      newPiles[i]! -= r;
      if (isWythoffPPosition(newPiles[0]!, newPiles[1]!)) {
        const remaining = newPiles[0]! + newPiles[1]!;
        if (remaining < bestRemaining) {
          bestRemaining = remaining;
          bestMove = { type: 'single', pileIndex: i, removeCount: r };
        }
      }
    }
  }

  // Check both-pile moves
  const maxBoth = Math.min(a, b);
  for (let r = 1; r <= maxBoth; r++) {
    const newPiles: [number, number] = [a - r, b - r];
    if (isWythoffPPosition(newPiles[0]!, newPiles[1]!)) {
      const remaining = newPiles[0]! + newPiles[1]!;
      if (remaining < bestRemaining) {
        bestRemaining = remaining;
        bestMove = { type: 'both', removeCount: r };
      }
    }
  }

  return bestMove;
}

export function solveWythoff(state: WythoffState): Solution {
  const startTime = performance.now();
  const [a, b] = state.piles;
  const isP = isWythoffPPosition(a, b);
  const winningMove = findWythoffWinningMove(state);
  const k = Math.abs(b - a);
  const beattyPair = isP && a <= b ? [Math.floor(k * PHI + 1e-12), Math.floor(k * PHI + 1e-12) + k] : null;

  const timeMs = Math.round(performance.now() - startTime);

  return {
    solvable: true,
    moves: winningMove ? [winningMove] : [],
    trace: {
      type: 'wythoff-beatty',
      steps: [{
        description: `Piles (${a}, ${b}) → ${isP ? 'P-position' : 'N-position'} (φ = ${PHI.toFixed(6)}, k = ${k})`,
        data: { piles: [a, b], isP, k, beattyPair, winningMove },
      }],
      visualizationData: { piles: [a, b], isP, k, phi: PHI, beattyPair, winningMove },
    },
    stats: {
      nodesExplored: 1,
      timeMs,
      solutionLength: winningMove ? 1 : 0,
      solverName: "Wythoff's Beatty sequence (1907)",
      terminated: 'solved',
    },
  };
}

/** Compute the first maxK Wythoff P-position pairs */
export function computeWythoffPPositions(maxK: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let k = 0; k <= maxK; k++) {
    pairs.push([Math.floor(k * PHI), Math.floor(k * PHI * PHI)]);
  }
  return pairs;
}
