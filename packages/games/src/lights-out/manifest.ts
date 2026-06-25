import type { EducationManifest, VisualizationManifest } from '@ludus/core';

export const lightsOutEducationManifest: EducationManifest = {
  gameId: 'lights-out',
  l2ContentPaths: {
    'zh-CN': '/content/lights-out/l2.zh-CN.md',
    en: '/content/lights-out/l2.en.md',
  },
  l3ContentPaths: {
    'zh-CN': '/content/lights-out/l3.zh-CN.md',
    en: '/content/lights-out/l3.en.md',
  },
  abstractProblemName: {
    'zh-CN': 'GF(2) 线性方程组求解',
    en: 'Solving Linear Systems over GF(2)',
  },
  complexityClass: 'P (Gaussian elimination in O(n³))',
  knowledgeTags: ['线性代数', 'GF(2)', '高斯消元', '零空间', 'Hamming weight'],
};

export const lightsOutVisualizationManifest: VisualizationManifest = {
  gameId: 'lights-out',
  traceType: 'matrix-transform',
  componentName: 'MatrixViz',
  library: 'react-flow',
};

export const lightsOutSoundManifest = {
  gameId: 'lights-out',
  events: {
    toggle: { src: '/sounds/toggle.mp3', volume: 0.6 },
    solve: { src: '/sounds/solve.mp3', volume: 0.8 },
    win: { src: '/sounds/win.mp3', volume: 1.0 },
    error: { src: '/sounds/error.mp3', volume: 0.7 },
  },
};
