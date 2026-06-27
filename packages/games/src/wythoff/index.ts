import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateWythoffLevel } from '@ludus/core';
import {
  createInitialState,
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveWythoffState,
  chooseHand,
} from './rules';
import type { WythoffState, WythoffMove } from './rules';
import { wythoffEducationManifest, wythoffVisualizationManifest } from './manifest';
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
};
