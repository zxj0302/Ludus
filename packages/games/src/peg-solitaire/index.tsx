import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import type { GamePluginEntry } from '../types';
import { generatePegSolitaireLevel } from './generator';
import { createClassicState, legalMoves, applyMove, isSolved, isOwnState } from './rules';
import { getDifficulty } from './difficulty';
import { solvePegSolitaire } from './solver';
import { pegSolitaireEducationManifest, pegSolitaireVisualizationManifest } from './manifest';
import { PegSolitaireBoard } from './render';
import { pegSolitaireI18n } from './i18n';
import { formatPegSolitaireMove, PegSolitaireStatusCard } from './education-ui';
import type { PegSolitaireMove, PegSolitaireState } from './types';
import { HOLE_COORDS } from './geometry';

export { solvePegSolitaire, pegSolitaireI18n };
export type { PegSolitaireMove, PegSolitaireState };

const metadata = {
  id: 'peg-solitaire',
  nameKey: 'game.pegSolitaire.name',
  descriptionKey: 'game.pegSolitaire.description',
  category: 'category.search',
  icon: '◉',
  isFastSolver: false,
  tags: ['peg-solitaire', '孔明棋', 'DFS', 'BFS', 'D4', '对称剪枝', '状态空间搜索'],
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

export const pegSolitairePlugin: GamePlugin<PegSolitaireState, PegSolitaireMove> = {
  metadata,
  initialState: () => createClassicState('le3'),
  generateLevel: (config: LevelConfig): Level => generatePegSolitaireLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: PegSolitaireState): Solution => solvePegSolitaire(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: pegSolitaireEducationManifest,
  visualizationManifest: pegSolitaireVisualizationManifest,
};

export const pegSolitaireEntry: GamePluginEntry<PegSolitaireState, PegSolitaireMove> = {
  plugin: pegSolitairePlugin,
  BoardComponent: PegSolitaireBoard,
  isOwnState,
  moveToHighlight: (move) => {
    if (!move) return null;
    const coord = HOLE_COORDS[move.to];
    return coord ? { row: coord.row, col: coord.col } : null;
  },
  i18n: { namespace: 'peg-solitaire', zhCN: pegSolitaireI18n.zhCN, en: pegSolitaireI18n.en },
  formatEducationMove: formatPegSolitaireMove,
  ui: { statusCard: PegSolitaireStatusCard },
  education: { content: {} },
};
