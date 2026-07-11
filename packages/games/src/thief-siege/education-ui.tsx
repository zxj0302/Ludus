import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { GameCard, StatCell } from '../ui/GameCard';
import { cellIndex } from './rules';
import { shortestEscapePath } from './solver';
import type { ThiefSiegeMove, ThiefSiegeState } from './types';

export function getThiefSiegeTierLabelKey(solverName?: string): string | null {
  const tier = solverName?.match(/^escape-adversary\/(perfect|bounded|bfs)$/)?.[1];
  return tier ? `thiefSiege.ai.tier.${tier}` : null;
}

export function formatThiefSiegeMove(
  move: ThiefSiegeMove,
  _index: number,
  ctx: FormatMoveContext,
): string {
  if (move.type === 'place') {
    return ctx.t('education.thiefSiegePlace', { row: move.row + 1, col: move.col + 1 });
  }
  return ctx.t('education.thiefSiegeStep', { row: move.row + 1, col: move.col + 1 });
}

export function ThiefSiegeStatusCard({ gameState, solution }: StatusCardProps<ThiefSiegeState>) {
  const { t } = useTranslation();
  const escapePath = shortestEscapePath(gameState);
  const exitCount = gameState.cells.filter(cell => cell === 'exit').length;
  const openCells = gameState.cells.filter(cell => cell === 'floor' || cell === 'exit').length;
  const statusKey = gameState.status === 'cop-win'
    ? 'thiefSiege.status.copWin'
    : gameState.status === 'thief-win'
      ? 'thiefSiege.status.thiefWin'
      : gameState.phase === 'cop'
        ? 'thiefSiege.phase.cop'
        : 'thiefSiege.phase.thief';
  const aiTierLabelKey = getThiefSiegeTierLabelKey(solution?.stats.solverName);

  return (
    <GameCard title={t('education.currentState')} icon="🚨">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('game.status.playing', { count: gameState.cops.length })} value={t(statusKey)} />
        <StatCell
          label={t('thiefSiege.cops')}
          value={t('thiefSiege.copsPlaced', { count: gameState.cops.length, max: gameState.maxCops })}
          colorClass="text-logic-indigo-700"
        />
        <StatCell
          label={t('thiefSiege.escapePath')}
          value={escapePath == null ? '—' : Math.max(0, escapePath.length - 1)}
          colorClass={escapePath == null ? 'text-clarity-teal-dark' : 'text-game-amber-700'}
        />
      </div>
      <div className="mt-3 pt-3 border-t border-warm-stone-200 grid grid-cols-3 gap-2 text-sm">
        <StatCell label={t('thiefSiege.exits')} value={exitCount} />
        <StatCell label={t('thiefSiege.openCells')} value={openCells} />
        <StatCell
          label={t(gameState.phase === 'thief' ? 'thiefSiege.ai.thinking' : 'education.nodesExplored')}
          value={aiTierLabelKey ? t(aiTierLabelKey) : solution?.stats.nodesExplored ?? '—'}
          colorClass={aiTierLabelKey ? 'text-logic-indigo-700' : undefined}
        />
      </div>
    </GameCard>
  );
}

export function cellKindLabelKey(state: ThiefSiegeState, row: number, col: number): string {
  const kind = state.cells[cellIndex(state.width, row, col)] ?? 'obstacle';
  return `thiefSiege.cell.${kind}`;
}
