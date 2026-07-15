import { useTranslation } from 'react-i18next';
import type { KaylesState } from '@ludus/games';
import { chainLengths, chainXor, computeKaylesGrundy, findKaylesWinningMove } from '@ludus/games';

interface Props {
  trace?: unknown;
  state: KaylesState;
}

/** Always derive from live `alive`; ignore stale opening-trace nimbers during playback. */
export function KaylesMexViz({ state }: Props) {
  const { t } = useTranslation();
  const lengths = chainLengths(state.alive);
  const nimbers = lengths.map(computeKaylesGrundy);
  const xor = chainXor(state.alive);
  const isP = xor === 0;
  const winningMove = findKaylesWinningMove(state.alive);

  return (
    <div className="rounded-card border border-warm-stone-200 bg-warm-stone-50 p-4 space-y-3 text-sm">
      <div className="font-semibold text-warm-stone-800">
        {t('kayles.xor')}: {nimbers.length ? nimbers.join(' ⊕ ') : '0'} = {xor}
      </div>
      <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-3">
        {lengths.map((len, i) => (
          <div key={i} className="rounded-lg bg-white p-2 border border-warm-stone-100">
            <div className="text-warm-stone-500 mb-1">{t('kayles.chains')} #{i + 1}</div>
            <div className="text-lg font-bold text-warm-stone-800">ℓ = {len}</div>
            <div className="text-logic-indigo-600">g = {nimbers[i]}</div>
          </div>
        ))}
        {lengths.length === 0 && (
          <div className="rounded-lg bg-white p-2 border border-warm-stone-100 text-warm-stone-400">
            —
          </div>
        )}
      </div>
      <p className="font-medium text-warm-stone-800">
        {isP ? t('kayles.pPosition') : t('kayles.nPosition')}
      </p>
      {winningMove ? (
        <p className="text-logic-indigo-700">
          → {t('kayles.hintTip', { index: winningMove.index + 1, count: winningMove.count })}
        </p>
      ) : (
        <p className="text-warm-stone-500">{t('kayles.noWinningMove')}</p>
      )}
    </div>
  );
}
