import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatCell, GameCard } from '../ui/GameCard';
import type { FifteenState, FifteenMove } from './types';

export function formatFifteenMove(
  move: FifteenMove,
  _index: number,
  ctx: FormatMoveContext,
): string {
  const row = Math.floor(move.tileIndex / 4);
  const col = move.tileIndex % 4;
  return ctx.t('education.fifteenMove', { row: row + 1, col: col + 1 });
}

export function FifteenStatusCard({ gameState, solution }: StatusCardProps<FifteenState>) {
  const { t } = useTranslation();
  let manhattanDist = 0;
  for (let i = 0; i < 16; i++) {
    const val = gameState.grid[i]!;
    if (val === 0) continue;
    const targetRow = Math.floor((val - 1) / 4);
    const targetCol = (val - 1) % 4;
    const currentRow = Math.floor(i / 4);
    const currentCol = i % 4;
    manhattanDist += Math.abs(targetRow - currentRow) + Math.abs(targetCol - currentCol);
  }

  return (
    <GameCard title={t('education.currentState')} icon="🧩">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('fifteen.manhattanDist')} value={manhattanDist} colorClass="text-clarity-teal-dark" />
        <StatCell
          label={t('fifteen.nodesExplored')}
          value={solution?.stats.nodesExplored ?? '—'}
          colorClass="text-logic-indigo-700"
        />
        <StatCell label={t('fifteen.solutionPath')} value={solution?.stats.solutionLength ?? '—'} />
      </div>
    </GameCard>
  );
}
