import { useState, useRef, useEffect } from 'react';
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
  const { piles, currentPlayer, initialPiles } = state;
  const isPlayerTurn = currentPlayer === 0;
  const isGameOver = piles.every(v => v === 0);
  const { t } = useTranslation();

  const selectedPileRef = useRef(selectedPile);
  selectedPileRef.current = selectedPile;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const hintPileIndex = highlightCell?.row ?? null;
  const hintRemoveCount = highlightCell?.value ?? null;

  // Auto-select hinted pile
  useEffect(() => {
    if (hintPileIndex != null && isPlayerTurn && !disabled) {
      setSelectedPile(hintPileIndex);
    }
  }, [hintPileIndex, isPlayerTurn, disabled]);

  const handlePileClick = (index: number) => {
    if (!isPlayerTurn || disabled || isGameOver) return;
    if (selectedPile === index) {
      setSelectedPile(null);
    } else {
      setSelectedPile(index);
    }
  };

  const handleRemove = (count: number) => {
    const pile = selectedPileRef.current;
    if (pile === null || disabled || isGameOver) return;
    onMoveRef.current({ pileIndex: pile, removeCount: count });
    setSelectedPile(null);
  };

  // Game result
  const playerWon = isGameOver && currentPlayer === 1;
  const aiWon = isGameOver && currentPlayer === 0;

  // Stone colors per pile
  const pileColors = [
    'bg-amber-500 shadow-amber-300/40',
    'bg-emerald-500 shadow-emerald-300/40',
    'bg-violet-500 shadow-violet-300/40',
    'bg-rose-500 shadow-rose-300/40',
    'bg-cyan-500 shadow-cyan-300/40',
  ];

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Game status banner */}
      <AnimatePresence mode="wait">
        {playerWon ? (
          <motion.div
            key="win"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xl font-bold text-game-amber-600"
          >
            {t('nim.youWin')}
          </motion.div>
        ) : aiWon ? (
          <motion.div
            key="lose"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xl font-bold text-warm-stone-500"
          >
            {t('nim.aiWins')}
          </motion.div>
        ) : (
          <motion.div
            key="turn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-lg font-semibold flex items-center gap-2 ${
              isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
            {isPlayerTurn ? t('nim.yourTurn') : t('nim.aiThinking')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial piles indicator */}
      <div className="text-xs text-warm-stone-400 font-mono">
        {initialPiles.join(' · ')}
      </div>

      {/* Piles */}
      <div className="flex flex-wrap justify-center gap-4">
        {piles.map((count, i) => {
          const isSelected = selectedPile === i;
          const isHinted = hintPileIndex === i && isPlayerTurn;
          const isEmpty = count === 0;
          const color = pileColors[i % pileColors.length]!;

          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => handlePileClick(i)}
              disabled={!isPlayerTurn || disabled || isGameOver || isEmpty}
              whileTap={!disabled && isPlayerTurn && !isGameOver ? { scale: 0.95 } : undefined}
              layout
              className={`
                flex flex-col items-center gap-3 p-4 rounded-2xl min-w-[90px]
                transition-all duration-200
                ${isSelected ? 'bg-logic-indigo-50 ring-2 ring-logic-indigo-500 scale-105' : ''}
                ${isHinted && !isSelected ? 'bg-game-amber-50 ring-2 ring-game-amber-400' : ''}
                ${!isSelected && !isHinted ? 'bg-warm-stone-50 hover:bg-warm-stone-100' : ''}
                ${!isPlayerTurn || disabled || isGameOver || isEmpty ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-label={`${t('nim.pile', { index: i + 1 })}: ${count} stones`}
            >
              <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                {t('nim.pile', { index: i + 1 })}
              </span>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-[110px]">
                {Array.from({ length: Math.min(count, 20) }, (_, j) => (
                  <motion.span
                    key={j}
                    layout
                    initial={isSelected ? { scale: 1.1 } : undefined}
                    className={`w-4 h-4 rounded-full ${color} shadow-sm`}
                  />
                ))}
                {count > 20 && (
                  <span className="text-[10px] text-warm-stone-400 self-end ml-1">+{count - 20}</span>
                )}
              </div>
              <span className={`text-lg font-bold tabular-nums ${isEmpty ? 'text-warm-stone-300' : 'text-warm-stone-800'}`}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Remove count selector */}
      <AnimatePresence>
        {selectedPile !== null && !isGameOver && piles[selectedPile]! > 0 && isPlayerTurn && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs text-warm-stone-500">{t('nim.selectRemove')}</span>
            <div className="flex gap-1.5 flex-wrap justify-center max-w-[320px]">
              {Array.from(
                { length: Math.min(piles[selectedPile]!, 15) },
                (_, i) => i + 1,
              ).map((n) => {
                const isHintCount = hintPileIndex === selectedPile && n === hintRemoveCount;
                return (
                  <motion.button
                    key={n}
                    type="button"
                    onClick={() => handleRemove(n)}
                    whileTap={{ scale: 0.9 }}
                    className={`
                      w-9 h-9 rounded-lg text-sm font-bold transition-colors
                      ${isHintCount
                        ? 'bg-game-amber-500 text-white ring-2 ring-game-amber-300'
                        : 'bg-logic-indigo-600 text-white hover:bg-logic-indigo-700'}
                    `}
                  >
                    {n}
                  </motion.button>
                );
              })}
              {piles[selectedPile]! > 15 && (
                <motion.button
                  type="button"
                  onClick={() => handleRemove(piles[selectedPile]!)}
                  whileTap={{ scale: 0.9 }}
                  className="h-9 px-3 rounded-lg bg-logic-indigo-600 text-white text-xs font-bold hover:bg-logic-indigo-700"
                >
                  {t('nim.removeAll', { count: piles[selectedPile]! })}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
