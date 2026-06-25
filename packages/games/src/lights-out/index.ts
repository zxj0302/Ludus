import type { GamePlugin, Level, LevelConfig, Solution, Difficulty } from '@ludus/core';
import {
  createLightsOutState,
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveLightsOut,
} from './rules';
import type { LightsOutState, LightsOutMove } from './rules';
import { lightsOutEducationManifest, lightsOutVisualizationManifest, lightsOutSoundManifest } from './manifest';
import { generateLightsOutLevel } from '@ludus/core';

const metadata = {
  id: 'lights-out',
  nameKey: 'game.lights-out.name',
  descriptionKey: 'game.lights-out.description',
  category: 'category.linear-algebra',
  icon: '💡',
  tags: ['GF(2)', '高斯消元', '矩阵', '逻辑', 'puzzle'],
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

export const lightsOutPlugin: GamePlugin<LightsOutState, LightsOutMove> = {
  metadata,

  // -- 状态与关卡 --
  initialState: () => createLightsOutState(5),

  generateLevel: (config: LevelConfig): Level => {
    return generateLightsOutLevel(config);
  },

  // -- 规则引擎 --
  legalMoves,
  applyMove,
  isSolved,

  // -- 求解器 --
  solve: (state: LightsOutState): Solution => {
    const startTime = performance.now();
    const result = solveLightsOut(state);
    return {
      ...result,
      stats: {
        ...result.stats,
        timeMs: Math.round(performance.now() - startTime),
      },
    };
  },

  // -- 难度 --
  getDifficulty,

  // -- 渲染 --
  renderBackend: 'dom',

  // -- 教学 --
  educationManifest: lightsOutEducationManifest,

  // -- 可视化 --
  visualizationManifest: lightsOutVisualizationManifest,
};
