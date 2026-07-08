import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const nonogramEducationManifest: EducationManifest = {
  gameId: 'nonogram',
  l2ContentPaths: {
    'zh-CN': '/content/nonogram/l2.zh-CN.md',
    en: '/content/nonogram/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/nonogram/l3.zh-CN.md',
    en: '/content/nonogram/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '约束满足问题 (CSP) — 线求解与回溯搜索',
    en: 'Constraint Satisfaction Problem (CSP) — Line Solving & Backtracking',
  },
  complexityClass: 'NP-complete — decision problem is NP-complete (Ueda & Nagao, 1996)',
  knowledgeTags: ['CSP', '约束满足', '回溯搜索', '约束传播', 'NP-complete', '唯一解'],
};

export const nonogramVisualizationManifest: VisualizationManifest = {
  gameId: 'nonogram',
  traceType: 'constraint-propagation',
  componentName: 'NonogramTraceViz',
  library: 'custom-svg',
};
