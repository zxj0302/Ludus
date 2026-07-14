// Web Worker — 在独立线程中运行求解/生成任务，避免阻塞 UI
// ⚠️ 直接从 solver 源文件 import，绕过 barrel(index.ts) —— barrel 引用了 React/framer-motion 等浏览器依赖，Worker 环境无 window
import { solveGF2, buildLightsOutMatrix, optimalSolution } from '@ludus/games/src/lights-out/solver';
import { solveFifteen } from '@ludus/games/src/fifteen/solver';
import { solveSokobanBFS } from '@ludus/games/src/sokoban/solver';
import { solvePegSolitaire } from '@ludus/games/src/peg-solitaire/solver';
import {
  chooseThiefSiegeAiMove,
  solveThiefSiege,
} from '@ludus/games/src/thief-siege/solver';
import type { ThiefSiegeState } from '@ludus/games/src/thief-siege/types';
import type { AiMoveTaskPayload, WorkerRequest, WorkerResponse } from '@ludus/core';

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = e.data;

  try {
    if (type === 'solve') {
      const { gameId, state } = payload as { gameId: string; state: Record<string, unknown> };

      if (gameId === 'lights-out') {
        const t0 = performance.now();
        const n = state.n as number;
        const grid = state.grid as number[];
        const A = buildLightsOutMatrix(n);
        const sol = solveGF2(A, grid);
        const optimal = optimalSolution(sol);
        const elapsed = Math.round(performance.now() - t0);

        const moves: { row: number; col: number }[] = [];
        if (optimal) {
          for (let i = 0; i < optimal.length; i++) {
            if (optimal[i] === 1) {
              moves.push({ row: Math.floor(i / n), col: i % n });
            }
          }
        }

        const response: WorkerResponse = {
          id,
          type: 'solve',
          result: {
            solvable: sol.particular !== null,
            moves,
            stats: {
              nodesExplored: 1,
              timeMs: elapsed,
              solutionLength: moves.length,
              solverName: 'GF(2) Gaussian Elimination (Worker)',
            },
            trace: {
              type: 'matrix-transform',
              steps: [
                {
                  description: `GF(2) elimination complete — ${n}×${n}, rank=${sol.rank}, nullity=${sol.nullity}`,
                  data: { rank: sol.rank, nullity: sol.nullity },
                },
              ],
              visualizationData: {
                rank: sol.rank,
                nullity: sol.nullity,
                solution: optimal,
              },
            },
          },
        };

        self.postMessage(response);
      } else if (gameId === 'fifteen') {
        try {
          const solution = solveFifteen({
            grid: state.grid as number[],
          });
          self.postMessage({ id, type: 'solve', result: solution });
        } catch (err) {
          self.postMessage({
            id,
            type,
            error: err instanceof Error ? err.message : 'Unknown Worker error in fifteen solver',
          });
        }
      } else if (gameId === 'sokoban') {
        try {
          const solution = solveSokobanBFS(state as unknown as import('@ludus/games/src/sokoban/types').SokobanState);
          self.postMessage({ id, type: 'solve', result: solution });
        } catch (err) {
          self.postMessage({
            id,
            type,
            error: err instanceof Error ? err.message : 'Unknown Worker error in sokoban solver',
          });
        }
      } else if (gameId === 'peg-solitaire') {
        try {
          const solution = solvePegSolitaire(state as unknown as import('@ludus/games/src/peg-solitaire/types').PegSolitaireState);
          self.postMessage({ id, type: 'solve', result: solution });
        } catch (err) {
          self.postMessage({
            id,
            type,
            error: err instanceof Error ? err.message : 'Unknown Worker error in peg-solitaire solver',
          });
        }
      } else if (gameId === 'thief-siege') {
        try {
          const solution = solveThiefSiege(state as unknown as ThiefSiegeState);
          self.postMessage({ id, type: 'solve', result: solution });
        } catch (err) {
          self.postMessage({
            id,
            type,
            error: err instanceof Error ? err.message : 'Unknown Worker error in thief-siege solver',
          });
        }
      } else {
        self.postMessage({ id, type, error: `Unknown game: ${gameId}` });
      }
    } else if (type === 'generate') {
      self.postMessage({ id, type, error: 'Generation in Worker not yet implemented' });
    } else if (type === 'ai-move') {
      const { gameId, state, budget } = payload as AiMoveTaskPayload;
      if (gameId !== 'thief-siege') {
        self.postMessage({ id, type, error: `AI Worker not implemented for game: ${gameId}` });
        return;
      }

      const thiefState = state as unknown as ThiefSiegeState;
      self.postMessage({
        id,
        type,
        result: chooseThiefSiegeAiMove(thiefState, budget),
      });
    } else {
      self.postMessage({ id, type, error: `Unknown task type: ${type}` });
    }
  } catch (err) {
    self.postMessage({
      id,
      type,
      error: err instanceof Error ? err.message : 'Unknown Worker error',
    });
  }
};
