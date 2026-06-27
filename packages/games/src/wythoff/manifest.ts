import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const wythoffEducationManifest: EducationManifest = {
  gameId: 'wythoff',
  l2ContentPaths: {
    'zh-CN': '/content/wythoff/l2.zh-CN.md',
    en: '/content/wythoff/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/wythoff/l3.zh-CN.md',
    en: '/content/wythoff/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '组合博弈论 — Wythoff 博弈 (Beatty 序列)',
    en: 'Combinatorial Game Theory — Wythoff\'s Game (Beatty Sequence)',
  },
  complexityClass: 'P (Beatty sequence check O(maxPile)); polynomial via floor of golden ratio multiples',
  knowledgeTags: ['组合博弈论', 'Wythoff', 'Beatty序列', '黄金比例', 'P-position', 'N-position', '不偏博弈'],
};

export const wythoffVisualizationManifest: VisualizationManifest = {
  gameId: 'wythoff',
  traceType: 'wythoff-beatty',
  componentName: 'WythoffTreeViz',
  library: 'react-flow',
};
