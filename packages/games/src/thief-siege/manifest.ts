import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const thiefSiegeEducationManifest: EducationManifest = {
  gameId: 'thief-siege',
  l2ContentPaths: {
    'zh-CN': '/content/thief-siege/l2.zh-CN.md',
    en: '/content/thief-siege/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/thief-siege/l3.zh-CN.md',
    en: '/content/thief-siege/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '图上的追逃与割点围堵',
    en: 'Graph Pursuit-Evasion and Cutoff Placement',
  },
  complexityClass: 'Finite graph search — shortest escape path by BFS; placement policy uses local cut heuristics',
  knowledgeTags: ['图论', 'BFS', '追逃博弈', '最短路', '割点', '启发式搜索'],
};

export const thiefSiegeVisualizationManifest: VisualizationManifest = {
  gameId: 'thief-siege',
  traceType: 'escape-path',
  componentName: 'EscapePathViz',
  library: 'custom-svg',
};
