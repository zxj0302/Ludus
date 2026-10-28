import type { Difficulty, Solution } from '@ludus/core';
import type { NimState, NimMove } from './types';
import { computeNimSum, findWinningMove } from './solver';
import { computeNimDifficulty } from './difficulty';

export type { NimState, NimMove };

export function createInitialState(): NimState {
  return {
    piles: [1, 2, 3],
    currentPlayer: 0,
    initialPiles: [1, 2, 3],
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

  const mover: 0 | 1 = state.phase === 'choosing'
    ? (computeNimSum(piles) !== 0 ? 0 : 1)
    : state.currentPlayer;

  const newPiles = [...piles];
  newPiles[idx]! -= move.removeCount;

  return {
    piles: newPiles,
    currentPlayer: mover === 0 ? 1 : 0,
    initialPiles: state.initialPiles,
    phase: 'playing',
  };
}

export function isSolved(state: NimState): boolean {
  return state.piles.every(v => v === 0);
}

export function getDifficulty(state: NimState): Difficulty {
  const basePiles = state.initialPiles?.length ? state.initialPiles : state.piles;
  const pileCount = basePiles.length;
  const maxStones = Math.max(...basePiles);
  return computeNimDifficulty(pileCount, maxStones);
}

function simulateNimGame(
  piles: number[],
  playerStarts: boolean,
  startTime: number,
  nimSum: number,
): { moves: NimMove[]; traceSteps: { description: string; data: unknown }[]; playerMoveCount: number } {
  const moves: NimMove[] = [];
  const traceSteps: { description: string; data: unknown }[] = [];
  let isPlayerTurn = playerStarts;

  while (!piles.every(v => v === 0)) {
    if (isPlayerTurn) {
      const wm = findWinningMove(piles);
      if (!wm) break; // P-position — no guaranteed win
      moves.push(wm);
      piles[wm.pileIndex]! -= wm.removeCount;
      traceSteps.push({
        description: `Player takes ${wm.removeCount} from pile ${wm.pileIndex + 1}`,
        data: { pileIndex: wm.pileIndex, removeCount: wm.removeCount, remaining: [...piles] },
      });
      if (piles.every(v => v === 0)) break; // Player won
    } else {
      const aiWm = findWinningMove(piles);
      let aiMove: NimMove;
      if (aiWm) {
        aiMove = aiWm;
      } else {
        // P-position for AI — any move goes to N, just take 1 from first non-empty
        const nonEmpty = piles.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0);
        if (nonEmpty.length === 0) break;
        if (nonEmpty.length === 1) {
          const idx = nonEmpty[0]!;
          const take = piles[idx]! - 1;
          aiMove = { pileIndex: idx, removeCount: Math.max(1, take) };
        } else {
          aiMove = { pileIndex: nonEmpty[0]!, removeCount: 1 };
        }
      }
      moves.push(aiMove);
      piles[aiMove.pileIndex]! -= aiMove.removeCount;
      traceSteps.push({
        description: `AI takes ${aiMove.removeCount} from pile ${aiMove.pileIndex + 1}`,
        data: { pileIndex: aiMove.pileIndex, removeCount: aiMove.removeCount, remaining: [...piles] },
      });
    }
    isPlayerTurn = !isPlayerTurn;
  }

  const playerMoveCount = moves.filter((_, i) =>
    playerStarts ? i % 2 === 0 : i % 2 === 1,
  ).length;

  return { moves, traceSteps, playerMoveCount };
}

/**
 * 构建完整博弈序列（玩家+AI 交替）。
 * 选先后手阶段：N-position 玩家先手，P-position AI 先手。
 */
export function solveNimState(state: NimState): Solution {
  const startTime = performance.now();
  const nimSum = computeNimSum(state.piles);

  let playerStarts: boolean;
  if (state.phase === 'choosing') {
    // N-position → 先手必胜；P-position → 后手必胜（让 AI 先走）
    playerStarts = nimSum !== 0;
  } else if (state.phase === 'playing' && state.currentPlayer === 1) {
    // AI 的回合（不应常见，但作为防御）
    playerStarts = false;
  } else {
    playerStarts = true;
  }

  const { moves, traceSteps, playerMoveCount } = simulateNimGame(
    [...state.piles], playerStarts, startTime, nimSum,
  );

  const timeMs = Math.round(performance.now() - startTime);

  return {
    solvable: true,
    moves,
    trace: {
      type: 'nim-xor',
      steps: traceSteps,
      visualizationData: { nimSum, piles: [...state.piles], pValue: nimSum === 0 ? 0 : 1, xorExpr: state.piles.join(' ^ ') + ' = ' + nimSum, playerStarts },
    },
    stats: {
      nodesExplored: playerMoveCount,
      timeMs,
      solutionLength: playerMoveCount,
      solverName: 'Nim-sum (Bouton 1901) — optimal play sequence',
      terminated: moves.length > 0 ? 'solved' : 'exhausted',
    },
  };
}
