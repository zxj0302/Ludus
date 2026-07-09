import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatCell, GameCard } from '../ui/GameCard';
import type { SokobanState, SokobanMove } from './types';

export function formatSokobanMove(
  move: SokobanMove,
  _index: number,
  ctx: FormatMoveContext,
): string {
  return ctx.t(`education.move.${move.direction}`, move.direction as never);
}

export function SokobanStatusCard({ gameState, solution }: StatusCardProps<SokobanState>) {
  const { t } = useTranslation();
  const boxesOnGoals = useMemo(
    () => gameState.boxes.filter(b => gameState.goals.some(g => g.row === b.row && g.col === b.col)).length,
    [gameState.boxes, gameState.goals],
  );

  return (
    <GameCard title={t('education.currentState')} icon="📦">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('education.boxesPlaced')} value={`${boxesOnGoals}/${gameState.boxes.length}`} />
        <StatCell
          label={t('education.optimalSteps')}
          value={solution?.solvable ? solution.stats.solutionLength : '—'}
          colorClass="text-clarity-teal-dark"
        />
        <StatCell
          label={t('education.nodesExplored')}
          value={solution?.stats.nodesExplored ?? 0}
          colorClass="text-logic-indigo-700"
        />
      </div>
    </GameCard>
  );
}
