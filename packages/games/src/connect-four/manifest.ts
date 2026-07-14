import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const connectFourEducationManifest: EducationManifest = {
  gameId: 'connect-four',
  l2ContentPaths: {
    'zh-CN': '/content/connect-four/l2.zh-CN.md',
    en: '/content/connect-four/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/connect-four/l3.zh-CN.md',
    en: '/content/connect-four/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '组合博弈 — 四子棋 (Connect Four)',
    en: 'Combinatorial Game — Connect Four',
  },
  complexityClass: 'PSPACE (general); solved 7×6 — Minimax / Alpha-Beta',
  knowledgeTags: ['四子棋', 'Connect Four', 'Minimax', 'Alpha-Beta', '博弈树', 'Allis 1988'],
};

export const connectFourVisualizationManifest: VisualizationManifest = {
  gameId: 'connect-four',
  traceType: 'minimax-tree',
  componentName: 'ConnectFourTreeViz',
  library: 'react-flow',
};
