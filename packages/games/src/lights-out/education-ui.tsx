import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatCell, GameCard } from '../ui/GameCard';
import type { LightsOutState, LightsOutMove } from './types';

export function formatLightsOutMove(
  move: LightsOutMove,
  _index: number,
  ctx: FormatMoveContext,
): string {
  return ctx.t('education.pressCell', { row: move.row + 1, col: move.col + 1 });
}

export function LightsOutStatusCard({ gameState, solution }: StatusCardProps<LightsOutState>) {
  const { t } = useTranslation();
  const onCount = gameState.grid.filter(c => c === 1).length;
  const totalCells = gameState.n * gameState.n;

  return (
    <GameCard title={t('education.currentState')} icon="🎯">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('education.litCells')} value={onCount} />
        <StatCell
          label={t('education.optimalSteps')}
          value={solution?.solvable ? solution.stats.solutionLength : '—'}
          colorClass="text-clarity-teal-dark"
        />
        <StatCell
          label={t('education.litRatio')}
          value={totalCells > 0 ? `${Math.round((onCount / totalCells) * 100)}%` : '0%'}
          colorClass="text-logic-indigo-700"
        />
      </div>
    </GameCard>
  );
}
