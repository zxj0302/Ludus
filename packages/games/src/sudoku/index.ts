// packages/games/src/sudoku/index.ts
import type { GamePlugin, Level, LevelConfig, Solution } from '@ludus/core';
import { generateSudokuLevel } from '@ludus/core';
import {
  createInitialState,
  legalMoves,
  applyMove,
  isSolved,
  getDifficulty,
  solveSudokuState,
} from './rules';
import type { SudokuState, SudokuMove } from './rules';
import { sudokuEducationManifest, sudokuVisualizationManifest } from './manifest';

const metadata = {
  id: 'sudoku',
  nameKey: 'game.sudoku.name',
  descriptionKey: 'game.sudoku.description',
  category: 'category.constraint-satisfaction',
  icon: '🧩',
  isFastSolver: true,
  tags: ['数独', 'Sudoku', 'CSP', '精确覆盖', 'DLX', '约束满足', '逻辑', '回溯'],
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

export const sudokuPlugin: GamePlugin<SudokuState, SudokuMove> = {
  metadata,
  initialState: () => createInitialState(),
  generateLevel: (config: LevelConfig): Level => generateSudokuLevel(config),
  legalMoves,
  applyMove,
  isSolved,
  solve: (state: SudokuState): Solution => solveSudokuState(state),
  getDifficulty,
  renderBackend: 'dom',
  educationManifest: sudokuEducationManifest,
  visualizationManifest: sudokuVisualizationManifest,
};
