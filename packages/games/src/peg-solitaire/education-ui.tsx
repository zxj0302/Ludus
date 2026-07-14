import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatCell, GameCard } from '../ui/GameCard';
import { legalMoves, popcount } from './rules';
import type { PegSolitaireMove, PegSolitaireState } from './types';

function holeLabel(hole: number): string {
  return `#${hole + 1}`;
}

export function formatPegSolitaireMove(
  move: PegSolitaireMove,
  _index: number,
  ctx: FormatMoveContext,
): string {
  return ctx.t('education.pegSolitaireMove', {
    from: holeLabel(move.from),
    over: holeLabel(move.over),
    to: holeLabel(move.to),
  });
}

export function PegSolitaireStatusCard({ gameState, solution }: StatusCardProps<PegSolitaireState>) {
  const { t } = useTranslation();
  const viz = solution?.trace?.visualizationData as { symmetry?: string; search?: string } | undefined;

  return (
    <GameCard title={t('education.currentState')} icon="◉">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <StatCell
          label={t('pegSolitaire.pegCount')}
          value={popcount(gameState.pegs)}
          colorClass="text-game-amber-700"
        />
        <StatCell
          label={t('pegSolitaire.legalMoves')}
          value={legalMoves(gameState).length}
          colorClass="text-logic-indigo-700"
        />
        <StatCell
          label={t('education.optimalSteps')}
          value={solution?.solvable ? solution.stats.solutionLength : '—'}
          colorClass="text-clarity-teal-dark"
        />
      </div>
      <div className="mt-3 pt-3 border-t border-warm-stone-200 grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('pegSolitaire.goal')} value={t(`pegSolitaire.goal.${gameState.goal}`)} />
        <StatCell label={t('pegSolitaire.symmetry')} value={viz?.symmetry ?? t('pegSolitaire.d4')} />
        <StatCell label={t('pegSolitaire.searchMode')} value={viz?.search ?? '—'} />
      </div>
    </GameCard>
  );
}
