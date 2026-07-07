import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const fifteenEducationManifest: EducationManifest = {
  gameId: 'fifteen',
  l2ContentPaths: {
    'zh-CN': '/content/fifteen/l2.zh-CN.md',
    en: '/content/fifteen/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/fifteen/l3.zh-CN.md',
    en: '/content/fifteen/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '启发式搜索 — A* 算法与可采纳启发式',
    en: 'Heuristic Search — A* Algorithm and Admissible Heuristics',
  },
  complexityClass: 'NP-hard (general n×n); 4×4 instance solves in < 1s with A* + Manhattan heuristic',
  knowledgeTags: ['启发式搜索', 'A*', '曼哈顿距离', '可采纳启发式', '优先队列', '状态空间搜索'],
};

export const fifteenVisualizationManifest: VisualizationManifest = {
  gameId: 'fifteen',
  traceType: 'a-star-search',
  componentName: 'FifteenTreeViz',
  library: 'custom-svg',
};
