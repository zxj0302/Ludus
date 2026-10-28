// Web Worker — 在独立线程中运行求解/生成任务，避免阻塞 UI
// ⚠️ 直接从 solver 源文件 import，绕过 barrel(index.ts) —— barrel 引用了 React/framer-motion 等浏览器依赖，Worker 环境无 window
import { solveLightsOut } from '@ludus/games/src/lights-out/rules';
import type { LightsOutState } from '@ludus/games/src/lights-out/types';
import { solveFifteen } from '@ludus/games/src/fifteen/solver';
import { solveSokobanBFS } from '@ludus/games/src/sokoban/solver';
import { solvePegSolitaire } from '@ludus/games/src/peg-solitaire/solver';
import { findBestMove, solveConnectFour } from '@ludus/games/src/connect-four/solver';
import { resolveConnectFourAiOptions } from '@ludus/games/src/connect-four/difficulty';
import type { ConnectFourState } from '@ludus/games/src/connect-four/types';
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
        const result = solveLightsOut(state as unknown as LightsOutState);
        result.stats.timeMs = Math.round(performance.now() - t0);

        const response: WorkerResponse = {
          id,
          type: 'solve',
          result,
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
      } else if (gameId === 'connect-four') {
        try {
          const solution = solveConnectFour(
            state as unknown as import('@ludus/games/src/connect-four/types').ConnectFourState,
            { maxDepth: 6, timeMs: 2_500 },
          );
          self.postMessage({ id, type: 'solve', result: solution });
        } catch (err) {
          self.postMessage({
            id,
            type,
            error: err instanceof Error ? err.message : 'Unknown Worker error in connect-four solver',
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
      if (gameId === 'thief-siege') {
        const thiefState = state as unknown as ThiefSiegeState;
        self.postMessage({
          id,
          type,
          result: chooseThiefSiegeAiMove(thiefState, budget),
        });
        return;
      }

      if (gameId === 'connect-four') {
        const c4State = state as unknown as ConnectFourState;
        const move = findBestMove(c4State, 1, resolveConnectFourAiOptions(c4State));
        self.postMessage({
          id,
          type,
          result: move ? { move, delay: 600 } : null,
        });
        return;
      }

      self.postMessage({ id, type, error: `AI Worker not implemented for game: ${gameId}` });
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
