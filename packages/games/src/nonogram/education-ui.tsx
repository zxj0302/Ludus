import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatCell, GameCard } from '../ui/GameCard';
import type { NonogramState, NonogramMove } from './types';

export function formatNonogramMove(
  move: NonogramMove,
  _index: number,
  ctx: FormatMoveContext,
): string {
  if (move.action === 'fill') return ctx.t('education.nonogramFill', { row: move.row + 1, col: move.col + 1 });
  return ctx.t('education.nonogramCross', { row: move.row + 1, col: move.col + 1 });
}

export function NonogramStatusCard({ gameState, solution }: StatusCardProps<NonogramState>) {
  const { t } = useTranslation();
  const filledCount = gameState.grid.flat().filter(c => c === 1).length;
  const totalCells = gameState.width * gameState.height;
  const nodesExplored = solution?.stats.nodesExplored ?? '—';
  const hasGeneratorLineSolve = gameState.lineSolveCells > 0;

  return (
    <GameCard title={t('education.currentState')} icon="🧩">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('nonogram.cells')} value={`${filledCount}/${totalCells}`} colorClass="text-clarity-teal-dark" />
        <StatCell label={t('nonogram.lineSolved')} value={gameState.lineSolveCells} colorClass="text-logic-indigo-700" />
        <StatCell label={t('nonogram.backtrackDepth')} value={gameState.maxBacktrackDepth} />
      </div>
      <div className="mt-3 pt-3 border-t border-warm-stone-200 grid grid-cols-2 gap-2 text-sm">
        {/* Nonogram generator guarantees unique solutions via countSolutions(2) === 1 */}
        <StatCell
          label={t('nonogram.uniqueSolution')}
          value={hasGeneratorLineSolve ? '✅' : '—'}
          colorClass="text-clarity-teal-dark"
        />
        <StatCell label={t('nonogram.nodesExplored')} value={nodesExplored} colorClass="text-logic-indigo-700" />
      </div>
    </GameCard>
  );
}
