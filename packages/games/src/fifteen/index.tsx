import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import type { GamePluginEntry } from '../types';
import { generateFifteenLevel } from './generator';
import { createInitialState, legalMoves, applyMove, isSolved, getDifficulty } from './rules';
import type { FifteenState, FifteenMove } from './types';
import { SIZE } from './types';
import { solveFifteen } from './solver';
import { fifteenEducationManifest, fifteenVisualizationManifest } from './manifest';
import { FifteenBoard } from './render';
import { fifteenI18n } from './i18n';

export { fifteenI18n };

const metadata = {
  id: 'fifteen',
  nameKey: 'game.fifteen.name',
  descriptionKey: 'game.fifteen.description',
  category: 'category.search',
  icon: '🧩',
  isFastSolver: false, // A* may take time — use background solve
  tags: ['15-puzzle', '华容道', 'A*', '启发式搜索', '曼哈顿距离', '滑动拼图'],
  renderBackend: 'dom' as const,
  platformSupport: [
    {
      platform: 'web' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'full' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: true,
      },
    },
    {
      platform: 'desktop' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'full' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: true,
      },
    },
    {
      platform: 'mobile' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'full' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: true,
      },
    },
  ],
  version: '0.1.0',
};

export const fifteenPlugin: GamePlugin<FifteenState, FifteenMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateFifteenLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: FifteenState): Solution => solveFifteen(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: fifteenEducationManifest,
  visualizationManifest: fifteenVisualizationManifest,
};

// ═══════════════════════════════════════════════════════════════
// GamePluginEntry
// ═══════════════════════════════════════════════════════════════

export const fifteenEntry: GamePluginEntry<FifteenState, FifteenMove> = {
  plugin: fifteenPlugin,
  BoardComponent: FifteenBoard,
  isOwnState: (state): state is FifteenState =>
    state != null && 'grid' in state && Array.isArray((state as FifteenState).grid) && (state as FifteenState).grid.length === 16,
  moveToHighlight: (move) => {
    if (!move || move.tileIndex == null) return null;
    const idx = move.tileIndex;
    return { row: Math.floor(idx / SIZE), col: idx % SIZE };
  },
  i18n: { namespace: 'fifteen', zhCN: fifteenI18n.zhCN, en: fifteenI18n.en },
  education: { content: {} },
};
