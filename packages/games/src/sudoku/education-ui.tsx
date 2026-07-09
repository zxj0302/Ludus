import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatCell, GameCard } from '../ui/GameCard';
import type { SudokuState, SudokuMove } from './types';

export function formatSudokuMove(
  move: SudokuMove,
  _index: number,
  ctx: FormatMoveContext,
): string {
  return ctx.t('education.sudokuCell', { row: move.row + 1, col: move.col + 1, value: move.value });
}

export function SudokuStatusCard({ gameState, solution }: StatusCardProps<SudokuState>) {
  const { t } = useTranslation();
  const emptyCount = gameState.grid.filter((v, i) => v === 0 && !gameState.givenMask[i]).length;
  const givenCount = gameState.givenMask.filter(Boolean).length;

  return (
    <GameCard title={t('education.currentState')} icon="🧩">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('education.sudokuEmpty')} value={emptyCount} />
        <StatCell label={t('education.sudokuGivens')} value={givenCount} colorClass="text-clarity-teal-dark" />
        <StatCell
          label={t('education.sudokuSolver')}
          value={solution?.stats.solverName ?? '—'}
          colorClass="text-logic-indigo-700"
        />
      </div>
    </GameCard>
  );
}
