import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const pegSolitaireEducationManifest: EducationManifest = {
  gameId: 'peg-solitaire',
  l2ContentPaths: {
    'zh-CN': '/content/peg-solitaire/l2.zh-CN.md',
    en: '/content/peg-solitaire/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/peg-solitaire/l3.zh-CN.md',
    en: '/content/peg-solitaire/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '状态空间搜索 — 孔明棋与对称剪枝',
    en: 'State-Space Search — Peg Solitaire with Symmetry Pruning',
  },
  complexityClass: 'Exponential state-space search; D4 symmetry reduces duplicate board states',
  knowledgeTags: ['DFS', 'BFS', 'D4 symmetry', 'state-space search', 'bitmask', '孔明棋'],
};

export const pegSolitaireVisualizationManifest: VisualizationManifest = {
  gameId: 'peg-solitaire',
  traceType: 'search-tree',
  componentName: 'PegSearchViz',
  library: 'react-flow',
};
