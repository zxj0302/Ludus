import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { NimState, NimMove } from './rules';

interface Props {
  state: NimState;
  onMove: (move: NimMove) => void;
  disabled?: boolean;
  highlightCell?: { row: number; col: number; value?: number } | null;
}

export function NimBoard({ state, onMove, disabled, highlightCell }: Props) {
  const [selectedPile, setSelectedPile] = useState<number | null>(null);
  const { piles, currentPlayer } = state;
  const isPlayerTurn = currentPlayer === 0;
  const { t } = useTranslation();

  // Refs to avoid stale closure in callbacks
  const selectedPileRef = useRef(selectedPile);
  selectedPileRef.current = selectedPile;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const handlePileClick = (index: number) => {
    if (!isPlayerTurn || disabled) return;
    if (selectedPile === index) {
      setSelectedPile(null);
    } else {
      setSelectedPile(index);
    }
  };

  const handleRemove = (count: number) => {
    const pile = selectedPileRef.current;
    if (pile === null || disabled) return;
    onMoveRef.current({ pileIndex: pile, removeCount: count });
    setSelectedPile(null);
  };

  // Get hint pile from highlightCell (row = pileIndex for Nim)
  const hintPileIndex = highlightCell?.row ?? null;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Turn indicator */}
      <div
        className={`text-lg font-semibold ${
          isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'
        }`}
      >
        {isPlayerTurn ? t('nim.yourTurn') : t('nim.aiThinking')}
      </div>

      {/* Piles */}
      <div className="flex flex-wrap justify-center gap-6">
        {piles.map((count, i) => {
          const isSelected = selectedPile === i;
          const isHinted = hintPileIndex === i && isPlayerTurn;
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => handlePileClick(i)}
              disabled={!isPlayerTurn || disabled}
              whileTap={!disabled && isPlayerTurn ? { scale: 0.96 } : undefined}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl min-w-[80px]
                transition-colors
                ${isSelected ? 'bg-logic-indigo-100 ring-2 ring-logic-indigo-500' : ''}
                ${isHinted && !isSelected ? 'bg-game-amber-100 ring-2 ring-game-amber-500' : ''}
                ${!isSelected && !isHinted ? 'bg-warm-stone-50 hover:bg-warm-stone-100' : ''}
                ${!isPlayerTurn || disabled ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              aria-label={`${t('nim.pile', { index: i + 1 })}: ${count}`}
            >
              <span className="text-xs text-warm-stone-500 font-medium">
                {t('nim.pile', { index: i + 1 })}
              </span>
              <div className="flex flex-wrap justify-center gap-1 max-w-[100px]">
                {Array.from({ length: Math.min(count, 15) }, (_, j) => (
                  <motion.span
                    key={j}
                    layout
                    className="w-5 h-5 rounded-full bg-warm-stone-600 shadow-sm"
                  />
                ))}
                {count > 15 && (
                  <span className="text-xs text-warm-stone-500 self-end ml-1">
                    +{count - 15}
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-warm-stone-800">{count}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Remove count selector */}
      <AnimatePresence>
        {selectedPile !== null && piles[selectedPile]! > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex gap-2 flex-wrap justify-center"
          >
            {Array.from(
              { length: Math.min(piles[selectedPile]!, 10) },
              (_, i) => i + 1,
            ).map((n) => (
              <motion.button
                key={n}
                type="button"
                onClick={() => handleRemove(n)}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-btn bg-logic-indigo-600 text-white text-sm font-bold hover:bg-logic-indigo-700"
              >
                {n}
              </motion.button>
            ))}
            {piles[selectedPile]! > 10 && (
              <motion.button
                type="button"
                onClick={() => handleRemove(piles[selectedPile]!)}
                whileTap={{ scale: 0.9 }}
                className="h-9 px-3 rounded-btn bg-logic-indigo-600 text-white text-xs font-bold hover:bg-logic-indigo-700"
              >
                {t('nim.removeAll', { count: piles[selectedPile]! })}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
