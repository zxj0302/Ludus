import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateWythoffLevel } from './generator';
import {
  createInitialState,
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveWythoffState,
  chooseHand,
} from './rules';
import type { WythoffState, WythoffMove } from './types';
import { wythoffEducationManifest, wythoffVisualizationManifest } from './manifest';
import { findWythoffWinningMove, isWythoffPPosition } from './solver';
import type { BoardProps, GamePluginEntry } from '../types';
import { WythoffBoard } from './render';
import { wythoffI18n } from './i18n';
import { formatWythoffMove, WythoffStatusCard } from './education-ui';
export { wythoffI18n };

export { WythoffBoard };
export { isWythoffPPosition };
export { generateWythoffLevel };
export { solveWythoffState } from './rules';

const metadata = {
  id: 'wythoff',
  nameKey: 'game.wythoff.name',
  descriptionKey: 'game.wythoff.description',
  category: 'category.combinatorial-game-theory',
  icon: '⚖️',
  isFastSolver: true,
  tags: ['Wythoff', '取石子', '博弈论', 'Beatty序列', '黄金比例', '组合博弈'],
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

export const wythoffPlugin: GamePlugin<WythoffState, WythoffMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateWythoffLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: WythoffState): Solution => solveWythoffState(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: wythoffEducationManifest,
  visualizationManifest: wythoffVisualizationManifest,
  ai: {
    isAITurn: (state) => state.currentPlayer === 1 && state.phase === 'playing' && !(state.piles[0] === 0 && state.piles[1] === 0),
    isPlayerVictory: (state) => isSolved(state) && state.currentPlayer === 1,
    getAIMove: (state) => {
      const wm = findWythoffWinningMove(state);
      if (wm) return { move: wm, delay: 600 };
      // P-position: take 1 from the larger pile
      if (state.piles[0]! >= state.piles[1]! && state.piles[0]! > 0) {
        return { move: { type: 'single', pileIndex: 0, removeCount: 1 }, delay: 600 };
      } else if (state.piles[1]! > 0) {
        return { move: { type: 'single', pileIndex: 1, removeCount: 1 }, delay: 600 };
      }
      return null;
    },
  },
};

// Board wrapper — 处理 Wythoff 专属的 onChooseHand
const WythoffBoardEntry = (props: BoardProps<WythoffState, WythoffMove>) => (
  <WythoffBoard
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

export const wythoffEntry: GamePluginEntry<WythoffState, WythoffMove> = {
  plugin: wythoffPlugin,
  BoardComponent: WythoffBoardEntry,
  isOwnState: (state): state is WythoffState =>
    state != null && 'piles' in state && 'phase' in state && Array.isArray((state as WythoffState).piles),
  moveToHighlight: (move, state) => {
    if (state?.phase === 'choosing') {
      const playerFirst = !isWythoffPPosition(state.piles[0], state.piles[1]);
      return { row: 0, col: playerFirst ? 0 : 1 };
    }
    if (!move) return null;
    if (move.pileIndex === -1) return { row: 0, col: move.removeCount };
    if (move.type === 'both') return { row: 0, col: 2, value: move.removeCount };
    if (move.pileIndex != null) return { row: move.pileIndex, col: 0, value: move.removeCount };
    return null;
  },
  i18n: { namespace: 'wythoff', zhCN: wythoffI18n.zhCN, en: wythoffI18n.en },
  formatEducationMove: formatWythoffMove,
  ui: { statusCard: WythoffStatusCard },
  education: { content: {} },
};
