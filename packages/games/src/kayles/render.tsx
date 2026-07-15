import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { KaylesMove, KaylesState } from './types';
import { isSolved } from './rules';

interface KaylesBoardProps extends BoardProps<KaylesState, KaylesMove> {
  onChooseHand?: (playerFirst: boolean) => void;
}

export function KaylesBoard({
  state,
  onMove,
  disabled = false,
  highlightCell,
  onChooseHand,
}: KaylesBoardProps) {
  const { alive, currentPlayer, phase } = state;
  const isPlayerTurn = currentPlayer === 0 && phase === 'playing';
  const isGameOver = isSolved(state);
  const isChoosing = phase === 'choosing';
  const { t } = useTranslation();

  const hintIndex = highlightCell?.col ?? null;
  const hintCount = (highlightCell?.value ?? null) as 1 | 2 | null;

  const [selected, setSelected] = useState<number | null>(null);
  const [pairEnd, setPairEnd] = useState<number | null>(null);

  useEffect(() => {
    if (hintIndex != null && isPlayerTurn && alive[hintIndex]) {
      setSelected(hintIndex);
      setPairEnd(hintCount === 2 && alive[hintIndex + 1] ? hintIndex + 1 : null);
    }
  }, [hintIndex, hintCount, isPlayerTurn, alive]);

  useEffect(() => {
    setSelected(null);
    setPairEnd(null);
  }, [alive.join(',')]);

  const playerWon = isGameOver && currentPlayer === 1;
  const aiWon = isGameOver && currentPlayer === 0;

  const clearSelection = () => {
    setSelected(null);
    setPairEnd(null);
  };

  const handlePinClick = (i: number) => {
    if (!isPlayerTurn || disabled || isGameOver || !alive[i]) return;

    if (selected == null) {
      setSelected(i);
      setPairEnd(null);
      return;
    }

    if (selected === i) {
      clearSelection();
      return;
    }

    // Adjacent → preview knock-2
    if (Math.abs(selected - i) === 1 && alive[selected] && alive[i]) {
      const lo = Math.min(selected, i);
      setSelected(lo);
      setPairEnd(lo + 1);
      return;
    }

    // Non-adjacent → reselect
    setSelected(i);
    setPairEnd(null);
  };

  const confirmKnockOne = () => {
    if (selected == null || !isPlayerTurn || disabled) return;
    onMove({ index: selected, count: 1 });
    clearSelection();
  };

  const confirmKnockTwo = () => {
    if (selected == null || pairEnd == null || !isPlayerTurn || disabled) return;
    onMove({ index: selected, count: 2 });
    clearSelection();
  };

  const renderPins = (interactive: boolean) => (
    <div className="flex flex-wrap justify-center gap-2">
      {alive.map((up, i) => {
        const canClick = interactive && up;
        const isSel = selected === i || pairEnd === i;
        const isHinted =
          isPlayerTurn
          && hintIndex != null
          && (i === hintIndex || (hintCount === 2 && i === hintIndex + 1));

        return (
          <button
            key={i}
            type="button"
            disabled={!canClick}
            onClick={() => handlePinClick(i)}
            aria-label={t('kayles.pin', { index: i + 1 })}
            aria-pressed={isSel}
            className={`w-10 h-14 rounded-b-full rounded-t-lg border-2 font-mono text-sm font-bold transition-all
              ${up
                ? 'bg-game-amber-100 border-game-amber-400 text-warm-stone-800 shadow-sm'
                : 'bg-warm-stone-100 border-warm-stone-200 text-warm-stone-300 opacity-40'}
              ${isSel || isHinted ? 'ring-2 ring-logic-indigo-500 scale-105' : ''}
              ${canClick ? 'hover:brightness-95 cursor-pointer' : 'cursor-default'}
            `}
          >
            {up ? i + 1 : '·'}
          </button>
        );
      })}
    </div>
  );

  if (isChoosing) {
    const recommendPlayer = highlightCell?.row === 0 && highlightCell.col === 0;
    const recommendAI = highlightCell?.row === 0 && highlightCell.col === 1;
    const btnPlayerCls = recommendPlayer
      ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]' : '';
    const btnAICls = recommendAI
      ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]' : '';

    return (
      <div className="flex flex-col items-center gap-8 select-none">
        <div className="text-xl font-bold text-warm-stone-700">{t('kayles.chooseHand')}</div>
        {renderPins(false)}
        <div className="flex gap-4">
          <motion.button type="button" onClick={() => onChooseHand?.(true)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-logic-indigo-600 text-white font-bold text-lg hover:bg-logic-indigo-700 transition-all shadow-lg ${btnPlayerCls}`}>
            {t('kayles.playFirst')}
          </motion.button>
          <motion.button type="button" onClick={() => onChooseHand?.(false)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-warm-stone-200 text-warm-stone-700 font-bold text-lg hover:bg-warm-stone-300 transition-all shadow-md ${btnAICls}`}>
            {t('kayles.aiFirst')}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <AnimatePresence mode="wait">
        {playerWon ? (
          <motion.div key="win" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-game-amber-600">{t('kayles.youWin')}</motion.div>
        ) : aiWon ? (
          <motion.div key="lose" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-warm-stone-400">{t('kayles.aiWins')}</motion.div>
        ) : (
          <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-lg font-semibold flex items-center gap-2 ${isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
            {isPlayerTurn ? t('kayles.yourTurn') : t('kayles.aiThinking')}
          </motion.div>
        )}
      </AnimatePresence>

      {renderPins(isPlayerTurn && !disabled && !isGameOver)}

      {isPlayerTurn && !isGameOver && (
        <div className="flex flex-col items-center gap-3">
          {selected == null ? (
            <p className="text-sm text-warm-stone-500">{t('kayles.selectPin')}</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              <motion.button
                type="button"
                disabled={disabled}
                onClick={confirmKnockOne}
                whileTap={{ scale: 0.95 }}
                aria-label={t('kayles.knockOneAria', { index: selected + 1 })}
                className="px-4 py-2 rounded-xl bg-logic-indigo-50 text-logic-indigo-700 font-semibold text-sm hover:bg-logic-indigo-100"
              >
                {t('kayles.knockOne')}
              </motion.button>
              {pairEnd != null && (
                <motion.button
                  type="button"
                  disabled={disabled}
                  onClick={confirmKnockTwo}
                  whileTap={{ scale: 0.95 }}
                  aria-label={t('kayles.knockTwoAria', { a: selected + 1, b: pairEnd + 1 })}
                  className="px-4 py-2 rounded-xl bg-game-amber-100 text-game-amber-800 font-semibold text-sm ring-2 ring-game-amber-400"
                >
                  {t('kayles.knockTwo')}
                </motion.button>
              )}
              <button
                type="button"
                className="text-xs text-warm-stone-400 hover:text-warm-stone-600 px-2"
                onClick={clearSelection}
              >
                {t('kayles.cancelSelect')}
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {hintIndex != null && hintCount != null && isPlayerTurn && !isGameOver && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-game-amber-700 bg-game-amber-50 px-4 py-2 rounded-lg font-medium shadow-sm"
          >
            {t('kayles.hintTip', { index: hintIndex + 1, count: hintCount })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
