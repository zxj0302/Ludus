import type { Solution } from '@ludus/core';
import { isTerminalPiles, legalSplits } from './rules';
import type { GrundysGameMove, GrundysGameState } from './types';

/** OEIS A002188 prefix (n = 0..20) for regression tests. */
export const GRUNDY_A002188_PREFIX = [
  0, 0, 0, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 3, 2, 1, 3, 2, 4, 3, 0,
] as const;

const grundyMemo = new Map<number, number>();

function mex(values: Iterable<number>): number {
  const seen = new Set(values);
  let m = 0;
  while (seen.has(m)) m += 1;
  return m;
}

/**
 * Sprague–Grundy value of a single heap of size `n`.
 * g(n) = mex { g(a) ⊕ g(b) | a+b=n, a≠b, a,b≥1 }
 */
export function computeGrundy(n: number): number {
  if (n < 0) return 0;
  if (grundyMemo.has(n)) return grundyMemo.get(n)!;

  if (n <= 2) {
    grundyMemo.set(n, 0);
    return 0;
  }

  const options = new Set<number>();
  for (const left of legalSplits(n)) {
    options.add(computeGrundy(left) ^ computeGrundy(n - left));
  }
  const value = mex(options);
  grundyMemo.set(n, value);
  return value;
}

export function pileNimbers(piles: number[]): number[] {
  return piles.map(computeGrundy);
}

export function computeGrundyXor(piles: number[]): number {
  return pileNimbers(piles).reduce((a, b) => a ^ b, 0);
}

export function isPPosition(piles: number[]): boolean {
  if (isTerminalPiles(piles)) return true;
  return computeGrundyXor(piles) === 0;
}

function applySplit(piles: number[], move: GrundysGameMove): number[] | null {
  const n = piles[move.pileIndex];
  if (n == null || !legalSplits(n).includes(move.left)) return null;
  const right = move.right ?? n - move.left;
  if (right !== n - move.left) return null;
  return [
    ...piles.slice(0, move.pileIndex),
    move.left,
    right,
    ...piles.slice(move.pileIndex + 1),
  ];
}

export function findWinningMove(piles: number[]): GrundysGameMove | null {
  if (isTerminalPiles(piles) || computeGrundyXor(piles) === 0) return null;

  for (let pileIndex = 0; pileIndex < piles.length; pileIndex += 1) {
    const n = piles[pileIndex]!;
    for (const left of legalSplits(n)) {
      const next = applySplit(piles, { pileIndex, left, right: n - left });
      if (next && computeGrundyXor(next) === 0) {
        return { pileIndex, left, right: n - left };
      }
    }
  }
  return null;
}

function pickFallbackMove(piles: number[]): GrundysGameMove | null {
  for (let pileIndex = 0; pileIndex < piles.length; pileIndex += 1) {
    const n = piles[pileIndex]!;
    const splits = legalSplits(n);
    if (splits.length > 0) {
      const left = splits[0]!;
      return { pileIndex, left, right: n - left };
    }
  }
  return null;
}

function resolvePlayerStarts(state: GrundysGameState, piles: number[]): boolean {
  if (state.phase === 'choosing') {
    return computeGrundyXor(piles) !== 0;
  }
  if (state.phase === 'playing' && state.currentPlayer === 1) {
    return false;
  }
  return true;
}

/**
 * Build an optimal-play sequence (Nim-style):
 * - Human turn: only emit a winning move; stop on P (Hint → noWinningMove).
 * - AI turn: winning move, else any legal fallback (so Solve can show how the second player wins).
 */
function simulateGrundysGame(
  startPiles: number[],
  playerStarts: boolean,
): { moves: GrundysGameMove[]; traceSteps: { description: string; data: unknown }[]; playerMoveCount: number } {
  const moves: GrundysGameMove[] = [];
  const traceSteps: { description: string; data: unknown }[] = [];
  let piles = [...startPiles];
  let isPlayerTurn = playerStarts;

  while (!isTerminalPiles(piles)) {
    let move: GrundysGameMove | null;
    if (isPlayerTurn) {
      move = findWinningMove(piles);
      if (!move) break; // P-position — no guaranteed win for the human
    } else {
      move = findWinningMove(piles) ?? pickFallbackMove(piles);
      if (!move) break;
    }

    const who = isPlayerTurn ? 'Player' : 'AI';
    const n = piles[move.pileIndex]!;
    const next = applySplit(piles, move);
    if (!next) break;

    piles = next;
    moves.push(move);
    const xor = computeGrundyXor(piles);
    traceSteps.push({
      description: `${who} splits pile ${move.pileIndex}: ${n} → ${move.left}+${n - move.left} → [${piles.join(',')}], xor=${xor}`,
      data: { move, piles: [...piles], xor, nimbers: pileNimbers(piles) },
    });
    isPlayerTurn = !isPlayerTurn;
  }

  const playerMoveCount = moves.filter((_, i) =>
    playerStarts ? i % 2 === 0 : i % 2 === 1,
  ).length;

  return { moves, traceSteps, playerMoveCount };
}

export function solveGrundysGame(state: GrundysGameState): Solution {
  const startedAt = performance.now();
  const piles = [...state.piles];
  const nimbers = pileNimbers(piles);
  const xor = computeGrundyXor(piles);
  const playerStarts = resolvePlayerStarts(state, piles);
  const winningMove = findWinningMove(piles);
  const pValue = xor === 0 ? 0 : 1;

  const { moves, traceSteps, playerMoveCount } = simulateGrundysGame(piles, playerStarts);
  const timeMs = Math.round(performance.now() - startedAt);

  const analysisStep = {
    description: pValue === 0
      ? `P-position: nimbers [${nimbers.join(',')}] XOR = 0`
      : `N-position: nimbers [${nimbers.join(',')}] XOR = ${xor}`,
    data: { piles: [...piles], nimbers, xor, pValue, winningMove },
  };

  return {
    solvable: true,
    moves,
    trace: {
      type: 'grundy-mex',
      steps: [analysisStep, ...traceSteps],
      visualizationData: {
        piles: [...piles],
        nimbers,
        xor,
        pValue,
        playerStarts,
        winningMove,
      },
    },
    stats: {
      nodesExplored: playerMoveCount,
      timeMs,
      solutionLength: playerMoveCount,
      solverName: 'Sprague–Grundy (Grundy\'s Game)',
      terminated: moves.length > 0 ? 'solved' : 'exhausted',
    },
  };
}
