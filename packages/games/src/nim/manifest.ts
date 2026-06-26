import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const nimEducationManifest: EducationManifest = {
  gameId: 'nim',
  l2ContentPaths: {
    'zh-CN': '/content/nim/l2.zh-CN.md',
    en: '/content/nim/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/nim/l3.zh-CN.md',
    en: '/content/nim/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '组合博弈论 — 不偏博弈 (Impartial Game)',
    en: 'Combinatorial Game Theory — Impartial Game',
  },
  complexityClass: 'P (Nim-sum XOR, O(k)); Polynomial for impartial games via Sprague-Grundy',
  knowledgeTags: ['组合博弈论', 'Nim', 'XOR', 'Sprague-Grundy', 'P-position', 'N-position', 'Bouton 定理'],
};

export const nimVisualizationManifest: VisualizationManifest = {
  gameId: 'nim',
  traceType: 'nim-xor',
  componentName: 'NimTreeViz',
  library: 'react-flow',
};
