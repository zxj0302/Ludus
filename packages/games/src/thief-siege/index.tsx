import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import type { GamePluginEntry } from '../types';
import { generateThiefSiegeLevel } from './generator';
import { createInitialState, legalMoves, applyMove, isSolved, isOwnState } from './rules';
import { getDifficulty } from './difficulty';
import { chooseThiefStep, getThiefSiegeAdversaryBudget, solveThiefSiege } from './solver';
import { searchAdversary } from './adversary';
import type { ThiefSiegeMove, ThiefSiegeState } from './types';
import { thiefSiegeEducationManifest, thiefSiegeVisualizationManifest } from './manifest';
import { ThiefSiegeBoard } from './render';
import { thiefSiegeI18n } from './i18n';
import { formatThiefSiegeMove, ThiefSiegeStatusCard } from './education-ui';

export { thiefSiegeI18n };
export { ThiefSiegeBoard };
export { chooseThiefStep, shortestEscapePath, solveThiefSiege, suggestCopPlacement } from './solver';

const metadata = {
  id: 'thief-siege',
  nameKey: 'game.thiefSiege.name',
  descriptionKey: 'game.thiefSiege.description',
  category: 'category.graph-theory',
  icon: '🚨',
  isFastSolver: true,
  tags: ['graph theory', '图论', 'BFS', '追逃博弈', '围堵', '最短路'],
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

export const thiefSiegePlugin: GamePlugin<ThiefSiegeState, ThiefSiegeMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateThiefSiegeLevel(config),
  legalMoves,
  applyMove,
  isSolved: (state: ThiefSiegeState): boolean => state.status === 'cop-win',
  solve: (state: ThiefSiegeState): Solution => solveThiefSiege(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: thiefSiegeEducationManifest,
  visualizationManifest: thiefSiegeVisualizationManifest,
  ai: {
    isAITurn: (s) => s.status === 'playing' && s.phase === 'thief',
    getAIMove: (s) => {
      const move = chooseThiefStep(s);
      return move ? { move, delay: 450 } : null;
    },
    getAIMoveAsync: async (s) => {
      const result = searchAdversary(s, getThiefSiegeAdversaryBudget(s));
      if (result.move?.type === 'step') {
        return { move: result.move, delay: Math.max(200, result.timeMs), tier: result.tier };
      }

      const fallback = chooseThiefStep(s);
      return fallback ? { move: fallback, delay: 200, tier: 'bfs' } : null;
    },
  },
};

export const thiefSiegeEntry: GamePluginEntry<ThiefSiegeState, ThiefSiegeMove> = {
  plugin: thiefSiegePlugin,
  BoardComponent: ThiefSiegeBoard,
  isOwnState,
  moveToHighlight: (move) => {
    if (!move) return null;
    return { row: move.row, col: move.col };
  },
  i18n: { namespace: 'thiefSiege', zhCN: thiefSiegeI18n.zhCN, en: thiefSiegeI18n.en },
  formatEducationMove: formatThiefSiegeMove,
  ui: { statusCard: ThiefSiegeStatusCard },
  education: { content: {} },
};
