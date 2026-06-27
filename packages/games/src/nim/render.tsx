import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { NimState, NimMove } from './rules';

interface Props {
  state: NimState;
  onMove: (move: NimMove) => void;
  disabled?: boolean;
  highlightCell?: { row: number; col: number; value?: number } | null;
  onChooseHand?: (playerFirst: boolean) => void;
  onNewGame?: (preset: 'easy' | 'medium' | 'hard') => void;
}

const PILE_COLORS = [
  { bg: 'bg-amber-500', shadow: 'shadow-amber-300/40', ring: 'ring-amber-400' },
  { bg: 'bg-emerald-500', shadow: 'shadow-emerald-300/40', ring: 'ring-emerald-400' },
  { bg: 'bg-violet-500', shadow: 'shadow-violet-300/40', ring: 'ring-violet-400' },
  { bg: 'bg-rose-500', shadow: 'shadow-rose-300/40', ring: 'ring-rose-400' },
  { bg: 'bg-cyan-500', shadow: 'shadow-cyan-300/40', ring: 'ring-cyan-400' },
];

export function NimBoard({ state, onMove, disabled, highlightCell, onChooseHand, onNewGame }: Props) {
  const [selectedPile, setSelectedPile] = useState<number | null>(null);
  const { piles, currentPlayer, initialPiles, phase } = state;
  const isPlayerTurn = currentPlayer === 0 && phase === 'playing';
  const isGameOver = piles.every(v => v === 0);
  const isChoosing = phase === 'choosing';
  const { t } = useTranslation();

  const selectedPileRef = useRef(selectedPile);
  selectedPileRef.current = selectedPile;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const hintPileIndex = highlightCell?.row ?? null;
  const hintRemoveCount = highlightCell?.value ?? null;

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

  const playerWon = isGameOver && currentPlayer === 1;
  const aiWon = isGameOver && currentPlayer === 0;

  // ── Choosing phase ──
  if (isChoosing) {
    return (
      <div className="flex flex-col items-center gap-8 select-none">
        <div className="text-lg font-semibold text-warm-stone-700">{t('nim.chooseHand')}</div>
        <div className="flex flex-wrap justify-center gap-4">
          {piles.map((count, i) => {
            const color = PILE_COLORS[i % PILE_COLORS.length]!;
            return (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-warm-stone-50 min-w-[80px]">
                <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                  {t('nim.pile', { index: i + 1 })}
                </span>
                <div className="relative flex flex-col items-center" style={{ height: Math.min(count, 8) * 16 + 16 }}>
                  {Array.from({ length: Math.min(count, 8) }, (_, j) => (
                    <span
                      key={j}
                      className={`absolute w-4 h-4 rounded-full ${color.bg} ${color.shadow}`}
                      style={{ top: j * 8 }}
                    />
                  ))}
                  {count > 8 && (
                    <span className="absolute text-[10px] text-warm-stone-400 font-bold" style={{ top: 8 * 8 + 4 }}>
                      +{count - 8}
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-warm-stone-800">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4">
          <motion.button
            type="button"
            onClick={() => onChooseHand?.(true)}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-logic-indigo-600 text-white font-bold text-lg hover:bg-logic-indigo-700 transition-colors shadow-lg"
          >
            {t('nim.playFirst')}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onChooseHand?.(false)}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-warm-stone-200 text-warm-stone-700 font-bold text-lg hover:bg-warm-stone-300 transition-colors shadow-lg"
          >
            {t('nim.aiFirst')}
          </motion.button>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="text-xs text-warm-stone-400">{t('nim.difficulty')}:</span>
          {(['easy', 'medium', 'hard'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => onNewGame?.(p)}
              className="text-xs px-2 py-1 rounded-md bg-warm-stone-100 text-warm-stone-500 hover:bg-warm-stone-200 hover:text-warm-stone-700 transition-colors"
            >
              {t(`difficulty.${p}`)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Playing phase ──
  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Status */}
      <AnimatePresence mode="wait">
        {playerWon ? (
          <motion.div key="win" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-bold text-game-amber-600">
            {t('nim.youWin')}
          </motion.div>
        ) : aiWon ? (
          <motion.div key="lose" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-bold text-warm-stone-400">
            {t('nim.aiWins')}
          </motion.div>
        ) : (
          <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-lg font-semibold flex items-center gap-2 ${isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
            {isPlayerTurn ? t('nim.yourTurn') : t('nim.aiThinking')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial piles reference */}
      <div className="text-xs text-warm-stone-400 font-mono tracking-wide">
        {initialPiles.join(' · ')}
      </div>

      {/* Piles — stacked stones */}
      <div className="flex flex-wrap justify-center gap-5">
        {piles.map((count, i) => {
          const isSelected = selectedPile === i;
          const isHinted = hintPileIndex === i && isPlayerTurn;
          const isEmpty = count === 0;
          const color = PILE_COLORS[i % PILE_COLORS.length]!;
          const displayCount = Math.min(count, 12);
          const stackHeight = Math.max(displayCount * 10, 20);

          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => handlePileClick(i)}
              disabled={!isPlayerTurn || disabled || isGameOver || isEmpty}
              whileTap={!disabled && isPlayerTurn && !isGameOver && !isEmpty ? { scale: 0.95 } : undefined}
              layout
              className={`
                flex flex-col items-center gap-3 p-4 rounded-2xl min-w-[90px] transition-all duration-200
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
              {/* Stacked stones */}
              <div className="relative" style={{ width: 48, height: stackHeight }}>
                {Array.from({ length: displayCount }, (_, j) => (
                  <span
                    key={j}
                    className={`absolute left-1/2 -translate-x-1/2 w-7 h-7 rounded-full ${color.bg} ${color.shadow} border border-white/30`}
                    style={{ top: j * 10 }}
                  />
                ))}
                {count > 12 && (
                  <span className="absolute left-1/2 -translate-x-1/2 text-[10px] text-warm-stone-400 font-bold" style={{ top: 12 * 10 + 2 }}>
                    +{count - 12}
                  </span>
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
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-2">
            <span className="text-xs text-warm-stone-500">{t('nim.selectRemove')}</span>
            <div className="flex gap-1.5 flex-wrap justify-center max-w-[360px]">
              {Array.from({ length: Math.min(piles[selectedPile]!, 15) }, (_, i) => i + 1).map((n) => {
                const isHintCount = hintPileIndex === selectedPile && n === hintRemoveCount;
                return (
                  <motion.button
                    key={n}
                    type="button"
                    onClick={() => handleRemove(n)}
                    whileTap={{ scale: 0.9 }}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors
                      ${isHintCount ? 'bg-game-amber-500 text-white ring-2 ring-game-amber-300' : 'bg-logic-indigo-600 text-white hover:bg-logic-indigo-700'}`}
                  >
                    {n}
                  </motion.button>
                );
              })}
              {piles[selectedPile]! > 15 && (
                <motion.button type="button" onClick={() => handleRemove(piles[selectedPile]!)} whileTap={{ scale: 0.9 }} className="h-9 px-3 rounded-lg bg-logic-indigo-600 text-white text-xs font-bold hover:bg-logic-indigo-700">
                  {t('nim.removeAll', { count: piles[selectedPile]! })}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Difficulty presets */}
      <div className="flex gap-2 mt-1">
        <span className="text-[10px] text-warm-stone-400 self-center mr-1">{t('nim.difficulty')}:</span>
        {(['easy', 'medium', 'hard'] as const).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onNewGame?.(p)}
            className="text-[10px] px-2 py-0.5 rounded-md bg-warm-stone-100 text-warm-stone-500 hover:bg-warm-stone-200 hover:text-warm-stone-700 transition-colors"
          >
            {t(`difficulty.${p}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
