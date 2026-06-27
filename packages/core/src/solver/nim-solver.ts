import type { Solution } from '../types/plugin';
import type { NimState, NimMove } from '../types/nim';

export function computeNimSum(piles: number[]): number {
  return piles.reduce((a, b) => a ^ b, 0);
}

export function isPPosition(piles: number[]): boolean {
  return computeNimSum(piles) === 0;
}

export function findWinningMove(piles: number[]): NimMove | null {
  const nimSum = computeNimSum(piles);
  if (nimSum === 0) return null;
  let bestMove: NimMove | null = null;
  let bestRemaining = Infinity;
  for (let i = 0; i < piles.length; i++) {
    const target = piles[i]! ^ nimSum;
    if (target < piles[i]!) {
      const newPiles = [...piles];
      newPiles[i] = target;
      const remaining = newPiles.reduce((a, b) => a + b, 0);
      if (remaining < bestRemaining) {
        bestRemaining = remaining;
        bestMove = { pileIndex: i, removeCount: piles[i]! - target };
      }
    }
  }
  return bestMove;
}

export function solveNim(state: NimState): Solution {
  const startTime = performance.now();
  const { piles } = state;
  const nimSum = computeNimSum(piles);
  const winningMove = findWinningMove(piles);
  const pValue = nimSum === 0 ? 0 : 1;
  const xorExpr = piles.join(' ^ ') + ' = ' + nimSum;

  const timeMs = Math.round(performance.now() - startTime);

  return {
    solvable: true,
    moves: winningMove ? [winningMove] : [],
    trace: {
      type: 'nim-xor',
      steps: [{
        description: `Nim-sum: ${xorExpr} → ${pValue === 0 ? 'P-position' : 'N-position'}`,
        data: { nimSum, piles: [...piles], pValue, winningMove },
      }],
      visualizationData: { nimSum, piles: [...piles], pValue, xorExpr },
    },
    stats: {
      nodesExplored: 1,
      timeMs,
      solutionLength: winningMove ? 1 : 0,
      solverName: 'Nim-sum (Bouton 1901)',
      terminated: 'solved',
    },
  };
}
