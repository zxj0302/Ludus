// 游戏状态卡片 — 每款游戏的状态信息展示
// EducationPanel 通过此模块渲染，无需 import 游戏专属类型或函数

import { useMemo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameState, Solution } from '@ludus/core';
import { computeNimSum, isWythoffPPosition } from '@ludus/games';
import type {
  LightsOutState, SokobanState, SudokuState, NimState, WythoffState,
} from '@ludus/games';
import { KnowledgeCard } from './components/KnowledgeCard';
import { getVizComponent } from './vizComponents';

interface Props {
  gameId: string;
  gameState: GameState | null;
  solution: Solution | null;
  solvePlayback: boolean;
  solveStepIndex: number;
}

export function StatusCard({ gameId, gameState, solution }: Props) {
  const { t } = useTranslation();

  const VizComponent = getVizComponent(solution?.trace as any);

  switch (gameId) {
    case 'lights-out': {
      const s = gameState as LightsOutState | null;
      const onCount = s?.grid?.filter(c => c === 1).length ?? 0;
      const totalCells = s ? s.n * s.n : 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🎯">
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('education.litCells')}</div>
              <div className="text-lg font-bold text-game-amber-700">{onCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('education.litRatio')}</div>
              <div className="text-lg font-bold text-game-amber-700">
                {totalCells > 0 ? Math.round((onCount / totalCells) * 100) : 0}%
              </div>
            </div>
            {VizComponent && <Suspense><VizComponent solution={solution} solveStepIndex={0} gameState={gameState} trace={solution?.trace} /></Suspense>}
          </div>
        </KnowledgeCard>
      );
    }
    case 'sokoban': {
      const s = gameState as Record<string, unknown> | null;
      const boxes = (s?.boxes as Array<{row: number; col: number}> | undefined) ?? [];
      const goals = (s?.goals as Array<{row: number; col: number}> | undefined) ?? [];
      const onGoals = useMemo(() =>
        boxes.filter(b => goals.some(g => g.row === b.row && g.col === b.col)).length,
        [boxes, goals]
      );
      return (
        <KnowledgeCard title={t('education.currentState')} icon="📦">
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('education.boxesPlaced')}</div>
              <div className="text-lg font-bold text-clarity-teal-700">{onGoals}/{boxes.length}</div>
            </div>
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('education.nodesExplored')}</div>
              <div className="text-lg font-bold text-clarity-teal-700">
                {solution?.trace?.type === 'search-tree' ? '—' : '—'}
              </div>
            </div>
            {VizComponent && <Suspense><VizComponent solution={solution} solveStepIndex={0} gameState={gameState} trace={solution?.trace} /></Suspense>}
          </div>
        </KnowledgeCard>
      );
    }
    case 'sudoku': {
      const s = gameState as SudokuState | null;
      const emptyCount = s?.grid?.filter((v, i) => v === 0 && !s.givenMask[i]).length ?? 0;
      const givenCount = s?.givenMask?.filter(Boolean).length ?? 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🧩">
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('education.sudokuEmpty')}</div>
              <div className="text-lg font-bold text-logic-indigo-700">{emptyCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('education.sudokuGivens')}</div>
              <div className="text-lg font-bold text-logic-indigo-700">{givenCount}</div>
            </div>
            {VizComponent && <Suspense><VizComponent solution={solution} solveStepIndex={0} gameState={gameState} trace={solution?.trace} /></Suspense>}
          </div>
        </KnowledgeCard>
      );
    }
    case 'nim': {
      const s = gameState as NimState | null;
      const nimSum = s?.piles ? computeNimSum(s.piles) : 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🪨">
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('nim.piles')}</div>
              <div className="text-lg font-bold text-warm-stone-800">
                {s?.piles?.join(', ') ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('nim.nimSum')}</div>
              <div className="text-lg font-bold text-warm-stone-800">{nimSum}</div>
            </div>
            {VizComponent && <Suspense><VizComponent solution={solution} solveStepIndex={0} gameState={gameState} trace={solution?.trace} /></Suspense>}
          </div>
        </KnowledgeCard>
      );
    }
    case 'wythoff': {
      const s = gameState as WythoffState | null;
      const isP = s?.piles ? isWythoffPPosition(s.piles[0]!, s.piles[1]!) : false;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="⚖️">
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('wythoff.piles')}</div>
              <div className="text-lg font-bold text-warm-stone-800">
                {s?.piles?.join(', ') ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-warm-stone-500">{t('wythoff.beattyPair')}</div>
              <div className="text-lg font-bold text-warm-stone-800">
                {isP ? t('wythoff.pPosition') : t('wythoff.nPosition')}
              </div>
            </div>
            {VizComponent && <Suspense><VizComponent solution={solution} solveStepIndex={0} gameState={gameState} trace={solution?.trace} /></Suspense>}
          </div>
        </KnowledgeCard>
      );
    }
    default:
      return null;
  }
}
