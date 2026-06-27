import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateWythoffLevel } from './generator';
import {
  createInitialState,
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveWythoffState,
  chooseHand,
} from './rules';
import type { WythoffState, WythoffMove } from './types';
import { wythoffEducationManifest, wythoffVisualizationManifest } from './manifest';
import { findWythoffWinningMove } from './solver';

export { WythoffBoard } from './render';
export { chooseHand };
export { solveWythoffState } from './rules';

const metadata = {
  id: 'wythoff',
  nameKey: 'game.wythoff.name',
  descriptionKey: 'game.wythoff.description',
  category: 'category.combinatorial-game-theory',
  icon: '⚖️',
  isFastSolver: true,
  tags: ['Wythoff', '取石子', '博弈论', 'Beatty序列', '黄金比例', '组合博弈'],
  renderBackend: 'dom' as const,
  platformSupport: [
    {
      platform: 'web' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'full' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: false,
      },
    },
    {
      platform: 'desktop' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'full' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: false,
      },
    },
    {
      platform: 'mobile' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'full' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: false,
      },
    },
  ],
  version: '0.1.0',
};

export const wythoffPlugin: GamePlugin<WythoffState, WythoffMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateWythoffLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: WythoffState): Solution => solveWythoffState(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: wythoffEducationManifest,
  visualizationManifest: wythoffVisualizationManifest,
  ai: {
    isAITurn: (state) => state.currentPlayer === 1 && state.phase === 'playing' && !(state.piles[0] === 0 && state.piles[1] === 0),
    getAIMove: (state) => {
      const wm = findWythoffWinningMove(state);
      if (wm) return { move: wm, delay: 600 };
      // P-position: take 1 from the larger pile
      if (state.piles[0]! >= state.piles[1]! && state.piles[0]! > 0) {
        return { move: { type: 'single', pileIndex: 0, removeCount: 1 }, delay: 600 };
      } else if (state.piles[1]! > 0) {
        return { move: { type: 'single', pileIndex: 1, removeCount: 1 }, delay: 600 };
      }
      return null;
    },
  },
};
