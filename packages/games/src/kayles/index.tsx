import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateKaylesLevel } from './generator';
import {
  createInitialState,
  legalMoves,
  legalMovesForPlayer,
  applyMove,
  isSolved,
  isPlayerVictory,
  getDifficulty,
  solveKaylesState,
  chooseHand,
  isOwnState,
} from './rules';
import type { KaylesState, KaylesMove } from './types';
import { kaylesEducationManifest, kaylesVisualizationManifest } from './manifest';
import { findKaylesWinningMove } from './solver';

import type { BoardProps, GamePluginEntry } from '../types';
import { KaylesBoard } from './render';
import { kaylesI18n } from './i18n';
import { formatKaylesMove, KaylesStatusCard } from './education-ui';

export { kaylesI18n };
export { KaylesBoard };
export {
  computeKaylesGrundy,
  chainXor,
  findKaylesWinningMove,
} from './solver';
export { chainLengths } from './rules';
export { solveKaylesState } from './rules';
export type { KaylesState, KaylesMove } from './types';

const metadata = {
  id: 'kayles',
  nameKey: 'game.kayles.name',
  descriptionKey: 'game.kayles.description',
  category: 'category.combinatorial-game-theory',
  icon: '🎳',
  isFastSolver: true,
  tags: ['Kayles', 'Sprague-Grundy', 'mex', 'octal', '组合博弈', '保龄'],
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

export const kaylesPlugin: GamePlugin<KaylesState, KaylesMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateKaylesLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: KaylesState): Solution => solveKaylesState(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: kaylesEducationManifest,
  visualizationManifest: kaylesVisualizationManifest,
  ai: {
    isAITurn: (state) =>
      state.currentPlayer === 1 && state.phase === 'playing' && !isSolved(state),
    getAIMove: (state) => {
      const wm = findKaylesWinningMove(state.alive);
      if (wm) return { move: wm, delay: 600 };
      const moves = legalMovesForPlayer(state, 1);
      if (moves.length === 0) return null;
      const pick = moves[Math.floor(Math.random() * moves.length)]!;
      return { move: pick, delay: 600 };
    },
    isPlayerVictory,
  },
};

const KaylesBoardEntry = (props: BoardProps<KaylesState, KaylesMove>) => (
  <KaylesBoard
    state={props.state}
    onMove={props.onMove}
    disabled={props.disabled}
    highlightCell={props.highlightCell}
    onChooseHand={(playerFirst: boolean) => {
      const newState = chooseHand(props.state, playerFirst);
      props.dispatch?.({ type: 'loadState', payload: newState });
      props.dispatch?.({ type: 'prependHistory', payload: props.state });
    }}
  />
);

export const kaylesEntry: GamePluginEntry<KaylesState, KaylesMove> = {
  plugin: kaylesPlugin,
  BoardComponent: KaylesBoardEntry,
  isOwnState,
  moveToHighlight: (move) => {
    if (!move) return null;
    return { row: 0, col: move.index, value: move.count };
  },
  i18n: { namespace: 'kayles', zhCN: kaylesI18n.zhCN, en: kaylesI18n.en },
  formatEducationMove: formatKaylesMove,
  ui: { statusCard: KaylesStatusCard },
  education: { content: {} },
};
