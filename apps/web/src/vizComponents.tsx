// 可视化组件懒加载注册表 — 按 trace.type 匹配
// EducationPanel 通过此模块获取组件，无需 import 任何游戏专属模块

import { lazy, Suspense, type ComponentType } from 'react';
import type { Solution, GameState, SolverTrace } from '@ludus/core';

const MatrixViz = lazy(() => import('./components/MatrixViz').then(m => ({ default: m.MatrixViz })));
const BFSTreeViz = lazy(() => import('./components/BFSTreeViz'));
const DLXMatrixViz = lazy(() => import('./components/DLXMatrixViz').then(m => ({ default: m.DLXMatrixViz })));
const NimTreeViz = lazy(() => import('./components/NimTreeViz').then(m => ({ default: m.NimTreeViz })));
const WythoffTreeViz = lazy(() => import('./components/WythoffTreeViz').then(m => ({ default: m.WythoffTreeViz })));

interface VizProps {
  solution: Solution | null;
  solveStepIndex: number;
  gameState: GameState | null;
  trace?: SolverTrace;
}

// Wrappers that normalize prop interfaces
const VizWrappers: Record<string, ComponentType<VizProps>> = {
  'matrix-transform': ({ solution, solveStepIndex, gameState }) => (
    <Suspense fallback={<div className="h-48 rounded-card bg-warm-stone-100 animate-pulse" />}>
      <MatrixViz solution={solution!} solveStepIndex={solveStepIndex} gameState={gameState as any} />
    </Suspense>
  ),
  'search-tree': ({ gameState }) => (
    <Suspense fallback={<div className="h-80 rounded-card bg-warm-stone-100 animate-pulse" />}>
      {gameState && <BFSTreeViz gameState={gameState as any} />}
    </Suspense>
  ),
  'constraint-propagation': ({ solution, solveStepIndex }) => (
    <Suspense fallback={<div className="h-40 rounded-card bg-warm-stone-100 animate-pulse" />}>
      <DLXMatrixViz solution={solution!} activeStep={solveStepIndex} />
    </Suspense>
  ),
  'nim-xor': ({ trace, gameState }) => (
    <Suspense fallback={<div className="h-48 bg-warm-stone-100 rounded-lg animate-pulse" />}>
      {gameState && <NimTreeViz key={(gameState as any).piles?.join(',')} trace={trace} state={gameState as any} />}
    </Suspense>
  ),
  'wythoff-beatty': ({ trace, gameState }) => (
    <Suspense fallback={<div className="h-48 bg-warm-stone-100 rounded-lg animate-pulse" />}>
      {gameState && <WythoffTreeViz key={(gameState as any).piles?.join(',')} trace={trace} state={gameState as any} />}
    </Suspense>
  ),
};

export function getVizComponent(trace: SolverTrace | undefined): ComponentType<VizProps> | null {
  if (!trace) return null;
  return VizWrappers[trace.type] ?? null;
}
