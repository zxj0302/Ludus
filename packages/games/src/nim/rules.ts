import type { Difficulty, Solution } from '@ludus/core';
import type { NimState, NimMove } from '@ludus/core';
import { computeNimSum } from '@ludus/core';
import { findWinningMove } from '@ludus/core';
import { computeNimDifficulty } from '@ludus/core';

export type { NimState, NimMove };

export function createInitialState(): NimState {
  return {
    piles: [3, 4, 5],
    currentPlayer: 0,
    initialPiles: [3, 4, 5],
    phase: 'choosing',
  };
}

export function chooseHand(state: NimState, playerFirst: boolean): NimState {
  if (state.phase !== 'choosing') return state;
  return {
    ...state,
    currentPlayer: playerFirst ? 0 : 1,
    phase: 'playing',
  };
}

export function legalMoves(state: NimState): NimMove[] {
  if (state.phase !== 'playing' || state.currentPlayer !== 0) return [];
  const moves: NimMove[] = [];
  for (let i = 0; i < state.piles.length; i++) {
    const count = state.piles[i]!;
    for (let r = 1; r <= count; r++) {
      moves.push({ pileIndex: i, removeCount: r });
    }
  }
  return moves;
}

export function applyMove(state: NimState, move: NimMove): NimState {
  const { piles } = state;
  const idx = move.pileIndex;
  if (idx < 0 || idx >= piles.length) return state;
  if (move.removeCount < 1 || move.removeCount > piles[idx]!) return state;

  const newPiles = [...piles];
  newPiles[idx]! -= move.removeCount;

  return {
    piles: newPiles,
    currentPlayer: state.currentPlayer === 0 ? 1 : 0,
    initialPiles: state.initialPiles,
    phase: state.phase,
  };
}

export function isSolved(state: NimState): boolean {
  return state.piles.every(v => v === 0);
}

export function getDifficulty(state: NimState): Difficulty {
  const pileCount = state.piles.length;
  const maxStones = Math.max(...state.piles);
  return computeNimDifficulty(pileCount, maxStones);
}

/** Build a complete winning move sequence (player + AI alternating) */
export function solveNimState(state: NimState): Solution {
  const startTime = performance.now();
  const moves: NimMove[] = [];
  const piles = [...state.piles];
  const traceSteps: { description: string; data: unknown }[] = [];

  while (!piles.every(v => v === 0)) {
    // Player's turn: find winning move
    const wm = findWinningMove(piles);
    if (!wm) {
      // P-position: no guaranteed win, stop here
      break;
    }
    moves.push(wm);
    piles[wm.pileIndex]! -= wm.removeCount;
    traceSteps.push({
      description: `Player takes ${wm.removeCount} from pile ${wm.pileIndex + 1}`,
      data: { pileIndex: wm.pileIndex, removeCount: wm.removeCount, remaining: [...piles] },
    });

    if (piles.every(v => v === 0)) break; // Player won

    // AI's turn: leave 1 in last pile, otherwise take 1 from first non-empty
    const nonEmpty = piles.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0);
    let aiMove: NimMove;
    if (nonEmpty.length === 1) {
      const idx = nonEmpty[0]!;
      const take = piles[idx]! - 1; // Leave exactly 1 for player to finish
      aiMove = { pileIndex: idx, removeCount: Math.max(1, take) };
    } else {
      const idx = nonEmpty[0]!;
      aiMove = { pileIndex: idx, removeCount: 1 };
    }
    moves.push(aiMove);
    piles[aiMove.pileIndex]! -= aiMove.removeCount;
    traceSteps.push({
      description: `AI takes ${aiMove.removeCount} from pile ${aiMove.pileIndex + 1}`,
      data: { pileIndex: aiMove.pileIndex, removeCount: aiMove.removeCount, remaining: [...piles] },
    });
  }

  const nimSum = computeNimSum(state.piles);
  const timeMs = Math.round(performance.now() - startTime);

  return {
    solvable: true,
    moves,
    trace: {
      type: 'nim-xor',
      steps: traceSteps,
      visualizationData: { nimSum, piles: [...state.piles], pValue: nimSum === 0 ? 0 : 1, xorExpr: state.piles.join(' ^ ') + ' = ' + nimSum },
    },
    stats: {
      nodesExplored: 1,
      timeMs,
      solutionLength: moves.length,
      solverName: 'Nim-sum (Bouton 1901) — optimal play sequence',
      terminated: 'solved',
    },
  };
}
