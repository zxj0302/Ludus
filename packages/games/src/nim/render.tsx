import { useState, useRef } from 'react';
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

const STONE_SIZE = 32;
const STONE_STEP = 18; // spacing between stone centers

export function NimBoard({ state, onMove, disabled, highlightCell, onChooseHand, onNewGame }: Props) {
  const [hoverCount, setHoverCount] = useState<number | null>(null);
  const { piles, currentPlayer, initialPiles, phase } = state;
  const isPlayerTurn = currentPlayer === 0 && phase === 'playing';
  const isGameOver = piles.every(v => v === 0);
  const isChoosing = phase === 'choosing';
  const { t } = useTranslation();

  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const hintPileIndex = highlightCell?.row ?? null;
  const hintRemoveCount = highlightCell?.value ?? null;

  // Click a stone: remove that stone + all above
  const handleStoneClick = (pileIndex: number, stoneIdx: number) => {
    if (!isPlayerTurn || disabled || isGameOver) return;
    const count = piles[pileIndex]!;
    const removeCount = count - stoneIdx;
    if (removeCount > 0 && removeCount <= count) {
      onMoveRef.current({ pileIndex, removeCount });
      setHoverCount(null);
    }
  };

  const playerWon = isGameOver && currentPlayer === 1;
  const aiWon = isGameOver && currentPlayer === 0;

  // ── Choosing phase ──
  if (isChoosing) {
    return (
      <div className="flex flex-col items-center gap-8 select-none">
        <div className="text-lg font-semibold text-warm-stone-700">{t('nim.chooseHand')}</div>
        <div className="flex flex-wrap justify-center gap-6">
          {piles.map((count, i) => {
            const color = PILE_COLORS[i % PILE_COLORS.length]!;
            const visibleStones = Math.min(count, 10);
            return (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-warm-stone-50 min-w-[80px]">
                <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                  {t('nim.pile', { index: i + 1 })}
                </span>
                <div className="relative" style={{ width: STONE_SIZE, height: Math.max(visibleStones * STONE_STEP - (STONE_STEP - STONE_SIZE), STONE_SIZE) }}>
                  {Array.from({ length: visibleStones }, (_, j) => (
                    <span
                      key={j}
                      className={`absolute left-0 rounded-full ${color.bg} ${color.shadow} border border-white/30`}
                      style={{ top: j * STONE_STEP, width: STONE_SIZE, height: STONE_SIZE }}
                    />
                  ))}
                  {count > 10 && (
                    <span className="absolute left-0 text-[10px] text-warm-stone-400 font-bold" style={{ top: 10 * STONE_STEP + 2, width: STONE_SIZE, textAlign: 'center' }}>
                      +{count - 10}
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-warm-stone-800">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4">
          <motion.button type="button" onClick={() => onChooseHand?.(true)} whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-logic-indigo-600 text-white font-bold text-lg hover:bg-logic-indigo-700 transition-colors shadow-lg">
            {t('nim.playFirst')}
          </motion.button>
          <motion.button type="button" onClick={() => onChooseHand?.(false)} whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-warm-stone-200 text-warm-stone-700 font-bold text-lg hover:bg-warm-stone-300 transition-colors shadow-lg">
            {t('nim.aiFirst')}
          </motion.button>
        </div>
        <div className="flex gap-2">
          <span className="text-xs text-warm-stone-400 self-center">{t('nim.difficulty')}:</span>
          {(['easy', 'medium', 'hard'] as const).map(p => (
            <button key={p} type="button" onClick={() => onNewGame?.(p)}
              className="text-xs px-2 py-1 rounded-md bg-warm-stone-100 text-warm-stone-500 hover:bg-warm-stone-200 hover:text-warm-stone-700 transition-colors">
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
          <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-lg font-semibold flex items-center gap-2 ${isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
            {isPlayerTurn ? t('nim.yourTurn') : t('nim.aiThinking')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial piles reference */}
      <div className="text-xs text-warm-stone-400 font-mono tracking-wide">
        {initialPiles.join(' · ')}
      </div>

      {/* Piles — click stone to remove */}
      <div className="flex flex-wrap justify-center gap-6">
        {piles.map((count, i) => {
          const isEmpty = count === 0;
          const isHinted = hintPileIndex === i && isPlayerTurn;
          const color = PILE_COLORS[i % PILE_COLORS.length]!;
          const visibleStones = Math.min(count, 12);
          const stackH = Math.max(visibleStones * STONE_STEP - (STONE_STEP - STONE_SIZE), STONE_SIZE);

          return (
            <motion.div
              key={i}
              layout
              className={`
                flex flex-col items-center gap-3 p-4 rounded-2xl min-w-[90px] transition-all duration-200
                ${isHinted && isPlayerTurn ? 'bg-game-amber-50 ring-2 ring-game-amber-400' : 'bg-warm-stone-50'}
                ${!isPlayerTurn || disabled || isGameOver || isEmpty ? 'opacity-50' : ''}
              `}
            >
              <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                {t('nim.pile', { index: i + 1 })}
              </span>
              {/* Clickable stacked stones */}
              <div className="relative" style={{ width: STONE_SIZE, height: stackH }}>
                {Array.from({ length: visibleStones }, (_, j) => {
                  const removeCount = count - j; // clicking this stone removes (count - j) stones
                  const isInHover = hoverCount != null && hoverCount >= removeCount;
                  const isHintStone = isHinted && removeCount === hintRemoveCount;
                  return (
                    <motion.button
                      key={j}
                      type="button"
                      onClick={() => handleStoneClick(i, j)}
                      onMouseEnter={() => isPlayerTurn && !disabled && !isGameOver ? setHoverCount(removeCount) : null}
                      onMouseLeave={() => setHoverCount(null)}
                      disabled={!isPlayerTurn || disabled || isGameOver}
                      whileTap={!disabled && isPlayerTurn && !isGameOver ? { scale: 0.85 } : undefined}
                      className={`absolute left-0 rounded-full border border-white/30 transition-all cursor-pointer ${color.bg} ${color.shadow} hover:brightness-90
                        ${isHintStone && isPlayerTurn ? 'ring-2 ring-game-amber-400 scale-110 z-10' : ''}
                        ${isInHover && !isHintStone ? 'brightness-75 scale-105' : ''}
                      `}
                      style={{ top: j * STONE_STEP, width: STONE_SIZE, height: STONE_SIZE }}
                      aria-label={`Remove ${removeCount} from pile ${i + 1} (leaving ${j} stones)`}
                    />
                  );
                })}
                {count > 12 && (
                  <span className="absolute left-0 text-[10px] text-warm-stone-400 font-bold" style={{ top: 12 * STONE_STEP + 2, width: STONE_SIZE, textAlign: 'center' }}>
                    +{count - 12}
                  </span>
                )}
              </div>
              <span className={`text-lg font-bold tabular-nums ${isEmpty ? 'text-warm-stone-300' : 'text-warm-stone-800'}`}>
                {count}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Hint tooltip */}
      <AnimatePresence>
        {hintPileIndex != null && hintRemoveCount != null && isPlayerTurn && !isGameOver && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-game-amber-700 bg-game-amber-50 px-4 py-2 rounded-lg font-medium">
            {t('nim.hintTip', { pile: hintPileIndex + 1, count: hintRemoveCount })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Difficulty presets */}
      <div className="flex gap-2 mt-1">
        <span className="text-[10px] text-warm-stone-400 self-center mr-1">{t('nim.difficulty')}:</span>
        {(['easy', 'medium', 'hard'] as const).map(p => (
          <button key={p} type="button" onClick={() => onNewGame?.(p)}
            className="text-[10px] px-2 py-0.5 rounded-md bg-warm-stone-100 text-warm-stone-500 hover:bg-warm-stone-200 hover:text-warm-stone-700 transition-colors">
            {t(`difficulty.${p}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
