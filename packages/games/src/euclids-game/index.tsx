import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateEuclidsGameLevel } from './generator';
import {
  createInitialState,
  legalMoves,
  legalMultiples,
  applyMove,
  isSolved,
  isPlayerVictory,
  getDifficulty,
  solveEuclidsGameState,
  chooseHand,
  isOwnState,
} from './rules';
import type { EuclidsGameState, EuclidsGameMove } from './types';
import { euclidsGameEducationManifest, euclidsGameVisualizationManifest } from './manifest';
import { findWinningMove } from './solver';

import type { BoardProps, GamePluginEntry } from '../types';
import { EuclidsGameBoard } from './render';
import { euclidsGameI18n } from './i18n';
import { formatEuclidsGameMove, EuclidsGameStatusCard } from './education-ui';

export { euclidsGameI18n };

export { EuclidsGameBoard };
export { findWinningMove, PHI } from './solver';
export { solveEuclidsGameState } from './rules';

const metadata = {
  id: 'euclids-game',
  nameKey: 'game.euclids-game.name',
  descriptionKey: 'game.euclids-game.description',
  category: 'category.combinatorial-game-theory',
  icon: '📐',
  isFastSolver: true,
  tags: ['Euclid', '欧几里得博弈', '博弈论', '黄金比例', 'gcd', '组合博弈'],
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

export const euclidsGamePlugin: GamePlugin<EuclidsGameState, EuclidsGameMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateEuclidsGameLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: EuclidsGameState): Solution => solveEuclidsGameState(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: euclidsGameEducationManifest,
  visualizationManifest: euclidsGameVisualizationManifest,
  ai: {
    isAITurn: (state) =>
      state.currentPlayer === 1 && state.phase === 'playing' && !isSolved(state),
    getAIMove: (state) => {
      const wm = findWinningMove(state.piles);
      if (wm) return { move: wm, delay: 600 };
      const multiples = legalMultiples(state.piles);
      if (multiples.length === 0) return null;
      const k = multiples[Math.floor(Math.random() * multiples.length)]!;
      return { move: { multiple: k }, delay: 600 };
    },
    isPlayerVictory,
  },
};

const EuclidsGameBoardEntry = (props: BoardProps<EuclidsGameState, EuclidsGameMove>) => (
  <EuclidsGameBoard
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

export const euclidsGameEntry: GamePluginEntry<EuclidsGameState, EuclidsGameMove> = {
  plugin: euclidsGamePlugin,
  BoardComponent: EuclidsGameBoardEntry,
  isOwnState,
  moveToHighlight: (move) => {
    if (!move) return null;
    return { row: 0, col: move.multiple - 1 };
  },
  i18n: { namespace: 'euclids', zhCN: euclidsGameI18n.zhCN, en: euclidsGameI18n.en },
  formatEducationMove: formatEuclidsGameMove,
  ui: { statusCard: EuclidsGameStatusCard },
  education: { content: {} },
};
