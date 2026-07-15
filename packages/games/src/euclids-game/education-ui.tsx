import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatBlock, GameCard } from '../ui/GameCard';
import type { EuclidsGameState, EuclidsGameMove } from './types';
import { PHI, isPPosition } from './solver';

export function formatEuclidsGameMove(
  move: EuclidsGameMove,
  index: number,
  ctx: FormatMoveContext,
): string {
  const isPlayer = ctx.playersFirst ? index % 2 === 0 : index % 2 === 1;
  return (isPlayer ? '🧑 ' : '🤖 ') + ctx.t('education.euclidsMove', { multiple: move.multiple });
}

export function EuclidsGameStatusCard({ gameState }: StatusCardProps<EuclidsGameState>) {
  const { t } = useTranslation();
  const [larger, smaller] = gameState.piles;
  const threshold = PHI * smaller;
  const isP = isPPosition(gameState.piles);

  return (
    <GameCard title={t('education.currentState')} icon="📐">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatBlock label={t('euclids.piles')} value={`${larger}, ${smaller}`} />
        <StatBlock label={t('euclids.phiThreshold')} value={threshold.toFixed(3)} />
        <StatBlock
          label={t('euclids.position')}
          value={isP ? t('euclids.pPosition') : t('euclids.nPosition')}
        />
      </div>
    </GameCard>
  );
}
