import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import type { GamePluginEntry } from '../types';
import { generateNonogramLevel } from './generator';
import { createInitialState, legalMoves, applyMove, isSolved, getDifficulty, computeClues } from './rules';
import { solveNonogram, countSolutions } from './solver';
import { nonogramEducationManifest, nonogramVisualizationManifest } from './manifest';
import { NonogramBoard } from './render';
import { nonogramI18n } from './i18n';
import { formatNonogramMove, NonogramStatusCard, NonogramSolutionPreview } from './education-ui';
import { nonogramGeneratorControls } from './generator-controls';
import type { NonogramState, NonogramMove } from './types';

export { solveNonogram, nonogramI18n, countSolutions, computeClues };
export type { NonogramState, NonogramMove };

const metadata = {
  id: 'nonogram',
  nameKey: 'game.nonogram.name',
  descriptionKey: 'game.nonogram.description',
  category: 'category.constraint-satisfaction',
  icon: '🧩',
  isFastSolver: false, // Backtracking solver — may be slow on large grids
  tags: ['nonogram', 'ノノグラム', 'CSP', '约束满足', '回溯', 'NP-complete', 'picross'],
  renderBackend: 'canvas' as const,
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

export const nonogramPlugin: GamePlugin<NonogramState, NonogramMove> = {
  metadata,
  initialState: () => {
    // Default: 5×5 heart pattern (fully line-solvable, good for first impression)
    const heart: boolean[][] = [
      [false, true, false, true, false],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [false, true, true, true, false],
      [false, false, true, false, false],
    ];
    const { rowClues, colClues } = computeClues(heart);
    return createInitialState(5, 5, rowClues, colClues);
  },
  generateLevel: (config: LevelConfig): Level => generateNonogramLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: NonogramState): Solution => {
    const result = solveNonogram(state);
    // Build moves from the solution grid — only fill cells (empty cells stay empty)
    const moves: NonogramMove[] = [];
    if (result.solvable && result.solution) {
      for (let r = 0; r < state.height; r++) {
        for (let c = 0; c < state.width; c++) {
          if (result.solution[r]![c]) {
            moves.push({ row: r, col: c, action: 'fill' });
          }
        }
      }
    }
    return {
      solvable: result.solvable,
      moves,
      stats: {
        nodesExplored: result.stats.nodesExplored,
        timeMs: result.stats.timeMs,
        solutionLength: moves.length,
        solverName: result.stats.solverName,
      },
      trace: result.trace,
    };
  },
  getDifficulty,
  renderBackend: 'canvas',
  educationManifest: nonogramEducationManifest,
  visualizationManifest: nonogramVisualizationManifest,
};

// ═══════════════════════════════════════════════════════════════
// GamePluginEntry
// ═══════════════════════════════════════════════════════════════

export const nonogramEntry: GamePluginEntry<NonogramState, NonogramMove> = {
  plugin: nonogramPlugin,
  BoardComponent: NonogramBoard,
  isOwnState: (state): state is NonogramState =>
    state != null
    && 'grid' in state
    && 'rowClues' in state
    && 'colClues' in state
    && 'lineSolveCells' in state
    && 'maxBacktrackDepth' in state
    && 'width' in state
    && 'height' in state
    && Array.isArray((state as NonogramState).grid)
    && Array.isArray((state as NonogramState).rowClues)
    && Array.isArray((state as NonogramState).colClues)
    && typeof (state as NonogramState).lineSolveCells === 'number'
    && typeof (state as NonogramState).maxBacktrackDepth === 'number'
    && typeof (state as NonogramState).width === 'number'
    && typeof (state as NonogramState).height === 'number',
  moveToHighlight: (move) => {
    if (!move) return null;
    return { row: move.row, col: move.col };
  },
  i18n: { namespace: 'nonogram', zhCN: nonogramI18n.zhCN, en: nonogramI18n.en },
  formatEducationMove: formatNonogramMove,
  ui: { statusCard: NonogramStatusCard, SolutionPreview: NonogramSolutionPreview },
  education: { content: {} },
  generatorControls: nonogramGeneratorControls,
};
