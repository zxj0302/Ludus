import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatBlock, GameCard } from '../ui/GameCard';
import type { NimState, NimMove } from './types';
import { computeNimSum } from './solver';

export function formatNimMove(
  move: NimMove,
  index: number,
  ctx: FormatMoveContext,
): string {
  const isPlayer = ctx.playersFirst ? index % 2 === 0 : index % 2 === 1;
  return (isPlayer ? '🧑 ' : '🤖 ') + ctx.t('education.nimMove', { pile: move.pileIndex + 1, count: move.removeCount });
}

export function NimStatusCard({ gameState }: StatusCardProps<NimState>) {
  const { t } = useTranslation();
  const nimSum = computeNimSum(gameState.piles);

  return (
    <GameCard title={t('education.currentState')} icon="🪨">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatBlock label={t('nim.piles')} value={gameState.piles.join(', ')} />
        <StatBlock label={t('nim.nimSum')} value={nimSum} />
      </div>
    </GameCard>
  );
}
