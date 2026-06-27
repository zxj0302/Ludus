// 游戏状态卡片 — 每款游戏的状态信息展示
// EducationPanel 通过此模块渲染，无需 import 游戏专属类型或函数

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameState, Solution } from '@ludus/core';
import { computeNimSum, isWythoffPPosition } from '@ludus/games';
import type {
  LightsOutState, SokobanState, SudokuState, NimState, WythoffState,
} from '@ludus/games';
import { KnowledgeCard } from './components/KnowledgeCard';

function StatCell({ label, value, colorClass = 'text-game-amber-700' }: { label: string; value: string | number; colorClass?: string }) {
  return (
    <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
      <div className="text-[10px] text-warm-stone-500">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-warm-stone-50 rounded-lg p-2">
      <div className="text-warm-stone-500 text-xs">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}

interface Props {
  gameId: string;
  gameState: GameState | null;
  solution: Solution | null;
  solvePlayback: boolean;
  solveStepIndex: number;
}

export function StatusCard({ gameId, gameState, solution }: Props) {
  const { t } = useTranslation();

  switch (gameId) {
    case 'lights-out': {
      const s = gameState as LightsOutState | null;
      const onCount = s?.grid?.filter(c => c === 1).length ?? 0;
      const totalCells = s ? s.n * s.n : 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🎯">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCell label={t('education.litCells')} value={onCount} />
            <StatCell label={t('education.optimalSteps')} value={solution?.solvable ? solution.stats.solutionLength : '—'} colorClass="text-clarity-teal-dark" />
            <StatCell label={t('education.litRatio')} value={totalCells > 0 ? `${Math.round((onCount / totalCells) * 100)}%` : '0%'} colorClass="text-logic-indigo-700" />
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
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCell label={t('education.boxesPlaced')} value={`${onGoals}/${boxes.length}`} />
            <StatCell label={t('education.optimalSteps')} value={solution?.solvable ? solution.stats.solutionLength : '—'} colorClass="text-clarity-teal-dark" />
            <StatCell label={t('education.nodesExplored')} value={solution?.stats.nodesExplored ?? 0} colorClass="text-logic-indigo-700" />
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
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCell label={t('education.sudokuEmpty')} value={emptyCount} />
            <StatCell label={t('education.sudokuGivens')} value={givenCount} colorClass="text-clarity-teal-dark" />
            <StatCell label={t('education.sudokuSolver')} value="DLX" colorClass="text-logic-indigo-700" />
          </div>
        </KnowledgeCard>
      );
    }
    case 'nim': {
      const s = gameState as NimState | null;
      const nimSum = s?.piles ? computeNimSum(s.piles) : 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="🪨">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <StatBlock label={t('nim.piles')} value={s?.piles?.join(', ') ?? '—'} />
            <StatBlock label={t('nim.nimSum')} value={nimSum} />
          </div>
        </KnowledgeCard>
      );
    }
    case 'wythoff': {
      const s = gameState as WythoffState | null;
      const isP = s?.piles && s.piles.length >= 2 ? isWythoffPPosition(s.piles[0]!, s.piles[1]!) : false;
      const k = s?.piles ? Math.abs(s.piles[1]! - s.piles[0]!) : 0;
      return (
        <KnowledgeCard title={t('education.currentState')} icon="⚖️">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <StatBlock label={t('wythoff.piles')} value={s?.piles ? `${s.piles[0]}, ${s.piles[1]}` : '—'} />
            <StatBlock label={t('wythoff.beattyPair')} value={`k=${k}, ${isP ? 'P' : 'N'}`} />
          </div>
        </KnowledgeCard>
      );
    }
    default:
      return null;
  }
}
