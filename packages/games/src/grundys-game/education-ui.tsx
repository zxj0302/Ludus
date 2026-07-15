import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatBlock, GameCard } from '../ui/GameCard';
import type { GrundysGameMove, GrundysGameState } from './types';
import { computeGrundyXor, isPPosition, pileNimbers } from './solver';

export function formatGrundysGameMove(
  move: GrundysGameMove,
  index: number,
  ctx: FormatMoveContext,
): string {
  const isPlayer = ctx.playersFirst ? index % 2 === 0 : index % 2 === 1;
  const n = move.left + move.right;
  return (isPlayer ? '🧑 ' : '🤖 ') + ctx.t('education.grundyMove', {
    pile: move.pileIndex + 1,
    n,
    left: move.left,
    right: move.right,
  });
}

export function GrundysGameStatusCard({ gameState }: StatusCardProps<GrundysGameState>) {
  const { t } = useTranslation();
  const nimbers = pileNimbers(gameState.piles);
  const xor = computeGrundyXor(gameState.piles);
  const isP = isPPosition(gameState.piles);

  return (
    <GameCard title={t('education.currentState')} icon="🪓">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatBlock label={t('grundy.piles')} value={gameState.piles.join(', ')} />
        <StatBlock label={t('grundy.xor')} value={`${nimbers.join(' ⊕ ')} = ${xor}`} />
        <StatBlock
          label={t('grundy.position')}
          value={isP ? t('grundy.pPosition') : t('grundy.nPosition')}
        />
      </div>
    </GameCard>
  );
}
