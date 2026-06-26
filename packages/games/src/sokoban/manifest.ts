import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const sokobanEducationManifest: EducationManifest = {
  gameId: 'sokoban',
  l2ContentPaths: {
    'zh-CN': '/content/sokoban/l2.zh-CN.md',
    en: '/content/sokoban/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/sokoban/l3.zh-CN.md',
    en: '/content/sokoban/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '状态空间最短路径搜索',
    en: 'Shortest Path Search in State Space',
  },
  complexityClass: 'PSPACE-complete (Culberson 1997 — harder than NP-complete)',
  knowledgeTags: ['BFS', '状态空间', '死锁检测', '启发式搜索', 'PSPACE'],
};

export const sokobanVisualizationManifest: VisualizationManifest = {
  gameId: 'sokoban',
  traceType: 'search-tree',
  componentName: 'BFSTreeViz',
  library: 'custom-svg',
};
