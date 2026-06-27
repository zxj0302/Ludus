// Web Worker — 在独立线程中运行求解/生成任务，避免阻塞 UI
import { solveGF2, buildLightsOutMatrix, optimalSolution, hammingWeight } from '@ludus/games';
import type { WorkerRequest, WorkerResponse } from '@ludus/core';

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
      } else {
        self.postMessage({ id, type, error: `Unknown game: ${gameId}` });
      }
    } else if (type === 'generate') {
      self.postMessage({ id, type, error: 'Generation in Worker not yet implemented' });
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
