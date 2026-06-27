import type { Difficulty, Solution } from '@ludus/core';
import type { WythoffState, WythoffMove } from './types';
import { isWythoffPPosition, findWythoffWinningMove } from './solver';
import { computeWythoffDifficulty } from './difficulty';

export type { WythoffState, WythoffMove };

export function createInitialState(): WythoffState {
  return {
    piles: [1, 2],
    currentPlayer: 0,
    initialPiles: [1, 2],
    phase: 'choosing',
  };
}

export function chooseHand(state: WythoffState, playerFirst: boolean): WythoffState {
  if (state.phase !== 'choosing') return state;
  return {
    ...state,
    currentPlayer: playerFirst ? 0 : 1,
    phase: 'playing',
  };
}

export function legalMoves(state: WythoffState): WythoffMove[] {
  if (state.phase !== 'playing' || state.currentPlayer !== 0) return [];
  const moves: WythoffMove[] = [];
  const [a, b] = state.piles;

  // Single-pile moves
  for (let i = 0; i < 2; i++) {
    const count = state.piles[i]!;
    for (let r = 1; r <= count; r++) {
      moves.push({ type: 'single', pileIndex: i, removeCount: r });
    }
  }

  // Both-pile moves
  const maxBoth = Math.min(a, b);
  for (let r = 1; r <= maxBoth; r++) {
    moves.push({ type: 'both', removeCount: r });
  }

  return moves;
}

export function applyMove(state: WythoffState, move: WythoffMove): WythoffState {
  const newPiles: [number, number] = [...state.piles];
  if (move.type === 'single') {
    const idx = move.pileIndex ?? 0;
    if (idx < 0 || idx >= 2) return state;
    if (move.removeCount < 1 || move.removeCount > newPiles[idx]!) return state;
    newPiles[idx]! -= move.removeCount;
  } else {
    if (move.removeCount < 1 || move.removeCount > Math.min(newPiles[0]!, newPiles[1]!)) return state;
    newPiles[0]! -= move.removeCount;
    newPiles[1]! -= move.removeCount;
  }

  return {
    piles: newPiles,
    currentPlayer: state.currentPlayer === 0 ? 1 : 0,
    initialPiles: state.initialPiles,
    phase: state.phase,
  };
}

export function isSolved(state: WythoffState): boolean {
  return state.piles[0] === 0 && state.piles[1] === 0;
}

export function getDifficulty(state: WythoffState): Difficulty {
  const maxStone = Math.max(...state.piles);
  return computeWythoffDifficulty(maxStone);
}

/** Build a complete winning move sequence (player + AI alternating) */
export function solveWythoffState(state: WythoffState): Solution {
  const startTime = performance.now();
  const moves: WythoffMove[] = [];
  const piles: [number, number] = [...state.piles];
  const traceSteps: { description: string; data: unknown }[] = [];
  let playerMovesCount = 0;

  while (!(piles[0] === 0 && piles[1] === 0)) {
    // Player's turn: find winning move
    const wm = findWythoffWinningMove({ ...state, piles });
    if (!wm) {
      // P-position: no guaranteed win, stop
      break;
    }
    moves.push(wm);
    playerMovesCount++;
    if (wm.type === 'single') {
      const idx = wm.pileIndex!;
      piles[idx]! -= wm.removeCount;
      traceSteps.push({
        description: `Player takes ${wm.removeCount} from pile ${idx + 1}`,
        data: { type: 'single', pileIndex: idx, removeCount: wm.removeCount, remaining: [...piles] },
      });
    } else {
      piles[0]! -= wm.removeCount;
      piles[1]! -= wm.removeCount;
      traceSteps.push({
        description: `Player takes ${wm.removeCount} from both piles`,
        data: { type: 'both', removeCount: wm.removeCount, remaining: [...piles] },
      });
    }

    if (piles[0] === 0 && piles[1] === 0) break; // Player won

    // AI's turn: try winning move first, otherwise take 1 from the larger pile
    const aiWm = findWythoffWinningMove({ ...state, piles });
    let aiMove: WythoffMove;
    if (aiWm) {
      aiMove = aiWm;
    } else {
      // P-position: any move goes to N, pick the one that leaves most stones
      if (piles[0]! >= piles[1]! && piles[0]! > 0) {
        aiMove = { type: 'single', pileIndex: 0, removeCount: 1 };
      } else if (piles[1]! > 0) {
        aiMove = { type: 'single', pileIndex: 1, removeCount: 1 };
      } else {
        break;
      }
    }
    moves.push(aiMove);
    if (aiMove.type === 'single') {
      piles[aiMove.pileIndex!]! -= aiMove.removeCount;
      traceSteps.push({
        description: `AI takes ${aiMove.removeCount} from pile ${aiMove.pileIndex! + 1}`,
        data: { type: 'single', pileIndex: aiMove.pileIndex!, removeCount: aiMove.removeCount, remaining: [...piles] },
      });
    } else {
      piles[0]! -= aiMove.removeCount;
      piles[1]! -= aiMove.removeCount;
      traceSteps.push({
        description: `AI takes ${aiMove.removeCount} from both piles`,
        data: { type: 'both', removeCount: aiMove.removeCount, remaining: [...piles] },
      });
    }
  }

  const [a, b] = state.piles;
  const isP = isWythoffPPosition(a, b);
  const k = Math.abs(b - a);
  const timeMs = Math.round(performance.now() - startTime);

  return {
    solvable: true,
    moves,
    trace: {
      type: 'wythoff-beatty',
      steps: traceSteps,
      visualizationData: { piles: [a, b], isP, k, phi: (1 + Math.sqrt(5)) / 2 },
    },
    stats: {
      nodesExplored: playerMovesCount,
      timeMs,
      solutionLength: playerMovesCount,
      solverName: "Wythoff's Beatty sequence (1907) — optimal play sequence",
      terminated: moves.length > 0 ? 'solved' : 'exhausted',
    },
  };
}
