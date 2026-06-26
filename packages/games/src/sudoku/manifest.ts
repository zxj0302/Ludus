// packages/games/src/sudoku/manifest.ts
import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const sudokuEducationManifest: EducationManifest = {
  gameId: 'sudoku',
  l2ContentPaths: {
    'zh-CN': '/content/sudoku/l2.zh-CN.md',
    en: '/content/sudoku/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/sudoku/l3.zh-CN.md',
    en: '/content/sudoku/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '精确覆盖问题 (Exact Cover)',
    en: 'Exact Cover Problem',
  },
  complexityClass: 'NP-Complete (generalized n×n Sudoku); P-time for fixed 9×9 via DLX',
  knowledgeTags: ['精确覆盖', 'DLX', 'Algorithm X', '约束满足', 'CSP', '回溯'],
};

export const sudokuVisualizationManifest: VisualizationManifest = {
  gameId: 'sudoku',
  traceType: 'constraint-propagation',
  componentName: 'DLXMatrixViz',
  library: 'custom-svg',
};
