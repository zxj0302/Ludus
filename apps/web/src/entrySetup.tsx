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
  lightsOutEntry, sokobanEntry, sudokuEntry, nimEntry, wythoffEntry, fifteenEntry, waterJugEntry, nonogramEntry, pegSolitaireEntry, connectFourEntry, euclidsGameEntry, grundysGameEntry,
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

import l2zhPG from '@ludus/education/src/content/peg-solitaire/l2.zh-CN.md?raw';
import l2enPG from '@ludus/education/src/content/peg-solitaire/l2.en.md?raw';
import l3zhPG from '@ludus/education/src/content/peg-solitaire/l3.zh-CN.md?raw';
import l3enPG from '@ludus/education/src/content/peg-solitaire/l3.en.md?raw';

import l2zhC4 from '@ludus/education/src/content/connect-four/l2.zh-CN.md?raw';
import l2enC4 from '@ludus/education/src/content/connect-four/l2.en.md?raw';
import l3zhC4 from '@ludus/education/src/content/connect-four/l3.zh-CN.md?raw';
import l3enC4 from '@ludus/education/src/content/connect-four/l3.en.md?raw';

import l2zhEG from '@ludus/education/src/content/euclids-game/l2.zh-CN.md?raw';
import l2enEG from '@ludus/education/src/content/euclids-game/l2.en.md?raw';
import l3zhEG from '@ludus/education/src/content/euclids-game/l3.zh-CN.md?raw';
import l3enEG from '@ludus/education/src/content/euclids-game/l3.en.md?raw';

import l2zhGG from '@ludus/education/src/content/grundys-game/l2.zh-CN.md?raw';
import l2enGG from '@ludus/education/src/content/grundys-game/l2.en.md?raw';
import l3zhGG from '@ludus/education/src/content/grundys-game/l3.zh-CN.md?raw';
import l3enGG from '@ludus/education/src/content/grundys-game/l3.en.md?raw';

// Declarative entry setup — add new games here only
const EDUCATION_CONTENT: Record<string, Record<string, string>> = {
  'lights-out': { 'L2.zh-CN': l2zhLO, 'L2.en': l2enLO, 'L3.zh-CN': l3zhLO, 'L3.en': l3enLO },
  'sokoban':    { 'L2.zh-CN': l2zhSK, 'L2.en': l2enSK, 'L3.zh-CN': l3zhSK, 'L3.en': l3enSK },
  'sudoku':     { 'L2.zh-CN': l2zhSU, 'L2.en': l2enSU, 'L3.zh-CN': l3zhSU, 'L3.en': l3enSU },
  'nim':        { 'L2.zh-CN': l2zhNI, 'L2.en': l2enNI, 'L3.zh-CN': l3zhNI, 'L3.en': l3enNI },
  'wythoff':    { 'L2.zh-CN': l2zhWY, 'L2.en': l2enWY, 'L3.zh-CN': l3zhWY, 'L3.en': l3enWY },
  'fifteen':    { 'L2.zh-CN': l2zhFF, 'L2.en': l2enFF, 'L3.zh-CN': l3zhFF, 'L3.en': l3enFF },
  'water-jug':  { 'L2.zh-CN': l2zhWJ, 'L2.en': l2enWJ, 'L3.zh-CN': l3zhWJ, 'L3.en': l3enWJ },
  'nonogram':   { 'L2.zh-CN': l2zhNO, 'L2.en': l2enNO, 'L3.zh-CN': l3zhNO, 'L3.en': l3enNO },
  'peg-solitaire': { 'L2.zh-CN': l2zhPG, 'L2.en': l2enPG, 'L3.zh-CN': l3zhPG, 'L3.en': l3enPG },
  'connect-four': { 'L2.zh-CN': l2zhC4, 'L2.en': l2enC4, 'L3.zh-CN': l3zhC4, 'L3.en': l3enC4 },
  'euclids-game': { 'L2.zh-CN': l2zhEG, 'L2.en': l2enEG, 'L3.zh-CN': l3zhEG, 'L3.en': l3enEG },
  'grundys-game': { 'L2.zh-CN': l2zhGG, 'L2.en': l2enGG, 'L3.zh-CN': l3zhGG, 'L3.en': l3enGG },
};

const ENTRY_MAP = {
  'lights-out': lightsOutEntry,
  'sokoban': sokobanEntry,
  'sudoku': sudokuEntry,
  'nim': nimEntry,
  'wythoff': wythoffEntry,
  'fifteen': fifteenEntry,
  'water-jug': waterJugEntry,
  'nonogram': nonogramEntry,
  'peg-solitaire': pegSolitaireEntry,
  'connect-four': connectFourEntry,
  'euclids-game': euclidsGameEntry,
  'grundys-game': grundysGameEntry,
} as const;

for (const [gameId, entry] of Object.entries(ENTRY_MAP)) {
  entry.education = { content: EDUCATION_CONTENT[gameId]! };
}

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
const NonogramTraceViz = lazy(() => import('./components/NonogramTraceViz').then(m => ({ default: m.NonogramTraceViz })));
const PegSearchViz = lazy(() => import('./components/PegSearchViz').then(m => ({ default: m.PegSearchViz })));
const ConnectFourTreeViz = lazy(() => import('./components/ConnectFourTreeViz').then(m => ({ default: m.ConnectFourTreeViz })));
const EuclidPhiViz = lazy(() => import('./components/EuclidPhiViz').then(m => ({ default: m.EuclidPhiViz })));
const GrundyMexViz = lazy(() => import('./components/GrundyMexViz').then(m => ({ default: m.GrundyMexViz })));

const Fallback = ({ height = 'h-48' }: { height?: string }) => (
  <div className={`${height} rounded-card bg-warm-stone-100 animate-pulse`} />
);

lightsOutEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'matrix-transform',
  Component: (({ solution, solveStepIndex, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback />}>
      {lightsOutEntry.isOwnState(gameState) && (
        <MatrixViz solution={solution} solveStepIndex={solveStepIndex} gameState={gameState} />
      )}
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

sokobanEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'search-tree',
  Component: (({ gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback height="h-80" />}>
      {gameState && sokobanEntry.isOwnState(gameState) && <BFSTreeViz gameState={gameState} />}
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
      {gameState && nimEntry.isOwnState(gameState) && (
        <NimTreeViz key={gameState.piles.join(',')} trace={trace} state={gameState} />
      )}
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

wythoffEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'wythoff-beatty',
  Component: (({ trace, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback />}>
      {gameState && wythoffEntry.isOwnState(gameState) && (
        <WythoffTreeViz key={gameState.piles.join(',')} trace={trace} state={gameState} />
      )}
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

fifteenEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'a-star-search',
  Component: (({ trace, solution, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback height="h-80" />}>
      <FifteenTreeViz trace={trace} solution={solution} gameState={gameState} />
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

waterJugEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'bfs-state-search',
  Component: (({ trace, solution, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback height="h-80" />}>
      <WaterJugTreeViz trace={trace} solution={solution} gameState={gameState} />
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

nonogramEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'constraint-propagation',
  Component: (({ trace, solution }: VisualizationProps) => (
    <Suspense fallback={<Fallback height="h-48" />}>
      <NonogramTraceViz trace={trace} solution={solution} />
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

pegSolitaireEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'search-tree',
  Component: (({ trace, solution, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback height="h-80" />}>
      {gameState && pegSolitaireEntry.isOwnState(gameState) && (
        <PegSearchViz trace={trace} solution={solution} />
      )}
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

connectFourEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'minimax-tree',
  Component: (({ trace, solution }: VisualizationProps) => (
    <Suspense fallback={<Fallback />}>
      <ConnectFourTreeViz trace={trace} solution={solution} />
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

euclidsGameEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'euclid-phi',
  Component: (({ trace, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback />}>
      {gameState && euclidsGameEntry.isOwnState(gameState) && (
        <EuclidPhiViz key={gameState.piles.join(',')} trace={trace} state={gameState} />
      )}
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

grundysGameEntry.visualization = {
  matchTrace: (trace: SolverTrace) => trace.type === 'grundy-mex',
  Component: (({ trace, gameState }: VisualizationProps) => (
    <Suspense fallback={<Fallback />}>
      {gameState && grundysGameEntry.isOwnState(gameState) && (
        <GrundyMexViz key={gameState.piles.join(',')} trace={trace} state={gameState} />
      )}
    </Suspense>
  )) as ComponentType<VisualizationProps>,
};

// ═══════════════════════════════════════════════════════════════
// 3. UI extensions — web 专属 toolbar
// ═══════════════════════════════════════════════════════════════

import { SokobanToolbar } from './components/SokobanToolbar';
import { PegSolitaireToolbar } from './components/PegSolitaireToolbar';
import { GeneratorToolbar } from './components/GeneratorToolbar';

const TOOLBAR_SLOTS: Partial<Record<keyof typeof ENTRY_MAP, ComponentType<{ onNewLevel: () => void; dispatch?: (action: { type: string; payload: unknown }) => void }>>> = {
  'sokoban': SokobanToolbar,
  'peg-solitaire': PegSolitaireToolbar,
  'fifteen': GeneratorToolbar,
  'water-jug': GeneratorToolbar,
  'nonogram': GeneratorToolbar,
  'connect-four': GeneratorToolbar,
  'euclids-game': GeneratorToolbar,
  'grundys-game': GeneratorToolbar,
};

for (const [gameId, toolbar] of Object.entries(TOOLBAR_SLOTS)) {
  const entry = ENTRY_MAP[gameId as keyof typeof ENTRY_MAP];
  if (entry && toolbar) {
    entry.ui = { ...entry.ui, toolbarSlot: toolbar };
  }
}
