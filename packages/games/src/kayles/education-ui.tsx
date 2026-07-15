import { useTranslation } from 'react-i18next';
import type { FormatMoveContext, StatusCardProps } from '../types';
import { StatBlock, GameCard } from '../ui/GameCard';
import type { KaylesMove, KaylesState } from './types';
import { chainLengths } from './rules';
import { chainXor, computeKaylesGrundy, isKaylesPPosition } from './solver';

export function formatKaylesMove(
  move: KaylesMove,
  index: number,
  ctx: FormatMoveContext,
): string {
  const isPlayer = ctx.playersFirst ? index % 2 === 0 : index % 2 === 1;
  return (isPlayer ? '🧑 ' : '🤖 ') + ctx.t('education.kaylesMove', {
    index: move.index + 1,
    count: move.count,
  });
}

export function KaylesStatusCard({ gameState }: StatusCardProps<KaylesState>) {
  const { t } = useTranslation();
  const lengths = chainLengths(gameState.alive);
  const nimbers = lengths.map(computeKaylesGrundy);
  const xor = chainXor(gameState.alive);
  const isP = isKaylesPPosition(gameState.alive);

  return (
    <GameCard title={t('education.currentState')} icon="🎳">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatBlock label={t('kayles.chains')} value={lengths.length ? lengths.join(', ') : '—'} />
        <StatBlock label={t('kayles.xor')} value={`${nimbers.join(' ⊕ ') || '0'} = ${xor}`} />
        <StatBlock
          label={t('kayles.position')}
          value={isP ? t('kayles.pPosition') : t('kayles.nPosition')}
        />
      </div>
    </GameCard>
  );
}
