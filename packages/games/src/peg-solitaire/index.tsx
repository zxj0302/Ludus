import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import type { GamePluginEntry } from '../types';
import { generatePegSolitaireLevel } from './generator';
import { createClassicState, legalMoves, applyMove, isSolved, isOwnState, popcount } from './rules';
import { getDifficulty } from './difficulty';
import { solvePegSolitaire, sampleSolutionTree } from './solver';
import { pegSolitaireEducationManifest, pegSolitaireVisualizationManifest } from './manifest';
import { PegSolitaireBoard } from './render';
import { pegSolitaireI18n } from './i18n';
import { formatPegSolitaireMove, PegSolitaireStatusCard } from './education-ui';
import type { PegSolitaireMove, PegSolitaireState } from './types';
import { HOLE_COORDS } from './geometry';
import { PEG_CATALOG } from './puzzles';

export { solvePegSolitaire, sampleSolutionTree, pegSolitaireI18n, popcount };
export type { PegTreeNode } from './solver';
export { PEG_CATALOG, CLASSIC_CENTER_EMPTY, catalogByGoal, entryToState } from './puzzles';
export type { PegCatalogEntry } from './puzzles';
export { holeNotation, CENTER_HOLE, HOLE_COORDS } from './geometry';
export type { PegSolitaireMove, PegSolitaireState, PegGoal } from './types';

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
        playable: true, solver: 'full' as const, generator: 'degraded' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: true,
      },
      notes: 'generator = classic-catalog Hub fallback only (ADR-026); primary UX is mode+level toolbar',
    },
    {
      platform: 'desktop' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'degraded' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: true,
      },
      notes: 'generator = classic-catalog Hub fallback only (ADR-026)',
    },
    {
      platform: 'mobile' as const,
      capabilities: {
        playable: true, solver: 'full' as const, generator: 'degraded' as const,
        education: 'full' as const, visualization: 'full' as const, webWorker: true,
      },
      notes: 'generator = classic-catalog Hub fallback only (ADR-026)',
    },
  ],
  version: '0.1.0',
};

export const pegSolitairePlugin: GamePlugin<PegSolitaireState, PegSolitaireMove> = {
  metadata,
  initialState: () => createClassicState('one-center'),
  generateLevel: (config: LevelConfig): Level => generatePegSolitaireLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: PegSolitaireState): Solution => solvePegSolitaire(state),
  getDifficulty: (state: PegSolitaireState) => {
    const entry = state.catalogId
      ? PEG_CATALOG.find(e => e.id === state.catalogId)
      : undefined;
    return getDifficulty(state, entry?.knownSolutionLength);
  },
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
    const to = HOLE_COORDS[move.to];
    const from = HOLE_COORDS[move.from];
    const over = HOLE_COORDS[move.over];
    if (!to || !from) return null;
    return {
      row: to.row,
      col: to.col,
      from: { row: from.row, col: from.col },
      over: over ? { row: over.row, col: over.col } : undefined,
    };
  },
  i18n: { namespace: 'peg-solitaire', zhCN: pegSolitaireI18n.zhCN, en: pegSolitaireI18n.en },
  formatEducationMove: formatPegSolitaireMove,
  ui: { statusCard: PegSolitaireStatusCard },
  education: { content: {} },
};
