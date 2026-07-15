import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { GrundysGameMove, GrundysGameState } from './types';
import { StonePile } from '../ui/StonePile';
import { isSolved, legalSplits } from './rules';

const MAX_VISIBLE = 10;

interface GrundysGameBoardProps extends BoardProps<GrundysGameState, GrundysGameMove> {
  onChooseHand?: (playerFirst: boolean) => void;
}

export function GrundysGameBoard({
  state,
  onMove,
  disabled = false,
  highlightCell,
  onChooseHand,
}: GrundysGameBoardProps) {
  const { piles, currentPlayer, phase } = state;
  const isPlayerTurn = currentPlayer === 0 && phase === 'playing';
  const isGameOver = isSolved(state);
  const isChoosing = phase === 'choosing';
  const { t } = useTranslation();

  const hintPile = highlightCell?.row ?? null;
  const hintLeft = highlightCell?.value ?? highlightCell?.col ?? null;

  const [selectedPile, setSelectedPile] = useState<number | null>(null);

  useEffect(() => {
    if (hintPile != null && isPlayerTurn) setSelectedPile(hintPile);
  }, [hintPile, isPlayerTurn]);

  useEffect(() => {
    setSelectedPile(null);
  }, [piles.join(',')]);

  // Nim-style victory: terminal + opponent to move
  const playerWon = isGameOver && currentPlayer === 1;
  const aiWon = isGameOver && currentPlayer === 0;

  const handleSelectPile = (pileIndex: number) => {
    if (!isPlayerTurn || disabled || isGameOver) return;
    if (piles[pileIndex]! < 3) return;
    setSelectedPile(pileIndex === selectedPile ? null : pileIndex);
  };

  const handleSplit = (left: number) => {
    if (selectedPile == null || !isPlayerTurn || disabled || isGameOver) return;
    const n = piles[selectedPile]!;
    onMove({ pileIndex: selectedPile, left, right: n - left });
    setSelectedPile(null);
  };

  const renderPileCard = (count: number, pileIndex: number, interactive: boolean) => {
    const canSelect = interactive && count >= 3;
    const isSelected = selectedPile === pileIndex;
    const isHinted = hintPile === pileIndex && isPlayerTurn;

    return (
      <div
        key={pileIndex}
        role={canSelect ? 'button' : undefined}
        tabIndex={canSelect ? 0 : undefined}
        onClick={() => canSelect && handleSelectPile(pileIndex)}
        onKeyDown={(e) => {
          if (!canSelect) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectPile(pileIndex);
          }
        }}
        className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-warm-stone-50 min-w-[80px] transition-all
          ${isSelected || isHinted ? 'ring-2 ring-game-amber-400 shadow-md' : ''}
          ${canSelect ? 'hover:bg-warm-stone-100 cursor-pointer' : 'opacity-80 cursor-default'}
        `}
        aria-label={t('grundy.pile', { index: pileIndex + 1 })}
        aria-pressed={canSelect ? isSelected : undefined}
      >
        <StonePile
          count={count}
          pileIndex={pileIndex}
          maxVisible={MAX_VISIBLE}
          canInteract={false}
          isHinted={isHinted}
          hintRemoveCount={null}
          onStoneClick={() => {}}
          ariaLabelFn={() => ''}
        />
        <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
          {t('grundy.pile', { index: pileIndex + 1 })}
        </span>
        <span className={`text-xl font-bold font-mono tabular-nums ${count <= 2 ? 'text-warm-stone-400' : 'text-warm-stone-800'}`}>
          {count}
        </span>
      </div>
    );
  };

  if (isChoosing) {
    const recommendPlayer = highlightCell?.row === 0 && highlightCell.col === 0;
    const recommendAI = highlightCell?.row === 0 && highlightCell.col === 1;
    const btnPlayerCls = recommendPlayer
      ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]' : '';
    const btnAICls = recommendAI
      ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]' : '';

    return (
      <div className="flex flex-col items-center gap-8 select-none">
        <div className="text-xl font-bold text-warm-stone-700">{t('grundy.chooseHand')}</div>
        <div className="flex flex-wrap justify-center gap-3">
          {piles.map((count, i) => renderPileCard(count, i, false))}
        </div>
        <div className="flex gap-4">
          <motion.button type="button" onClick={() => onChooseHand?.(true)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-logic-indigo-600 text-white font-bold text-lg hover:bg-logic-indigo-700 transition-all shadow-lg ${btnPlayerCls}`}>
            {t('grundy.playFirst')}
          </motion.button>
          <motion.button type="button" onClick={() => onChooseHand?.(false)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-warm-stone-200 text-warm-stone-700 font-bold text-lg hover:bg-warm-stone-300 transition-all shadow-md ${btnAICls}`}>
            {t('grundy.aiFirst')}
          </motion.button>
        </div>
      </div>
    );
  }

  const selectedN = selectedPile != null ? piles[selectedPile]! : null;
  const splits = selectedN != null ? legalSplits(selectedN) : [];

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <AnimatePresence mode="wait">
        {playerWon ? (
          <motion.div key="win" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-game-amber-600">{t('grundy.youWin')}</motion.div>
        ) : aiWon ? (
          <motion.div key="lose" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-warm-stone-400">{t('grundy.aiWins')}</motion.div>
        ) : (
          <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-lg font-semibold flex items-center gap-2 ${isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
            {isPlayerTurn ? t('grundy.yourTurn') : t('grundy.aiThinking')}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap justify-center gap-3">
        {piles.map((count, i) => renderPileCard(count, i, isPlayerTurn && !disabled && !isGameOver))}
      </div>

      {isPlayerTurn && !isGameOver && (
        <div className="flex flex-col items-center gap-3 w-full max-w-lg">
          {selectedPile == null ? (
            <p className="text-sm text-warm-stone-500">{t('grundy.selectPile')}</p>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-2">
                {splits.map((left) => {
                  const right = selectedN! - left;
                  const isHinted = hintPile === selectedPile && hintLeft === left;
                  return (
                    <motion.button
                      key={left}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSplit(left)}
                      whileTap={{ scale: 0.95 }}
                      aria-label={t('grundy.splitAria', {
                        index: selectedPile + 1,
                        n: selectedN,
                        left,
                        right,
                      })}
                      className={`px-4 py-2 rounded-xl font-mono font-semibold text-sm transition-all
                        ${isHinted
                          ? 'bg-game-amber-100 text-game-amber-800 ring-2 ring-game-amber-400 shadow-md scale-105'
                          : 'bg-logic-indigo-50 text-logic-indigo-700 hover:bg-logic-indigo-100'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {t('grundy.splitBtn', { n: selectedN, left, right })}
                    </motion.button>
                  );
                })}
              </div>
              <button
                type="button"
                className="text-xs text-warm-stone-400 hover:text-warm-stone-600"
                onClick={() => setSelectedPile(null)}
              >
                {t('grundy.cancelSelect')}
              </button>
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {hintPile != null && hintLeft != null && isPlayerTurn && !isGameOver && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-game-amber-700 bg-game-amber-50 px-4 py-2 rounded-lg font-medium shadow-sm"
          >
            {t('grundy.hintTip', {
              pile: hintPile + 1,
              left: hintLeft,
              right: (piles[hintPile] ?? 0) - hintLeft,
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
