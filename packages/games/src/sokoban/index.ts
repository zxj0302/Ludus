import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateSokobanLevel, getLevel } from '@ludus/core';
import type { SokobanState, SokobanMove } from './rules';
import {
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveSokoban,
} from './rules';
import { sokobanEducationManifest, sokobanVisualizationManifest } from './manifest';

const metadata = {
  id: 'sokoban',
  nameKey: 'game.sokoban.name',
  descriptionKey: 'game.sokoban.description',
  category: 'category.search',
  icon: '📦',
  tags: ['BFS', '搜索', 'PSPACE', '死锁检测', 'puzzle'],
  renderBackend: 'dom' as const,
  platformSupport: [
    {
      platform: 'web' as const,
      capabilities: {
        playable: true,
        solver: 'full' as const,
        generator: 'full' as const,
        education: 'full' as const,
        visualization: 'full' as const,
        webWorker: true,
      },
    },
    {
      platform: 'desktop' as const,
      capabilities: {
        playable: true,
        solver: 'full' as const,
        generator: 'full' as const,
        education: 'full' as const,
        visualization: 'full' as const,
        webWorker: true,
      },
    },
    {
      platform: 'mobile' as const,
      capabilities: {
        playable: true,
        solver: 'full' as const,
        generator: 'full' as const,
        education: 'full' as const,
        visualization: 'full' as const,
        webWorker: true,
      },
    },
  ],
  version: '0.1.0',
};

export const sokobanPlugin: GamePlugin<SokobanState, SokobanMove> = {
  metadata,

  // -- 状态与关卡 --
  initialState: () => getLevel(0),

  generateLevel: (config: LevelConfig): Level => {
    return generateSokobanLevel(config);
  },

  // -- 规则引擎 --
  legalMoves,
  applyMove,
  isSolved,

  // -- 求解器 --
  solve: (state: SokobanState): Solution => {
    return solveSokoban(state);
  },

  // -- 难度 --
  getDifficulty,

  // -- 渲染 --
  renderBackend: 'dom',

  // -- 教学 --
  educationManifest: sokobanEducationManifest,

  // -- 可视化 --
  visualizationManifest: sokobanVisualizationManifest,
};
