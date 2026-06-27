import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateNimLevel } from './generator';
import {
  createInitialState,
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveNimState,
  chooseHand,
} from './rules';
import type { NimState, NimMove } from './types';
import { nimEducationManifest, nimVisualizationManifest } from './manifest';
import { findWinningMove } from './solver';

import type { GamePluginEntry } from '../types';
import { NimBoard } from './render';

export { NimBoard };
export { chooseHand };
export { solveNimState } from './rules';

const metadata = {
  id: 'nim',
  nameKey: 'game.nim.name',
  descriptionKey: 'game.nim.description',
  category: 'category.combinatorial-game-theory',
  icon: '🪨',
  isFastSolver: true,
  tags: ['Nim', '取石子', '博弈论', 'XOR', '组合博弈', 'Sprague-Grundy'],
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

export const nimPlugin: GamePlugin<NimState, NimMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateNimLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: NimState): Solution => solveNimState(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: nimEducationManifest,
  visualizationManifest: nimVisualizationManifest,
  ai: {
    isAITurn: (state) => state.currentPlayer === 1 && state.phase === 'playing' && !state.piles.every(v => v === 0),
    getAIMove: (state) => {
      const wm = findWinningMove(state.piles);
      if (wm) return { move: wm, delay: 600 };
      // P-position: take 1 from first non-empty pile
      const idx = state.piles.findIndex(v => v > 0);
      if (idx >= 0) return { move: { pileIndex: idx, removeCount: 1 }, delay: 600 };
      return null;
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// GamePluginEntry
// ═══════════════════════════════════════════════════════════════

export const nimEntry: GamePluginEntry<NimState, NimMove> = {
  plugin: nimPlugin,
  BoardComponent: NimBoard as any,
  isOwnState: (state): state is NimState =>
    state != null && 'piles' in state && 'phase' in state && Array.isArray((state as NimState).piles),
  moveToHighlight: (move) => {
    if (move.pileIndex === -1) return { row: 0, col: move.removeCount };
    if (move.pileIndex != null) return { row: move.pileIndex, col: 0, value: move.removeCount };
    return null;
  },
  i18n: { namespace: 'nim', zhCN: {}, en: {} },
  education: { content: {} },
};
