import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, SolutionPreviewProps, StatusCardProps } from '../types';
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

export function NonogramSolutionPreview({ solution }: SolutionPreviewProps<NonogramState>) {
  const { t } = useTranslation();
  const vizData = solution.trace?.visualizationData as { solutionGrid?: boolean[][] | null } | undefined;
  const solGrid = vizData?.solutionGrid ?? null;
  const w = solGrid?.[0]?.length ?? 0;

  if (!solGrid || w === 0) {
    return <p className="text-xs text-warm-stone-500">{t('nonogram.noTrace')}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-[10px] text-warm-stone-500">{t('nonogram.solutionPreview')}</div>
      <div
        className="grid border-2 border-warm-stone-500"
        style={{
          gridTemplateColumns: `repeat(${w}, 1fr)`,
          width: Math.min(200, w * 20),
        }}
      >
        {solGrid.flat().map((filled, i) => (
          <div
            key={i}
            className="border-[0.5px] border-warm-stone-300"
            style={{
              aspectRatio: '1',
              background: filled ? '#292524' : '#fafaf9',
            }}
          />
        ))}
      </div>
    </div>
  );
}
