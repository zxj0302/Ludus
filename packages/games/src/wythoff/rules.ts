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

function applyWythoffMoveToPiles(piles: [number, number], move: WythoffMove): void {
  if (move.type === 'single') {
    piles[move.pileIndex!]! -= move.removeCount;
  } else {
    piles[0]! -= move.removeCount;
    piles[1]! -= move.removeCount;
  }
}

function describeWythoffMove(move: WythoffMove): string {
  if (move.type === 'single') {
    return `Player takes ${move.removeCount} from pile ${move.pileIndex! + 1}`;
  }
  return `Player takes ${move.removeCount} from both piles`;
}

function describeAIWythoffMove(move: WythoffMove): string {
  if (move.type === 'single') {
    return `AI takes ${move.removeCount} from pile ${move.pileIndex! + 1}`;
  }
  return `AI takes ${move.removeCount} from both piles`;
}

function simulateWythoffGame(
  piles: [number, number],
  playerStarts: boolean,
  state: WythoffState,
): { moves: WythoffMove[]; traceSteps: { description: string; data: unknown }[]; playerMoveCount: number } {
  const moves: WythoffMove[] = [];
  const traceSteps: { description: string; data: unknown }[] = [];
  let isPlayerTurn = playerStarts;
  let playerMoveCount = 0;

  while (!(piles[0] === 0 && piles[1] === 0)) {
    const wm = findWythoffWinningMove({ ...state, piles });

    if (isPlayerTurn) {
      if (!wm) break; // P-position — no guaranteed win
      moves.push(wm);
      playerMoveCount++;
      applyWythoffMoveToPiles(piles, wm);
      traceSteps.push({
        description: describeWythoffMove(wm),
        data: { ...wm, remaining: [...piles] },
      });
      if (piles[0] === 0 && piles[1] === 0) break;
    } else {
      // AI's turn: try winning move first
      let aiMove: WythoffMove;
      if (wm) {
        aiMove = wm;
      } else {
        // P-position: any move, take 1 from larger pile
        if (piles[0]! >= piles[1]! && piles[0]! > 0) {
          aiMove = { type: 'single', pileIndex: 0, removeCount: 1 };
        } else if (piles[1]! > 0) {
          aiMove = { type: 'single', pileIndex: 1, removeCount: 1 };
        } else {
          break;
        }
      }
      moves.push(aiMove);
      applyWythoffMoveToPiles(piles, aiMove);
      traceSteps.push({
        description: describeAIWythoffMove(aiMove),
        data: { ...aiMove, remaining: [...piles] },
      });
    }
    isPlayerTurn = !isPlayerTurn;
  }

  return { moves, traceSteps, playerMoveCount };
}

/**
 * 构建完整博弈序列（玩家+AI 交替）。
 * 选先后手阶段：N-position 玩家先手，P-position AI 先手。
 */
export function solveWythoffState(state: WythoffState): Solution {
  const startTime = performance.now();
  const [a, b] = state.piles;
  const isP = isWythoffPPosition(a, b);

  let playerStarts: boolean;
  if (state.phase === 'choosing') {
    // N-position → 先手必胜；P-position → 后手必胜（让 AI 先走）
    playerStarts = !isP;
  } else if (state.phase === 'playing' && state.currentPlayer === 1) {
    playerStarts = false;
  } else {
    playerStarts = true;
  }

  const { moves, traceSteps, playerMoveCount } = simulateWythoffGame(
    [a, b] as [number, number], playerStarts, state,
  );

  const k = Math.abs(b - a);
  const timeMs = Math.round(performance.now() - startTime);

  return {
    solvable: true,
    moves,
    trace: {
      type: 'wythoff-beatty',
      steps: traceSteps,
      visualizationData: { piles: [a, b], isP, k, phi: (1 + Math.sqrt(5)) / 2, playerStarts },
    },
    stats: {
      nodesExplored: playerMoveCount,
      timeMs,
      solutionLength: playerMoveCount,
      solverName: "Wythoff's Beatty sequence (1907) — optimal play sequence",
      terminated: moves.length > 0 ? 'solved' : 'exhausted',
    },
  };
}
