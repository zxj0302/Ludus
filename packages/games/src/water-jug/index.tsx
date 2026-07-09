import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import type { GamePluginEntry } from '../types';
import { generateWaterJugLevel } from './generator';
import { createInitialState, legalMoves, applyMove, isSolved, getDifficulty, gcd, isSolvable } from './rules';
import { solveWaterJug } from './solver';
import { waterJugEducationManifest, waterJugVisualizationManifest } from './manifest';
import { WaterJugBoard } from './render';
import { waterJugI18n } from './i18n';
import { formatWaterJugMove, WaterJugStatusCard } from './education-ui';
import type { WaterJugState, WaterJugMove } from './types';

export { solveWaterJug, waterJugI18n, gcd, isSolvable };
export type { WaterJugState, WaterJugMove };

const metadata = {
  id: 'water-jug',
  nameKey: 'game.waterJug.name',
  descriptionKey: 'game.waterJug.description',
  category: 'category.number-theory',
  icon: '💧',
  isFastSolver: true, // BFS on small state space — instant solve
  tags: ['water-jug', '倒水', 'BFS', '裴蜀定理', 'GCD', '状态空间搜索', '数论'],
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

export const waterJugPlugin: GamePlugin<WaterJugState, WaterJugMove> = {
  metadata,
  initialState: () => createInitialState([3, 5], 4), // Default: classic 3L + 5L → 4L
  generateLevel: (config: LevelConfig): Level => generateWaterJugLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: WaterJugState): Solution => solveWaterJug(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: waterJugEducationManifest,
  visualizationManifest: waterJugVisualizationManifest,
};

// ═══════════════════════════════════════════════════════════════
// GamePluginEntry
// ═══════════════════════════════════════════════════════════════

export const waterJugEntry: GamePluginEntry<WaterJugState, WaterJugMove> = {
  plugin: waterJugPlugin,
  BoardComponent: WaterJugBoard,
  isOwnState: (state): state is WaterJugState =>
    state != null
    && 'jugs' in state
    && 'capacities' in state
    && 'target' in state
    && Array.isArray((state as WaterJugState).jugs)
    && Array.isArray((state as WaterJugState).capacities)
    && typeof (state as WaterJugState).target === 'number',
  moveToHighlight: (move) => {
    if (!move) return null;
    if (move.type === 'fill' || move.type === 'empty') {
      return { row: move.jugIndex, col: 0 };
    }
    if (move.type === 'pour') {
      return { row: move.to, col: move.from };
    }
    return null;
  },
  i18n: { namespace: 'water-jug', zhCN: waterJugI18n.zhCN, en: waterJugI18n.en },
  formatEducationMove: formatWaterJugMove,
  ui: { statusCard: WaterJugStatusCard },
  education: { content: {} },
};
