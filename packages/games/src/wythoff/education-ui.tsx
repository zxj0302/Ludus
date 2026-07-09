import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatBlock, GameCard } from '../ui/GameCard';
import type { WythoffState, WythoffMove } from './types';
import { isWythoffPPosition } from './solver';

export function formatWythoffMove(
  move: WythoffMove,
  index: number,
  ctx: FormatMoveContext,
): string {
  const isPlayer = ctx.playersFirst ? index % 2 === 0 : index % 2 === 1;
  const icon = isPlayer ? '🧑 ' : '🤖 ';
  if (move.type === 'both') return icon + ctx.t('education.wythoffMoveBoth', { count: move.removeCount });
  return icon + ctx.t('education.wythoffMoveSingle', { pile: (move.pileIndex ?? 0) + 1, count: move.removeCount });
}

export function WythoffStatusCard({ gameState }: StatusCardProps<WythoffState>) {
  const { t } = useTranslation();
  const isP = gameState.piles.length >= 2 ? isWythoffPPosition(gameState.piles[0]!, gameState.piles[1]!) : false;
  const k = Math.abs(gameState.piles[1]! - gameState.piles[0]!);

  return (
    <GameCard title={t('education.currentState')} icon="⚖️">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatBlock label={t('wythoff.piles')} value={`${gameState.piles[0]}, ${gameState.piles[1]}`} />
        <StatBlock
          label={t('wythoff.beattyPair')}
          value={`k=${k}, ${isP ? t('wythoff.pPosition') : t('wythoff.nPosition')}`}
        />
      </div>
    </GameCard>
  );
}
