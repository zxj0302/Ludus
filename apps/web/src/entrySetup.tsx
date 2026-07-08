// Web 层入口配置 — 注入 web 专属依赖到各游戏 entry
// 在 main.tsx 中尽早 import，确保 education content / viz / toolbar 就绪
//
// 需要 web 专属能力的数据：
//   - education.content：.md 文件需 Vite ?raw import
//   - visualization：viz 组件在 apps/web 中，需 lazy import
//   - ui.toolbarSlot：Sokoban toolbar 依赖 web 专属 hook

import { lazy, Suspense, type ComponentType } from 'react';
import type { Solution, GameState, SolverTrace } from '@ludus/core';
import type { VisualizationProps } from '@ludus/games';
import {
  lightsOutEntry, sokobanEntry, sudokuEntry, nimEntry, wythoffEntry, fifteenEntry, waterJugEntry, nonogramEntry,
} from '@ludus/games';

// ═══════════════════════════════════════════════════════════════
// 1. Education content — .md 文件（?raw import，仅 Vite 支持）
// ═══════════════════════════════════════════════════════════════

import l2zhLO from '@ludus/education/src/content/lights-out/l2.zh-CN.md?raw';
import l2enLO from '@ludus/education/src/content/lights-out/l2.en.md?raw';
import l3zhLO from '@ludus/education/src/content/lights-out/l3.zh-CN.md?raw';
import l3enLO from '@ludus/education/src/content/lights-out/l3.en.md?raw';

import l2zhSK from '@ludus/education/src/content/sokoban/l2.zh-CN.md?raw';
import l2enSK from '@ludus/education/src/content/sokoban/l2.en.md?raw';
import l3zhSK from '@ludus/education/src/content/sokoban/l3.zh-CN.md?raw';
import l3enSK from '@ludus/education/src/content/sokoban/l3.en.md?raw';

import l2zhSU from '@ludus/education/src/content/sudoku/l2.zh-CN.md?raw';
import l2enSU from '@ludus/education/src/content/sudoku/l2.en.md?raw';
import l3zhSU from '@ludus/education/src/content/sudoku/l3.zh-CN.md?raw';
import l3enSU from '@ludus/education/src/content/sudoku/l3.en.md?raw';

import l2zhNI from '@ludus/education/src/content/nim/l2.zh-CN.md?raw';
import l2enNI from '@ludus/education/src/content/nim/l2.en.md?raw';
import l3zhNI from '@ludus/education/src/content/nim/l3.zh-CN.md?raw';
import l3enNI from '@ludus/education/src/content/nim/l3.en.md?raw';

import l2zhWY from '@ludus/education/src/content/wythoff/l2.zh-CN.md?raw';
import l2enWY from '@ludus/education/src/content/wythoff/l2.en.md?raw';
import l3zhWY from '@ludus/education/src/content/wythoff/l3.zh-CN.md?raw';
import l3enWY from '@ludus/education/src/content/wythoff/l3.en.md?raw';

import l2zhFF from '@ludus/education/src/content/fifteen/l2.zh-CN.md?raw';
import l2enFF from '@ludus/education/src/content/fifteen/l2.en.md?raw';
import l3zhFF from '@ludus/education/src/content/fifteen/l3.zh-CN.md?raw';
import l3enFF from '@ludus/education/src/content/fifteen/l3.en.md?raw';

import l2zhWJ from '@ludus/education/src/content/water-jug/l2.zh-CN.md?raw';
import l2enWJ from '@ludus/education/src/content/water-jug/l2.en.md?raw';
import l3zhWJ from '@ludus/education/src/content/water-jug/l3.zh-CN.md?raw';
import l3enWJ from '@ludus/education/src/content/water-jug/l3.en.md?raw';

import l2zhNO from '@ludus/education/src/content/nonogram/l2.zh-CN.md?raw';
import l2enNO from '@ludus/education/src/content/nonogram/l2.en.md?raw';
import l3zhNO from '@ludus/education/src/content/nonogram/l3.zh-CN.md?raw';
import l3enNO from '@ludus/education/src/content/nonogram/l3.en.md?raw';

lightsOutEntry.education = {
  content: { 'L2.zh-CN': l2zhLO, 'L2.en': l2enLO, 'L3.zh-CN': l3zhLO, 'L3.en': l3enLO },
};
sokobanEntry.education = {
  content: { 'L2.zh-CN': l2zhSK, 'L2.en': l2enSK, 'L3.zh-CN': l3zhSK, 'L3.en': l3enSK },
};
sudokuEntry.education = {
  content: { 'L2.zh-CN': l2zhSU, 'L2.en': l2enSU, 'L3.zh-CN': l3zhSU, 'L3.en': l3enSU },
};
nimEntry.education = {
  content: { 'L2.zh-CN': l2zhNI, 'L2.en': l2enNI, 'L3.zh-CN': l3zhNI, 'L3.en': l3enNI },
};
wythoffEntry.education = {
  content: { 'L2.zh-CN': l2zhWY, 'L2.en': l2enWY, 'L3.zh-CN': l3zhWY, 'L3.en': l3enWY },
};

fifteenEntry.education = {
  content: { 'L2.zh-CN': l2zhFF, 'L2.en': l2enFF, 'L3.zh-CN': l3zhFF, 'L3.en': l3enFF },
};

waterJugEntry.education = {
  content: { 'L2.zh-CN': l2zhWJ, 'L2.en': l2enWJ, 'L3.zh-CN': l3zhWJ, 'L3.en': l3enWJ },
};

nonogramEntry.education = {
  content: { 'L2.zh-CN': l2zhNO, 'L2.en': l2enNO, 'L3.zh-CN': l3zhNO, 'L3.en': l3enNO },
};

// ═══════════════════════════════════════════════════════════════
// 2. Visualization — viz 组件（lazy import）
// ═══════════════════════════════════════════════════════════════

const MatrixViz = lazy(() => import('./components/MatrixViz').then(m => ({ default: m.MatrixViz })));
const BFSTreeViz = lazy(() => import('./components/BFSTreeViz'));
const DLXMatrixViz = lazy(() => import('./components/DLXMatrixViz').then(m => ({ default: m.DLXMatrixViz })));
const NimTreeViz = lazy(() => import('./components/NimTreeViz').then(m => ({ default: m.NimTreeViz })));
const WythoffTreeViz = lazy(() => import('./components/WythoffTreeViz').then(m => ({ default: m.WythoffTreeViz })));
const FifteenTreeViz = lazy(() => import('./components/FifteenTreeViz').then(m => ({ default: m.FifteenTreeViz })));
const WaterJugTreeViz = lazy(() => import('./components/WaterJugTreeViz').then(m => ({ default: m.WaterJugTreeViz })));

const Fallback = ({ height = 'h-48' }: { height?: string }) => (
  <div className={`${height} rounded-card bg-warm-stone-100 animate-pulse`} />
);

lightsOutEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'matrix-transform',
  Component: (({ solution, solveStepIndex, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback />}>
      <MatrixViz solution={solution} solveStepIndex={solveStepIndex} gameState={gameState as any} />
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

sokobanEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'search-tree',
  Component: (({ gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback height="h-80" />}>
      {gameState && <BFSTreeViz gameState={gameState as any} />}
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

sudokuEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'constraint-propagation',
  Component: (({ solution, solveStepIndex }: VisualizationProps) => (
    <Suspense fallback={<Fallback />}>
      <DLXMatrixViz solution={solution} activeStep={solveStepIndex} />
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

nimEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'nim-xor',
  Component: (({ trace, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback />}>
      {gameState && <NimTreeViz key={(gameState as any).piles?.join(',')} trace={trace} state={gameState as any} />}
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

wythoffEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'wythoff-beatty',
  Component: (({ trace, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback />}>
      {gameState && <WythoffTreeViz key={(gameState as any).piles?.join(',')} trace={trace} state={gameState as any} />}
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

fifteenEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'a-star-search',
  Component: (({ trace, solution, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback height="h-80" />}>
      <FifteenTreeViz trace={trace} solution={solution} gameState={gameState as any} />
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

waterJugEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'bfs-state-search',
  Component: (({ trace, solution, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback height="h-80" />}>
      <WaterJugTreeViz trace={trace} solution={solution} gameState={gameState as any} />
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

// ═══════════════════════════════════════════════════════════════
// 3. UI extensions — web 专属 toolbar
// ═══════════════════════════════════════════════════════════════

import { SokobanToolbar } from './components/SokobanToolbar';
import { FifteenToolbar } from './components/FifteenToolbar';
import { WaterJugToolbar } from './components/WaterJugToolbar';

sokobanEntry.ui = {
  ...sokobanEntry.ui,
  toolbarSlot: SokobanToolbar as any,
};

fifteenEntry.ui = {
  toolbarSlot: FifteenToolbar as any,
};

waterJugEntry.ui = {
  toolbarSlot: WaterJugToolbar as any,
};
