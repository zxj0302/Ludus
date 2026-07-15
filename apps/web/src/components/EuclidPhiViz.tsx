import { useTranslation } from 'react-i18next';
import type { SolverTrace } from '@ludus/core';
import type { EuclidsGameState } from '@ludus/games';
import { PHI } from '@ludus/games';

interface Props {
  trace?: SolverTrace;
  state: EuclidsGameState;
}

export function EuclidPhiViz({ trace, state }: Props) {
  const { t } = useTranslation();
  const [larger, smaller] = state.piles;
  const step = trace?.steps?.[0];
  const data = step?.data as {
    phi?: number;
    threshold?: number;
    pValue?: number;
    winningMove?: { multiple: number } | null;
  } | undefined;

  const phi = data?.phi ?? PHI;
  const threshold = data?.threshold ?? phi * smaller;
  const floorBound = Math.floor(smaller * phi);
  const isP = data?.pValue === 0;
  const winningMove = data?.winningMove;

  return (
    <div className="rounded-card border border-warm-stone-200 bg-warm-stone-50 p-4 space-y-3 text-sm">
      <div className="font-semibold text-warm-stone-800">
        {t('euclids.vizPhi', { value: phi.toFixed(6) })}
      </div>
      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        <div className="rounded-lg bg-white p-2 border border-warm-stone-100">
          <div className="text-warm-stone-500 mb-1">{t('euclids.largerPile')}</div>
          <div className="text-lg font-bold text-warm-stone-800">{larger}</div>
        </div>
        <div className="rounded-lg bg-white p-2 border border-warm-stone-100">
          <div className="text-warm-stone-500 mb-1">{t('euclids.smallerPile')}</div>
          <div className="text-lg font-bold text-warm-stone-800">{smaller}</div>
        </div>
      </div>
      <div className="space-y-1 text-warm-stone-600">
        <p>{t('euclids.vizFloor', { value: floorBound })}</p>
        <p>{t('euclids.vizThreshold', { value: threshold.toFixed(3) })}</p>
        <p className="font-medium text-warm-stone-800">
          {isP ? t('euclids.pPosition') : t('euclids.nPosition')}
        </p>
        {winningMove && (
          <p className="text-logic-indigo-700">
            {t('euclids.vizWinningK', { k: winningMove.multiple })}
          </p>
        )}
      </div>
    </div>
  );
}
