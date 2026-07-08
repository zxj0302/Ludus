import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const waterJugEducationManifest: EducationManifest = {
  gameId: 'water-jug',
  l2ContentPaths: {
    'zh-CN': '/content/water-jug/l2.zh-CN.md',
    en: '/content/water-jug/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/water-jug/l3.zh-CN.md',
    en: '/content/water-jug/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '状态空间搜索 — BFS 与裴蜀定理 (Bézout\'s Identity)',
    en: 'State-Space Search — BFS and Bézout\'s Identity',
  },
  complexityClass: 'P — state space = Π(capacity_i + 1), solvable with BFS in polynomial time',
  knowledgeTags: ['BFS', '裴蜀定理', 'GCD', '状态空间搜索', '最短路径', '数论'],
};

export const waterJugVisualizationManifest: VisualizationManifest = {
  gameId: 'water-jug',
  traceType: 'bfs-state-search',
  componentName: 'WaterJugTreeViz',
  library: 'custom-svg',
};
