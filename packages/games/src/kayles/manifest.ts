import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const kaylesEducationManifest: EducationManifest = {
  gameId: 'kayles',
  l2ContentPaths: {
    'zh-CN': '/content/kayles/l2.zh-CN.md',
    en: '/content/kayles/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/kayles/l3.zh-CN.md',
    en: '/content/kayles/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '组合博弈论 — Kayles / Sprague–Grundy',
    en: 'Combinatorial Game Theory — Kayles / Sprague–Grundy',
  },
  complexityClass: 'P (memoized mex; O(n²) fill table up to max chain)',
  knowledgeTags: ['组合博弈论', 'Kayles', 'Sprague-Grundy', 'mex', 'octal', 'P-position', 'N-position'],
};

export const kaylesVisualizationManifest: VisualizationManifest = {
  gameId: 'kayles',
  traceType: 'kayles-mex',
  componentName: 'KaylesMexViz',
  library: 'dom',
};
