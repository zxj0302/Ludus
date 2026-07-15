import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { EuclidsGameState, EuclidsGameMove } from './types';
import { StonePile } from '../ui/StonePile';
import { isSolved, legalMultiples } from './rules';

const MAX_VISIBLE = 10;

interface EuclidsGameBoardProps extends BoardProps<EuclidsGameState, EuclidsGameMove> {
  onChooseHand?: (playerFirst: boolean) => void;
}

export function EuclidsGameBoard({
  state,
  onMove,
  disabled = false,
  highlightCell,
  onChooseHand,
}: EuclidsGameBoardProps) {
  const { piles, currentPlayer, phase } = state;
  const [larger, smaller] = piles;
  const isPlayerTurn = currentPlayer === 0 && phase === 'playing';
  const isGameOver = isSolved(state);
  const isChoosing = phase === 'choosing';
  const { t } = useTranslation();

  const hintMultiple = highlightCell != null ? highlightCell.col + 1 : null;
  const multiples = legalMultiples(piles);

  const handleMultiple = (multiple: number) => {
    if (!isPlayerTurn || disabled || isGameOver) return;
    onMove({ multiple });
  };

  const playerWon = isGameOver && currentPlayer === 0;
  const aiWon = isGameOver && currentPlayer === 1;

  const renderPileCard = (
    count: number,
    pileIndex: number,
    labelKey: 'euclids.largerPile' | 'euclids.smallerPile',
  ) => (
    <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-warm-stone-50 min-w-[88px]" aria-hidden>
      <StonePile
        count={count}
        pileIndex={pileIndex}
        maxVisible={MAX_VISIBLE}
        canInteract={false}
        isHinted={false}
        hintRemoveCount={null}
        onStoneClick={() => {}}
        ariaLabelFn={() => ''}
      />
      <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
        {t(labelKey)}
      </span>
      <span className={`text-xl font-bold font-mono tabular-nums ${count === 0 ? 'text-warm-stone-300' : 'text-warm-stone-800'}`}>
        {count}
      </span>
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
        <div className="text-xl font-bold text-warm-stone-700">{t('euclids.chooseHand')}</div>
        <div className="flex flex-wrap justify-center gap-4">
          {renderPileCard(larger, 0, 'euclids.largerPile')}
          {renderPileCard(smaller, 1, 'euclids.smallerPile')}
        </div>
        <div className="flex gap-4">
          <motion.button
            type="button"
            onClick={() => onChooseHand?.(true)}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-logic-indigo-600 text-white font-bold text-lg hover:bg-logic-indigo-700 transition-all shadow-lg ${btnPlayerCls}`}
          >
            {t('euclids.playFirst')}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onChooseHand?.(false)}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-warm-stone-200 text-warm-stone-700 font-bold text-lg hover:bg-warm-stone-300 transition-all shadow-md ${btnAICls}`}
          >
            {t('euclids.aiFirst')}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <AnimatePresence mode="wait">
        {playerWon ? (
          <motion.div
            key="win"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-game-amber-600"
          >
            {t('euclids.youWin')}
          </motion.div>
        ) : aiWon ? (
          <motion.div
            key="lose"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-warm-stone-400"
          >
            {t('euclids.aiWins')}
          </motion.div>
        ) : (
          <motion.div
            key="turn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-lg font-semibold flex items-center gap-2 ${isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
            {isPlayerTurn ? t('euclids.yourTurn') : t('euclids.aiThinking')}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap justify-center gap-4">
        {renderPileCard(larger, 0, 'euclids.largerPile')}
        {renderPileCard(smaller, 1, 'euclids.smallerPile')}
      </div>

      {isPlayerTurn && multiples.length > 0 && !isGameOver && (
        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          <div className="flex flex-wrap justify-center gap-2">
            {multiples.map((k) => {
              const amount = k * smaller;
              const isHinted = hintMultiple === k;
              return (
                <motion.button
                  key={k}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleMultiple(k)}
                  whileTap={{ scale: 0.95 }}
                  aria-label={t('euclids.multipleAria', { multiple: k, amount })}
                  className={`px-4 py-2 rounded-xl font-mono font-semibold text-sm transition-all
                    ${isHinted
                      ? 'bg-game-amber-100 text-game-amber-800 ring-2 ring-game-amber-400 shadow-md scale-105'
                      : 'bg-logic-indigo-50 text-logic-indigo-700 hover:bg-logic-indigo-100'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {t('euclids.multipleBtn', { multiple: k, smaller })}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {hintMultiple != null && isPlayerTurn && !isGameOver && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-game-amber-700 bg-game-amber-50 px-4 py-2 rounded-lg font-medium shadow-sm"
          >
            {t('euclids.hintTip', { multiple: hintMultiple, amount: hintMultiple * smaller })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
