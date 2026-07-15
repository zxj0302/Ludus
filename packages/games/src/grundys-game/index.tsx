import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateGrundysGameLevel } from './generator';
import {
  createInitialState,
  legalMoves,
  legalMovesForPlayer,
  applyMove,
  isSolved,
  isPlayerVictory,
  getDifficulty,
  solveGrundysGameState,
  chooseHand,
  isOwnState,
} from './rules';
import type { GrundysGameState, GrundysGameMove } from './types';
import { grundysGameEducationManifest, grundysGameVisualizationManifest } from './manifest';
import { findWinningMove } from './solver';

import type { BoardProps, GamePluginEntry } from '../types';
import { GrundysGameBoard } from './render';
import { grundysGameI18n } from './i18n';
import { formatGrundysGameMove, GrundysGameStatusCard } from './education-ui';

export { grundysGameI18n };
export { GrundysGameBoard };
export { computeGrundy, computeGrundyXor, pileNimbers, findWinningMove as findGrundysWinningMove } from './solver';
export { solveGrundysGameState } from './rules';
export type { GrundysGameState, GrundysGameMove } from './types';

const metadata = {
  id: 'grundys-game',
  nameKey: 'game.grundys-game.name',
  descriptionKey: 'game.grundys-game.description',
  category: 'category.combinatorial-game-theory',
  icon: '🪓',
  isFastSolver: true,
  tags: ["Grundy's Game", 'Sprague-Grundy', 'mex', 'Nimber', '组合博弈', '拆堆'],
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

export const grundysGamePlugin: GamePlugin<GrundysGameState, GrundysGameMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateGrundysGameLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: GrundysGameState): Solution => solveGrundysGameState(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: grundysGameEducationManifest,
  visualizationManifest: grundysGameVisualizationManifest,
  ai: {
    isAITurn: (state) =>
      state.currentPlayer === 1 && state.phase === 'playing' && !isSolved(state),
    getAIMove: (state) => {
      const wm = findWinningMove(state.piles);
      if (wm) return { move: wm, delay: 600 };
      const moves = legalMovesForPlayer(state, 1);
      if (moves.length === 0) return null;
      const pick = moves[Math.floor(Math.random() * moves.length)]!;
      return { move: pick, delay: 600 };
    },
    isPlayerVictory,
  },
};

const GrundysGameBoardEntry = (props: BoardProps<GrundysGameState, GrundysGameMove>) => (
  <GrundysGameBoard
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

export const grundysGameEntry: GamePluginEntry<GrundysGameState, GrundysGameMove> = {
  plugin: grundysGamePlugin,
  BoardComponent: GrundysGameBoardEntry,
  isOwnState,
  moveToHighlight: (move) => {
    if (!move) return null;
    return { row: move.pileIndex, col: move.left, value: move.left };
  },
  i18n: { namespace: 'grundy', zhCN: grundysGameI18n.zhCN, en: grundysGameI18n.en },
  formatEducationMove: formatGrundysGameMove,
  ui: { statusCard: GrundysGameStatusCard },
  education: { content: {} },
};
