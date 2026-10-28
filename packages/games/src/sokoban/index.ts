import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateSokobanLevel } from './generator';
import { getLevel, parseSokobanLevels, getAllLevels } from './levels';
export { parseSokobanLevels, getAllLevels };
import type { SokobanState, SokobanMove } from './types';
import {
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveSokoban,
} from './rules';
import { sokobanEducationManifest, sokobanVisualizationManifest } from './manifest';
import type { GamePluginEntry } from '../types';
import { SokobanBoard } from './render';
import { sokobanI18n } from './i18n';
import { formatSokobanMove, SokobanStatusCard } from './education-ui';
export { sokobanI18n };
import { DIRECTION_DELTA } from './types';
import {
  stateHash,
  expandState,
  applyMove as sokobanApplyMove,
  isDeadlock,
  isSolved as sokobanIsSolved,
} from './solver-utils';
import { SOKOBAN_BFS_TIMEOUT_MS, solveSokobanBFS } from './solver';

export { SokobanBoard };
export { stateHash, SOKOBAN_BFS_TIMEOUT_MS, expandState, solveSokobanBFS, isDeadlock };
export { sokobanApplyMove as applyMoveSokoban, sokobanIsSolved as isSolvedSokoban };

const metadata = {
  id: 'sokoban',
  nameKey: 'game.sokoban.name',
  descriptionKey: 'game.sokoban.description',
  category: 'category.search',
  icon: '📦',
  isFastSolver: false,
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
  initialState: () => getLevel(0),
  generateLevel: (config: LevelConfig): Level => generateSokobanLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: SokobanState): Solution => solveSokoban(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: sokobanEducationManifest,
  visualizationManifest: sokobanVisualizationManifest,
};

export const sokobanEntry: GamePluginEntry<SokobanState, SokobanMove> = {
  plugin: sokobanPlugin,
  BoardComponent: SokobanBoard,
  isOwnState: (state): state is SokobanState =>
    state != null && 'walls' in state && 'player' in state && 'boxes' in state,
  moveToHighlight: (move, state) => {
    if (move?.direction && state) {
      const d = DIRECTION_DELTA[move.direction];
      if (d) return { row: state.player.row + d.dr, col: state.player.col + d.dc };
    }
    return null;
  },
  i18n: { namespace: 'sokoban', zhCN: sokobanI18n.zhCN, en: sokobanI18n.en },
  formatEducationMove: formatSokobanMove,
  ui: { statusCard: SokobanStatusCard },
  education: { content: {} },
};
