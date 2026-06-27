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

// ── Stone appearance constants ──
const STONE_W = 46;
const STONE_H = 34;
const STONE_STEP = 20; // vertical spacing between stone centers

// Warm stone-like gradient per pile — each is a slightly different natural hue
const STONE_GRADIENTS = [
  'radial-gradient(circle at 35% 30%, #e7e5e4, #a8a29e 55%, #78716c 100%)',
  'radial-gradient(circle at 35% 30%, #e0ddd8, #9e9689 55%, #6b6255 100%)',
  'radial-gradient(circle at 35% 30%, #ddd9d3, #968b7d 55%, #63584b 100%)',
  'radial-gradient(circle at 35% 30%, #e2dfd9, #a09888 55%, #6e6355 100%)',
  'radial-gradient(circle at 35% 30%, #e5e0d8, #a49b89 55%, #736758 100%)',
];

const STONE_SHADOW = '0 2px 4px rgba(0,0,0,0.25), 0 0 2px rgba(0,0,0,0.1)';

// Horizontal jitter per stone position within a pile
const JITTER = [-2, 3, -1, 2, -3, 1, -2, 0, 3, -1, 2, -3, 0, 1, -2];

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
        <div className="text-xl font-bold text-warm-stone-700">{t('nim.chooseHand')}</div>
        <div className="text-sm text-warm-stone-500 text-center max-w-xs">
          Nim-sum = {piles.join(' ^ ')} = {piles.reduce((a, b) => a ^ b, 0)}
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {piles.map((count, i) => {
            const gradient = STONE_GRADIENTS[i % STONE_GRADIENTS.length]!;
            const visible = Math.min(count, 8);
            return (
              <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-warm-stone-50 min-w-[90px]">
                <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                  {t('nim.pile', { index: i + 1 })}
                </span>
                <div style={{ width: STONE_W, height: Math.max(visible * STONE_STEP + (STONE_H - STONE_STEP), STONE_H) }}>
                  {Array.from({ length: visible }, (_, j) => (
                    <span
                      key={j}
                      className="absolute left-0 rounded-[45%]"
                      style={{
                        top: j * STONE_STEP,
                        width: STONE_W,
                        height: STONE_H,
                        background: gradient,
                        boxShadow: STONE_SHADOW,
                        transform: `translateX(${JITTER[j % JITTER.length]!}px)`,
                      }}
                    />
                  ))}
                  {count > 8 && (
                    <span className="absolute text-[11px] text-warm-stone-500 font-bold" style={{ left: STONE_W / 2 - 12, top: 8 * STONE_STEP + 4 }}>
                      +{count - 8}
                    </span>
                  )}
                </div>
                <span className="text-xl font-bold font-mono text-warm-stone-800">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4">
          <motion.button type="button" onClick={() => onChooseHand?.(true)} whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-xl bg-logic-indigo-600 text-white font-bold text-lg hover:bg-logic-indigo-700 transition-colors shadow-lg">
            {t('nim.playFirst')}
          </motion.button>
          <motion.button type="button" onClick={() => onChooseHand?.(false)} whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-xl bg-warm-stone-200 text-warm-stone-700 font-bold text-lg hover:bg-warm-stone-300 transition-colors shadow-md">
            {t('nim.aiFirst')}
          </motion.button>
        </div>
        <div className="flex gap-2">
          <span className="text-xs text-warm-stone-400 self-center">{t('nim.difficulty')}:</span>
          {(['easy', 'medium', 'hard'] as const).map(p => (
            <button key={p} type="button" onClick={() => onNewGame?.(p)}
              className="text-xs px-2.5 py-1 rounded-md bg-warm-stone-100 text-warm-stone-500 hover:bg-warm-stone-200 hover:text-warm-stone-700 transition-colors">
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
          <motion.div key="win" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-game-amber-600">
            {t('nim.youWin')}
          </motion.div>
        ) : aiWon ? (
          <motion.div key="lose" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-warm-stone-400">
            {t('nim.aiWins')}
          </motion.div>
        ) : (
          <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-lg font-semibold flex items-center gap-2 ${
              isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'
            }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
            {isPlayerTurn ? t('nim.yourTurn') : t('nim.aiThinking')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nim-sum display */}
      <div className="text-sm text-warm-stone-500 font-mono">
        {piles.join('  ')} &nbsp;→&nbsp; XOR = {piles.reduce((a, b) => a ^ b, 0)}
        {piles.reduce((a, b) => a ^ b, 0) === 0
          ? <span className="ml-2 text-red-500 font-semibold">{t('nim.pPosition')}</span>
          : <span className="ml-2 text-blue-600 font-semibold">{t('nim.nPosition')}</span>
        }
      </div>

      {/* Piles */}
      <div className="flex flex-wrap justify-center gap-8">
        {piles.map((count, i) => {
          const isEmpty = count === 0;
          const isHinted = hintPileIndex === i && isPlayerTurn;
          const gradient = STONE_GRADIENTS[i % STONE_GRADIENTS.length]!;
          const visible = Math.min(count, 10);
          const containerH = Math.max(visible * STONE_STEP + (STONE_H - STONE_STEP), STONE_H);

          return (
            <motion.div key={i} layout
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl min-w-[100px] transition-all duration-200
                ${isHinted && isPlayerTurn ? 'bg-game-amber-50 ring-2 ring-game-amber-400 shadow-lg' : 'bg-warm-stone-50'}
                ${!isPlayerTurn || disabled || isGameOver || isEmpty ? 'opacity-50' : ''}
              `}
            >
              <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                {t('nim.pile', { index: i + 1 })}
              </span>

              {/* Stacked stones */}
              <div className="relative" style={{ width: STONE_W, height: containerH }}>
                {Array.from({ length: visible }, (_, j) => {
                  const removeCount = count - j;
                  const isInHover = hoverCount != null && hoverCount >= removeCount;
                  const isHintStone = isHinted && removeCount === hintRemoveCount;
                  const canInteract = isPlayerTurn && !disabled && !isGameOver;
                  return (
                    <motion.button
                      key={j}
                      type="button"
                      onClick={() => handleStoneClick(i, j)}
                      onMouseEnter={() => canInteract ? setHoverCount(removeCount) : null}
                      onMouseLeave={() => setHoverCount(null)}
                      disabled={!canInteract}
                      whileTap={canInteract ? { scale: 0.9 } : undefined}
                      className={`absolute rounded-[45%] border border-white/10 transition-all duration-150 cursor-pointer
                        ${isHintStone && canInteract ? 'ring-[3px] ring-game-amber-400 z-10' : ''}
                        ${isInHover && !isHintStone && canInteract ? 'brightness-75' : ''}
                      `}
                      style={{
                        top: j * STONE_STEP,
                        width: STONE_W,
                        height: STONE_H,
                        background: gradient,
                        boxShadow: isHintStone ? '0 0 0 4px rgba(232,168,56,0.4), 0 2px 4px rgba(0,0,0,0.3)' : STONE_SHADOW,
                        transform: `translateX(${JITTER[j % JITTER.length]!}px) scale(${isHintStone ? 1.08 : isInHover ? 1.04 : 1})`,
                        zIndex: isHintStone ? 20 : j,
                      }}
                      aria-label={`Remove ${removeCount} stones from pile ${i + 1}`}
                    />
                  );
                })}
                {count > 10 && (
                  <span className="absolute text-[11px] text-warm-stone-500 font-bold"
                    style={{ left: STONE_W / 2 - 14, top: 10 * STONE_STEP + 6 }}>
                    +{count - 10}
                  </span>
                )}
              </div>

              <span className={`text-xl font-bold font-mono tabular-nums ${isEmpty ? 'text-warm-stone-300' : 'text-warm-stone-800'}`}>
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
            className="text-sm text-game-amber-700 bg-game-amber-50 px-4 py-2 rounded-lg font-medium shadow-sm">
            {t('nim.hintTip', { pile: hintPileIndex + 1, count: hintRemoveCount })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Difficulty presets */}
      <div className="flex gap-2">
        <span className="text-[10px] text-warm-stone-400 self-center mr-1">{t('nim.difficulty')}:</span>
        {(['easy', 'medium', 'hard'] as const).map(p => (
          <button key={p} type="button" onClick={() => onNewGame?.(p)}
            className="text-[10px] px-2.5 py-1 rounded-md bg-warm-stone-100 text-warm-stone-500 hover:bg-warm-stone-200 hover:text-warm-stone-700 transition-colors">
            {t(`difficulty.${p}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
