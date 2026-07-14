import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatCell, GameCard } from '../ui/GameCard';
import { holeNotation } from './geometry';
import { PEG_CATALOG } from './puzzles';
import { popcount } from './rules';
import type { PegSolitaireMove, PegSolitaireState } from './types';

export function formatPegSolitaireMove(
  move: PegSolitaireMove,
  _index: number,
  ctx: FormatMoveContext,
): string {
  return ctx.t('education.pegSolitaireMove', {
    from: holeNotation(move.from),
    over: holeNotation(move.over),
    to: holeNotation(move.to),
  });
}

export function PegSolitaireStatusCard({ gameState, solution }: StatusCardProps<PegSolitaireState>) {
  const { t } = useTranslation();
  const entry = gameState.catalogId
    ? PEG_CATALOG.find(e => e.id === gameState.catalogId)
    : undefined;
  const catalogOptimal = entry?.knownSolutionLength
    ?? (popcount(gameState.pegs) > 0 ? popcount(gameState.pegs) - 1 : null);
  const optimalDisplay = entry
    ? (catalogOptimal ?? '—')
    : (solution?.solvable ? solution.stats.solutionLength : (catalogOptimal ?? '—'));

  return (
    <GameCard title={t('education.currentState')} icon="◉">
      {entry && (
        <p className="mb-2 text-xs text-logic-indigo-600">
          {t(entry.titleKey)} · {t(`pegSolitaire.goal.${gameState.goal}`)}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <StatCell
          label={t('pegSolitaire.pegCount')}
          value={popcount(gameState.pegs)}
        />
        <StatCell
          label={t('education.optimalSteps')}
          value={optimalDisplay}
          colorClass="text-clarity-teal-dark"
        />
        <StatCell
          label={t('education.nodesExplored')}
          value={solution?.stats.nodesExplored ?? 0}
          colorClass="text-logic-indigo-700"
        />
      </div>
      <p className="mt-3 pt-3 border-t border-logic-indigo-100 text-[10px] text-logic-indigo-500 font-mono leading-relaxed">
        {t('pegSolitaire.notationLegend')}
      </p>
    </GameCard>
  );
}
