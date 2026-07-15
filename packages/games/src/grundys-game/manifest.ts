import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const grundysGameEducationManifest: EducationManifest = {
  gameId: 'grundys-game',
  l2ContentPaths: {
    'zh-CN': '/content/grundys-game/l2.zh-CN.md',
    en: '/content/grundys-game/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/grundys-game/l3.zh-CN.md',
    en: '/content/grundys-game/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '组合博弈论 — Grundy 博弈 / Sprague–Grundy',
    en: "Combinatorial Game Theory — Grundy's Game / Sprague–Grundy",
  },
  complexityClass: 'P (memoized mex; O(n²) fill table up to max heap)',
  knowledgeTags: ['组合博弈论', 'Sprague-Grundy', 'mex', 'Nimber', 'P-position', 'N-position'],
};

export const grundysGameVisualizationManifest: VisualizationManifest = {
  gameId: 'grundys-game',
  traceType: 'grundy-mex',
  componentName: 'GrundyMexViz',
  library: 'dom',
};
