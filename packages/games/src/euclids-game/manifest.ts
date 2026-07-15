import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const euclidsGameEducationManifest: EducationManifest = {
  gameId: 'euclids-game',
  l2ContentPaths: {
    'zh-CN': '/content/euclids-game/l2.zh-CN.md',
    en: '/content/euclids-game/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/euclids-game/l3.zh-CN.md',
    en: '/content/euclids-game/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': '组合博弈论 — 欧几里得博弈',
    en: "Combinatorial Game Theory — Euclid's Game",
  },
  complexityClass: 'P (φ criterion + gcd structure; O(log n) per move)',
  knowledgeTags: ['组合博弈论', '欧几里得算法', '黄金比例', 'P-position', 'N-position', 'gcd'],
};

export const euclidsGameVisualizationManifest: VisualizationManifest = {
  gameId: 'euclids-game',
  traceType: 'euclid-phi',
  componentName: 'EuclidPhiViz',
  library: 'custom-svg',
};
