import { useTranslation } from 'react-i18next';
import type { GrundysGameState } from '@ludus/games';
import { computeGrundyXor, findGrundysWinningMove, pileNimbers } from '@ludus/games';

interface Props {
  /** Kept for entrySetup wiring; nimbers always come from live `state`. */
  trace?: unknown;
  state: GrundysGameState;
}

/** Always derive nimbers from live piles; ignore stale opening-trace values during playback. */
export function GrundyMexViz({ state }: Props) {
  const { t } = useTranslation();
  const piles = state.piles;
  const nimbers = pileNimbers(piles);
  const xor = computeGrundyXor(piles);
  const isP = xor === 0;
  const winningMove = findGrundysWinningMove(piles);

  return (
    <div className="rounded-card border border-warm-stone-200 bg-warm-stone-50 p-4 space-y-3 text-sm">
      <div className="font-semibold text-warm-stone-800">
        {t('grundy.xor')}: {nimbers.join(' ⊕ ')} = {xor}
      </div>
      <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-3">
        {piles.map((n, i) => (
          <div key={i} className="rounded-lg bg-white p-2 border border-warm-stone-100">
            <div className="text-warm-stone-500 mb-1">{t('grundy.pile', { index: i + 1 })}</div>
            <div className="text-lg font-bold text-warm-stone-800">{n}</div>
            <div className="text-logic-indigo-600">g = {nimbers[i]}</div>
          </div>
        ))}
      </div>
      <p className="font-medium text-warm-stone-800">
        {isP ? t('grundy.pPosition') : t('grundy.nPosition')}
      </p>
      {winningMove ? (
        <p className="text-logic-indigo-700">
          → {t('grundy.splitBtn', {
            n: winningMove.left + winningMove.right,
            left: winningMove.left,
            right: winningMove.right,
          })}
          {' '}({t('grundy.pile', { index: winningMove.pileIndex + 1 })})
        </p>
      ) : (
        <p className="text-warm-stone-500">{t('grundy.noWinningMove')}</p>
      )}
    </div>
  );
}
