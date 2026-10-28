import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import type { GamePluginEntry, BoardProps } from '../types';
import { generateConnectFourLevel, prepareConnectFourLoadedState } from './generator';
import {
  createInitialState,
  chooseHand,
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveConnectFourState,
  isOwnState,
} from './rules';
import type { ConnectFourState, ConnectFourMove } from './types';
import { connectFourEducationManifest, connectFourVisualizationManifest } from './manifest';
import { resolveConnectFourAiOptions } from './difficulty';
import { findBestMove } from './solver';
import { ConnectFourBoard } from './render';
import { connectFourI18n } from './i18n';
import { formatConnectFourMove, ConnectFourStatusCard, ConnectFourSolutionPreview, ConnectFourChoosingCard } from './education-ui';

export { connectFourI18n };
export { solveConnectFourState } from './rules';
export type { ConnectFourState, ConnectFourMove } from './types';

const metadata = {
  id: 'connect-four',
  nameKey: 'game.connectFour.name',
  descriptionKey: 'game.connectFour.description',
  category: 'category.combinatorial-game-theory',
  icon: '🔴',
  isFastSolver: false,
  tags: ['Connect Four', '四子棋', 'Minimax', 'Alpha-Beta', '博弈树', '组合博弈'],
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

export const connectFourPlugin: GamePlugin<ConnectFourState, ConnectFourMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateConnectFourLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: ConnectFourState): Solution => solveConnectFourState(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: connectFourEducationManifest,
  visualizationManifest: connectFourVisualizationManifest,
  ai: {
    isAITurn: (state) =>
      state.currentPlayer === 1 && state.phase === 'playing' && state.winner === null,
    getAIMove: (state) => {
      const opts = resolveConnectFourAiOptions(state);
      const move = findBestMove(state, 1, opts);
      if (!move) return null;
      return { move, delay: 600 };
    },
    getAIMoveAsync: async (state) => {
      const opts = resolveConnectFourAiOptions(state);
      const move = findBestMove(state, 1, opts);
      if (!move) return null;
      return { move, delay: 600 };
    },
    isPlayerVictory: (state) => state.winner === 0,
  },
};

const ConnectFourBoardEntry = (props: BoardProps<ConnectFourState, ConnectFourMove>) => (
  <ConnectFourBoard
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

export const connectFourEntry: GamePluginEntry<ConnectFourState, ConnectFourMove> = {
  plugin: connectFourPlugin,
  BoardComponent: ConnectFourBoardEntry,
  isOwnState,
  moveToHighlight: (move, state) => {
    if (state?.phase === 'choosing') {
      const playerFirst = state.playerStarts ?? true;
      return { row: 0, col: playerFirst ? 0 : 1 };
    }
    if (!move) return null;
    return { row: 0, col: move.column };
  },
  prepareLoadedState: (state, options) => prepareConnectFourLoadedState(state, options),
  i18n: { namespace: 'connect-four', zhCN: connectFourI18n.zhCN, en: connectFourI18n.en },
  formatEducationMove: formatConnectFourMove,
  ui: {
    statusCard: ConnectFourStatusCard,
    SolutionPreview: ConnectFourSolutionPreview,
    choosingHint: ConnectFourChoosingCard,
  },
  education: { content: {} },
};
