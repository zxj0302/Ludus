import type { GamePlugin, Level, LevelConfig, Solution, Difficulty } from '@ludus/core';
import {
  createLightsOutState,
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveLightsOut,
} from './rules';
import type { LightsOutState, LightsOutMove } from './types';
import { lightsOutEducationManifest, lightsOutVisualizationManifest } from './manifest';
import { generateLightsOutLevel } from './generator';

const metadata = {
  id: 'lights-out',
  nameKey: 'game.lights-out.name',
  descriptionKey: 'game.lights-out.description',
  category: 'category.linear-algebra',
  icon: '💡',
  isFastSolver: true,
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

// ═══════════════════════════════════════════════════════════════
// GamePluginEntry — 自描述插件条目
// ═══════════════════════════════════════════════════════════════

import type { GamePluginEntry } from '../types';
import { LightsOutBoard } from './render';

export const lightsOutEntry: GamePluginEntry<LightsOutState, LightsOutMove> = {
  plugin: lightsOutPlugin,
  BoardComponent: LightsOutBoard as any,
  isOwnState: (state): state is LightsOutState =>
    state != null && 'grid' in state && 'n' in state && Array.isArray((state as LightsOutState).grid),
  moveToHighlight: (move) => ({ row: move.row, col: move.col }),
  i18n: { namespace: 'lights-out', zhCN: {}, en: {} },
  education: { content: {} },
};
