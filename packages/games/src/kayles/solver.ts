import type { Solution } from '@ludus/core';
import { chainLengths, isTerminalAlive } from './rules';
import type { KaylesMove, KaylesState } from './types';

/** OEIS A002186 prefix (n = 0..12) for regression tests. */
export const KAYLES_A002186_PREFIX = [
  0, 1, 2, 3, 1, 4, 3, 2, 1, 4, 2, 6, 4,
] as const;

const kaylesMemo = new Map<number, number>();

function mex(values: Iterable<number>): number {
  const seen = new Set(values);
  let m = 0;
  while (seen.has(m)) m += 1;
  return m;
}

/**
 * Sprague–Grundy value of a single Kayles chain of length `n`.
 * Moves: remove 1 pin or 2 adjacent pins, splitting into left/right chains.
 */
export function computeKaylesGrundy(n: number): number {
  if (n < 0) return 0;
  if (kaylesMemo.has(n)) return kaylesMemo.get(n)!;
  if (n === 0) {
    kaylesMemo.set(0, 0);
    return 0;
  }

  const options = new Set<number>();
  // Knock 1 at position i → left i, right n-1-i
  for (let i = 0; i < n; i += 1) {
    options.add(computeKaylesGrundy(i) ^ computeKaylesGrundy(n - 1 - i));
  }
  // Knock 2 at i,i+1 → left i, right n-2-i
  for (let i = 0; i <= n - 2; i += 1) {
    options.add(computeKaylesGrundy(i) ^ computeKaylesGrundy(n - 2 - i));
  }

  const value = mex(options);
  kaylesMemo.set(n, value);
  return value;
}

export function chainXor(alive: boolean[]): number {
  return chainLengths(alive).reduce((acc, len) => acc ^ computeKaylesGrundy(len), 0);
}

export function isKaylesPPosition(alive: boolean[]): boolean {
  if (isTerminalAlive(alive)) return true;
  return chainXor(alive) === 0;
}

function applyKnock(alive: boolean[], move: KaylesMove): boolean[] | null {
  if (move.count !== 1 && move.count !== 2) return null;
  if (move.index < 0 || move.index >= alive.length) return null;
  if (!alive[move.index]) return null;
  if (move.count === 2) {
    if (move.index + 1 >= alive.length || !alive[move.index + 1]) return null;
  }
  const next = [...alive];
  next[move.index] = false;
  if (move.count === 2) next[move.index + 1] = false;
  return next;
}

export function findKaylesWinningMove(alive: boolean[]): KaylesMove | null {
  if (isTerminalAlive(alive) || chainXor(alive) === 0) return null;

  for (let i = 0; i < alive.length; i += 1) {
    if (!alive[i]) continue;
    const next1 = applyKnock(alive, { index: i, count: 1 });
    if (next1 && chainXor(next1) === 0) return { index: i, count: 1 };
  }
  for (let i = 0; i < alive.length - 1; i += 1) {
    if (!alive[i] || !alive[i + 1]) continue;
    const next2 = applyKnock(alive, { index: i, count: 2 });
    if (next2 && chainXor(next2) === 0) return { index: i, count: 2 };
  }
  return null;
}

function pickFallbackMove(alive: boolean[]): KaylesMove | null {
  for (let i = 0; i < alive.length; i += 1) {
    if (alive[i]) return { index: i, count: 1 };
  }
  return null;
}

function resolvePlayerStarts(state: KaylesState, alive: boolean[]): boolean {
  if (state.phase === 'choosing') {
    return chainXor(alive) !== 0;
  }
  if (state.phase === 'playing' && state.currentPlayer === 1) {
    return false;
  }
  return true;
}

/**
 * Nim-style simulation: human only plays winning moves (stop on P);
 * AI uses winning move else fallback.
 */
function simulateKayles(
  startAlive: boolean[],
  playerStarts: boolean,
): { moves: KaylesMove[]; traceSteps: { description: string; data: unknown }[]; playerMoveCount: number } {
  const moves: KaylesMove[] = [];
  const traceSteps: { description: string; data: unknown }[] = [];
  let alive = [...startAlive];
  let isPlayerTurn = playerStarts;

  while (!isTerminalAlive(alive)) {
    let move: KaylesMove | null;
    if (isPlayerTurn) {
      move = findKaylesWinningMove(alive);
      if (!move) break;
    } else {
      move = findKaylesWinningMove(alive) ?? pickFallbackMove(alive);
      if (!move) break;
    }

    const who = isPlayerTurn ? 'Player' : 'AI';
    const next = applyKnock(alive, move);
    if (!next) break;
    alive = next;
    moves.push(move);
    const xor = chainXor(alive);
    const lengths = chainLengths(alive);
    traceSteps.push({
      description: `${who} knocks ${move.count} at ${move.index} → chains [${lengths.join(',')}], xor=${xor}`,
      data: { move, alive: [...alive], lengths, xor },
    });
    isPlayerTurn = !isPlayerTurn;
  }

  const playerMoveCount = moves.filter((_, i) =>
    playerStarts ? i % 2 === 0 : i % 2 === 1,
  ).length;

  return { moves, traceSteps, playerMoveCount };
}

export function solveKayles(state: KaylesState): Solution {
  const startedAt = performance.now();
  const alive = [...state.alive];
  const lengths = chainLengths(alive);
  const nimbers = lengths.map(computeKaylesGrundy);
  const xor = chainXor(alive);
  const playerStarts = resolvePlayerStarts(state, alive);
  const winningMove = findKaylesWinningMove(alive);
  const pValue = xor === 0 ? 0 : 1;

  const { moves, traceSteps, playerMoveCount } = simulateKayles(alive, playerStarts);
  const timeMs = Math.round(performance.now() - startedAt);

  const analysisStep = {
    description: pValue === 0
      ? `P-position: chains [${lengths.join(',')}] nimbers [${nimbers.join(',')}] XOR = 0`
      : `N-position: chains [${lengths.join(',')}] nimbers [${nimbers.join(',')}] XOR = ${xor}`,
    data: { alive: [...alive], lengths, nimbers, xor, pValue, winningMove },
  };

  return {
    solvable: true,
    moves,
    trace: {
      type: 'kayles-mex',
      steps: [analysisStep, ...traceSteps],
      visualizationData: {
        alive: [...alive],
        lengths,
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
      solverName: "Sprague–Grundy (Kayles)",
      terminated: moves.length > 0 ? 'solved' : 'exhausted',
    },
  };
}
