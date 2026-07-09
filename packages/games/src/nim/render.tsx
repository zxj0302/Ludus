import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { NimState, NimMove } from './types';
import { StonePile } from '../ui/StonePile';

const MAX_VISIBLE = 10;

interface NimBoardProps extends BoardProps<NimState, NimMove> {
  onChooseHand?: (playerFirst: boolean) => void;
}

export function NimBoard({ state, onMove, disabled = false, highlightCell, onChooseHand }: NimBoardProps) {
  const { piles, currentPlayer, phase } = state;
  const isPlayerTurn = currentPlayer === 0 && phase === 'playing';
  const isGameOver = piles.every(v => v === 0);
  const isChoosing = phase === 'choosing';
  const { t } = useTranslation();

  const hintPileIndex = highlightCell?.row ?? null;
  const hintRemoveCount = highlightCell?.value ?? null;

  const handleStoneClick = (pileIndex: number, idx: number) => {
    if (!isPlayerTurn || disabled || isGameOver) return;
    const count = piles[pileIndex]!;
    const removeCount = count - idx;
    if (removeCount > 0 && removeCount <= count) {
      onMove({ pileIndex, removeCount });
    }
  };

  const playerWon = isGameOver && currentPlayer === 1;
  const aiWon = isGameOver && currentPlayer === 0;

  const renderPileCard = (
    count: number,
    pileIndex: number,
    isHinted: boolean,
    canInteract: boolean,
    showCount = true,
  ) => (
    <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-warm-stone-50 min-w-[80px]">
      <StonePile
        count={count}
        pileIndex={pileIndex}
        maxVisible={MAX_VISIBLE}
        canInteract={canInteract}
        isHinted={isHinted}
        hintRemoveCount={hintRemoveCount}
        onStoneClick={(idx) => handleStoneClick(pileIndex, idx)}
        ariaLabelFn={(removeCount, remain) =>
          t('nim.stoneAria', { pile: pileIndex + 1, count: removeCount, remain })}
      />
      <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
        {t('nim.pile', { index: pileIndex + 1 })}
      </span>
      {showCount && (
        <span className={`text-xl font-bold font-mono tabular-nums ${count === 0 ? 'text-warm-stone-300' : 'text-warm-stone-800'}`}>
          {count}
        </span>
      )}
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
        <div className="text-xl font-bold text-warm-stone-700">{t('nim.chooseHand')}</div>
        <div className="flex flex-wrap justify-center gap-3">
          {piles.map((count, i) => (
            <div key={i}>{renderPileCard(count, i, false, false)}</div>
          ))}
        </div>
        <div className="flex gap-4">
          <motion.button type="button" onClick={() => onChooseHand?.(true)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-logic-indigo-600 text-white font-bold text-lg hover:bg-logic-indigo-700 transition-all shadow-lg ${btnPlayerCls}`}>
            {t('nim.playFirst')}
          </motion.button>
          <motion.button type="button" onClick={() => onChooseHand?.(false)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-warm-stone-200 text-warm-stone-700 font-bold text-lg hover:bg-warm-stone-300 transition-all shadow-md ${btnAICls}`}>
            {t('nim.aiFirst')}
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
            className="text-2xl font-bold text-game-amber-600">{t('nim.youWin')}</motion.div>
        ) : aiWon ? (
          <motion.div key="lose" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-warm-stone-400">{t('nim.aiWins')}</motion.div>
        ) : (
          <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-lg font-semibold flex items-center gap-2 ${isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
            {isPlayerTurn ? t('nim.yourTurn') : t('nim.aiThinking')}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap justify-center gap-3">
        {piles.map((count, i) => {
          const isEmpty = count === 0;
          const isHinted = hintPileIndex === i && isPlayerTurn;
          const canInteract = isPlayerTurn && !disabled && !isGameOver;

          return (
            <motion.div key={i} layout
              className={`transition-all duration-200
                ${isHinted ? 'ring-2 ring-game-amber-400 rounded-2xl shadow-lg' : ''}
                ${!isPlayerTurn || disabled || isGameOver || isEmpty ? 'opacity-50' : ''}
              `}
            >
              {renderPileCard(count, i, isHinted, canInteract)}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {hintPileIndex != null && hintRemoveCount != null && isPlayerTurn && !isGameOver && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-game-amber-700 bg-game-amber-50 px-4 py-2 rounded-lg font-medium shadow-sm">
            {t('nim.hintTip', { pile: hintPileIndex + 1, count: hintRemoveCount })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
