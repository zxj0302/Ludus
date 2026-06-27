import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateSokobanLevel } from './generator';
import { getLevel } from './levels';
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
import { DIRECTION_DELTA } from './types';

export { SokobanBoard };

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
  BoardComponent: SokobanBoard as any,
  isOwnState: (state): state is SokobanState =>
    state != null && 'walls' in state && 'player' in state && 'boxes' in state,
  moveToHighlight: (move, state) => {
    if (move.direction && state) {
      const d = DIRECTION_DELTA[move.direction];
      if (d) return { row: state.player.row + d.dr, col: state.player.col + d.dc };
    }
    return null;
  },
  i18n: { namespace: 'sokoban', zhCN: {}, en: {} },
  education: { content: {} },
};
