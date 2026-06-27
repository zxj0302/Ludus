import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateNimLevel } from '@ludus/core';
import {
  createInitialState,
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveNimState,
  chooseHand,
} from './rules';
import type { NimState, NimMove } from './rules';
import { nimEducationManifest, nimVisualizationManifest } from './manifest';
export { NimBoard } from './render';
export { chooseHand };

const metadata = {
  id: 'nim',
  nameKey: 'game.nim.name',
  descriptionKey: 'game.nim.description',
  category: 'category.combinatorial-game-theory',
  icon: '🪨',
  isFastSolver: true,
  tags: ['Nim', '取石子', '博弈论', 'XOR', '组合博弈', 'Sprague-Grundy'],
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

export const nimPlugin: GamePlugin<NimState, NimMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateNimLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: NimState): Solution => solveNimState(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: nimEducationManifest,
  visualizationManifest: nimVisualizationManifest,
};
