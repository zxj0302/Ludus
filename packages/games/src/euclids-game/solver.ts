import type { Solution } from '@ludus/core';
import type { EuclidPiles, EuclidsGameMove, EuclidsGameState } from './types';
import { applyMultiple, isTerminalPiles, legalMultiples, normalizePiles } from './rules';

/** Golden ratio φ = (1 + √5) / 2 */
export const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * P-position: current player loses with perfect play.
 * For a > b > 0: ⌊b·φ⌋ ≥ a and a < φ·b (see spec / cut-the-knot).
 * Equal piles are N-positions (take all immediately).
 */
export function isPPosition(piles: EuclidPiles): boolean {
  const [larger, smaller] = normalizePiles(piles[0], piles[1]);
  if (isTerminalPiles([larger, smaller]) || smaller <= 0) return false;
  if (larger === smaller) return false;
  const floorBound = Math.floor(smaller * PHI);
  return larger <= floorBound && larger < PHI * smaller;
}

export function findWinningMove(piles: EuclidPiles): EuclidsGameMove | null {
  const [larger, smaller] = normalizePiles(piles[0], piles[1]);
  if (isTerminalPiles([larger, smaller]) || smaller <= 0) return null;
  if (isPPosition([larger, smaller])) return null;

  for (const multiple of legalMultiples([larger, smaller])) {
    const result = applyMultiple([larger, smaller], multiple);
    if (result === 'win') return { multiple };
    if (isPPosition(result)) return { multiple };
  }

  return null;
}

function pickFallbackMove(piles: EuclidPiles): EuclidsGameMove | null {
  const multiples = legalMultiples(piles);
  if (multiples.length === 0) return null;
  return { multiple: multiples[0]! };
}

function describePosition(piles: EuclidPiles): string {
  const [a, b] = normalizePiles(piles[0], piles[1]);
  const floorBound = Math.floor(b * PHI);
  if (isPPosition(piles)) {
    return `P-position: ${a} ≤ ⌊${b}·φ⌋=${floorBound} and ${a} < ${(PHI * b).toFixed(3)}`;
  }
  return `N-position: ${a} > ⌊${b}·φ⌋=${floorBound} or ${a} ≥ ${(PHI * b).toFixed(3)}`;
}

function simulateEuclidsGame(
  startPiles: EuclidPiles,
  playerStarts: boolean,
): { moves: EuclidsGameMove[]; traceSteps: { description: string; data: unknown }[]; playerMoveCount: number } {
  const moves: EuclidsGameMove[] = [];
  const traceSteps: { description: string; data: unknown }[] = [];
  let piles = normalizePiles(startPiles[0], startPiles[1]);
  let isPlayerTurn = playerStarts;

  while (!isTerminalPiles(piles)) {
    const wm = findWinningMove(piles);
    const move = isPlayerTurn ? wm : (wm ?? pickFallbackMove(piles));
    if (!move) break;

    const who = isPlayerTurn ? 'Player' : 'AI';
    const result = applyMultiple(piles, move.multiple);
    if (result === 'win') {
      moves.push(move);
      traceSteps.push({
        description: `${who} takes ${move.multiple}× → win`,
        data: { multiple: move.multiple, piles: [0, piles[1]], won: true },
      });
      break;
    }

    piles = result;
    moves.push(move);
    traceSteps.push({
      description: `${who} takes ${move.multiple}× → [${piles[0]}, ${piles[1]}]`,
      data: { multiple: move.multiple, piles: [...piles] },
    });
    isPlayerTurn = !isPlayerTurn;
  }

  const playerMoveCount = moves.filter((_, i) =>
    playerStarts ? i % 2 === 0 : i % 2 === 1,
  ).length;

  return { moves, traceSteps, playerMoveCount };
}

function resolvePlayerStarts(state: EuclidsGameState, piles: EuclidPiles): boolean {
  if (state.phase === 'choosing') {
    return !isPPosition(piles);
  }
  if (state.phase === 'playing' && state.currentPlayer === 1) {
    return false;
  }
  return true;
}

/** Brute-force P/N check for tests (memoized minimax). */
export function isPPositionBrute(piles: EuclidPiles, memo = new Map<string, boolean>()): boolean {
  const key = `${piles[0]},${piles[1]}`;
  if (memo.has(key)) return memo.get(key)!;

  const [larger, smaller] = normalizePiles(piles[0], piles[1]);
  if (isTerminalPiles([larger, smaller]) || smaller <= 0) {
    memo.set(key, false);
    return false;
  }

  for (const k of legalMultiples([larger, smaller])) {
    const next = applyMultiple([larger, smaller], k);
    if (next === 'win') {
      memo.set(key, false);
      return false;
    }
    if (isPPositionBrute(next, memo)) {
      memo.set(key, false);
      return false;
    }
  }

  memo.set(key, true);
  return true;
}

export function solveEuclidsGame(state: EuclidsGameState): Solution {
  const startedAt = performance.now();
  const piles = normalizePiles(state.piles[0], state.piles[1]);
  const playerStarts = resolvePlayerStarts(state, piles);
  const winningMove = findWinningMove(piles);
  const pValue = isPPosition(piles) ? 0 : 1;

  const { moves, traceSteps, playerMoveCount } = simulateEuclidsGame(piles, playerStarts);
  const solvable = moves.length > 0 && playerMoveCount > 0;

  const timeMs = Math.round(performance.now() - startedAt);

  const analysisStep = {
    description: describePosition(piles),
    data: {
      piles: [...piles],
      phi: PHI,
      threshold: PHI * piles[1]!,
      floorBound: Math.floor(piles[1]! * PHI),
      pValue,
      winningMove,
    },
  };

  return {
    solvable,
    moves,
    trace: {
      type: 'euclid-phi',
      steps: [analysisStep, ...traceSteps],
      visualizationData: {
        piles: [...piles],
        phi: PHI,
        pValue,
        playerStarts,
        winningMove,
      },
    },
    stats: {
      nodesExplored: playerMoveCount,
      timeMs,
      solutionLength: playerMoveCount,
      solverName: 'Euclid φ criterion — optimal play sequence',
      terminated: solvable ? 'solved' : 'exhausted',
    },
  };
}
