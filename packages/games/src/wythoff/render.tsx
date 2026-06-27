import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { WythoffState, WythoffMove } from './rules';

interface Props {
  state: WythoffState;
  onMove: (move: WythoffMove) => void;
  disabled?: boolean;
  highlightCell?: { row: number; col: number; value?: number } | null;
  onChooseHand?: (playerFirst: boolean) => void;
}

const STONE_W = 48;
const STONE_H = 36;
const STONE_STEP = 30;
const MAX_VISIBLE = 10;

const GRADIENTS = [
  'radial-gradient(circle at 35% 30%, #f5f2ee, #c4bdb2 50%, #8c8273 100%)',
  'radial-gradient(circle at 35% 30%, #f0ede7, #bdb5a7 50%, #857968 100%)',
];

const SHADOW = '0 1px 3px rgba(0,0,0,0.2), inset 0 -2px 3px rgba(0,0,0,0.1)';

export function WythoffBoard({ state, onMove, disabled, highlightCell, onChooseHand }: Props) {
  const [hover, setHover] = useState<{ pile: number; removeCount: number } | null>(null);
  const { piles, currentPlayer, phase } = state;
  const isPlayerTurn = currentPlayer === 0 && phase === 'playing';
  const isGameOver = piles[0] === 0 && piles[1] === 0;
  const isChoosing = phase === 'choosing';
  const { t } = useTranslation();

  const hintPileIndex = highlightCell?.row ?? null;
  const hintRemoveCount = highlightCell?.value ?? null;
  const hintType = highlightCell?.col === 2 ? 'both' : 'single';

  const handleStoneClick = (pileIndex: number, idx: number) => {
    if (!isPlayerTurn || disabled || isGameOver) return;
    const count = piles[pileIndex]!;
    const removeCount = count - idx;
    if (removeCount > 0 && removeCount <= count) {
      onMove({ type: 'single', pileIndex, removeCount });
      setHover(null);
    }
  };

  const handleBothClick = (removeCount: number) => {
    if (!isPlayerTurn || disabled || isGameOver) return;
    onMove({ type: 'both', removeCount });
    setHover(null);
  };

  const playerWon = isGameOver && currentPlayer === 1;
  const aiWon = isGameOver && currentPlayer === 0;

  const maxContainerH = MAX_VISIBLE > 0 ? (MAX_VISIBLE - 1) * STONE_STEP + STONE_H : 0;

  const renderPile = (
    count: number,
    pileIndex: number,
    isHinted: boolean,
    canInteract: boolean,
  ) => {
    const gradient = GRADIENTS[pileIndex % GRADIENTS.length]!;
    const visible = Math.min(count, MAX_VISIBLE);
    if (visible === 0) return null;

    const stones: React.ReactNode[] = [];
    for (let idx = visible - 1; idx >= 0; idx--) {
      // Bottom stone (idx=0) sits at bottom of fixed-height container
      const top = maxContainerH - STONE_H - idx * STONE_STEP;
      const removeCount = count - idx;
      const hoveredThisPile = hover?.pile === pileIndex && hover.removeCount >= removeCount;
      const isHintStone = isHinted && hintType === 'single' && removeCount === hintRemoveCount;

      let extraClass = '';
      let boxShadow = SHADOW;
      let z = idx;

      if (isHintStone) {
        extraClass = 'ring-[3px] ring-game-amber-400 scale-110';
        boxShadow = '0 0 0 4px rgba(232,168,56,0.5), ' + SHADOW;
        z = 50;
      } else if (hoveredThisPile && canInteract) {
        extraClass = 'brightness-75 scale-105';
        z = idx + 20;
      }

      stones.push(
        <button
          key={idx}
          type="button"
          onClick={() => handleStoneClick(pileIndex, idx)}
          onMouseEnter={() => canInteract ? setHover({ pile: pileIndex, removeCount }) : null}
          onMouseLeave={() => setHover(null)}
          disabled={!canInteract}
          className={`absolute rounded-full border border-white/20 transition-all duration-150 cursor-pointer
            ${extraClass}
            ${canInteract ? 'hover:brightness-90' : ''}
          `}
          style={{
            left: 0,
            top: `${top}px`,
            width: `${STONE_W}px`,
            height: `${STONE_H}px`,
            background: gradient,
            boxShadow,
            zIndex: z,
          }}
          aria-label={t('wythoff.stoneAria', { pile: pileIndex + 1, count: removeCount, remain: count - removeCount })}
        />,
      );
    }

    return stones;
  };

  // ── Choosing phase ──
  if (isChoosing) {
    const recommendPlayer = highlightCell?.row === 0 && highlightCell.col === 0;
    const recommendAI = highlightCell?.row === 0 && highlightCell.col === 1;

    const btnPlayerCls = recommendPlayer
      ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]'
      : '';
    const btnAICls = recommendAI
      ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]'
      : '';

    return (
      <div className="flex flex-col items-center gap-8 select-none">
        <div className="text-xl font-bold text-warm-stone-700">{t('wythoff.chooseHand')}</div>
        <div className="flex flex-wrap justify-center gap-3">
          {piles.map((count, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-warm-stone-50 min-w-[80px]">
              <div className="relative" style={{ width: STONE_W, height: maxContainerH }}>
                {renderPile(count, i, false, false)}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                {t('wythoff.pile', { index: i + 1 })}
              </span>
              <span className="text-xl font-bold font-mono text-warm-stone-800">{count}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <motion.button type="button" onClick={() => onChooseHand?.(true)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-logic-indigo-600 text-white font-bold text-lg hover:bg-logic-indigo-700 transition-all shadow-lg ${btnPlayerCls}`}>
            {t('wythoff.playFirst')}
          </motion.button>
          <motion.button type="button" onClick={() => onChooseHand?.(false)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-warm-stone-200 text-warm-stone-700 font-bold text-lg hover:bg-warm-stone-300 transition-all shadow-md ${btnAICls}`}>
            {t('wythoff.aiFirst')}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Playing phase ──
  const bothHover = hover?.pile === -1;
  const isBothHinted = hintType === 'both' && hintRemoveCount != null;
  const maxBoth = Math.min(piles[0]!, piles[1]!);

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <AnimatePresence mode="wait">
        {playerWon ? (
          <motion.div key="win" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-game-amber-600">{t('wythoff.youWin')}</motion.div>
        ) : aiWon ? (
          <motion.div key="lose" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-warm-stone-400">{t('wythoff.aiWins')}</motion.div>
        ) : (
          <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-lg font-semibold flex items-center gap-2 ${isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
            {isPlayerTurn ? t('wythoff.yourTurn') : t('wythoff.aiThinking')}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-6">
        {piles.map((count, i) => {
          const isEmpty = count === 0;
          const isHinted = hintPileIndex === i && hintType === 'single' && isPlayerTurn;
          const canInteract = isPlayerTurn && !disabled && !isGameOver;

          return (
            <motion.div key={i} layout
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl min-w-[80px] transition-all duration-200
                ${isHinted ? 'bg-game-amber-50 ring-2 ring-game-amber-400 shadow-lg' : 'bg-warm-stone-50'}
                ${!isPlayerTurn || disabled || isGameOver || isEmpty ? 'opacity-50' : ''}
              `}
            >
              <div className="relative" style={{ width: STONE_W, height: maxContainerH }}>
                {renderPile(count, i, isHinted, canInteract)}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                {t('wythoff.pile', { index: i + 1 })}
              </span>
              <span className={`text-xl font-bold font-mono tabular-nums ${isEmpty ? 'text-warm-stone-300' : 'text-warm-stone-800'}`}>
                {count}
              </span>
            </motion.div>
          );
        })}

        {/* Both-pile removal buttons */}
        {maxBoth > 0 && isPlayerTurn && !isGameOver && (
          <motion.div layout
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl min-w-[80px] transition-all duration-200
              ${isBothHinted ? 'bg-game-amber-50 ring-2 ring-game-amber-400 shadow-lg' : 'bg-warm-stone-50'}
              ${!isPlayerTurn || disabled || isGameOver ? 'opacity-50' : ''}
            `}
            onMouseEnter={() => {}}
            onMouseLeave={() => setHover(null)}
          >
            <div className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold mb-1">
              {t('wythoff.bothPiles')}
            </div>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {Array.from({ length: maxBoth }, (_, idx) => {
                const r = idx + 1;
                const isHintedBoth = isBothHinted && r === hintRemoveCount;
                const hoveredBoth = bothHover && hover!.removeCount >= r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleBothClick(r)}
                    onMouseEnter={() => setHover({ pile: -1, removeCount: r })}
                    onMouseLeave={() => setHover(null)}
                    disabled={!isPlayerTurn || disabled || isGameOver}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all shrink-0
                      ${isHintedBoth
                        ? 'bg-game-amber-400 text-white ring-[3px] ring-game-amber-400 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]'
                        : hoveredBoth && isPlayerTurn
                          ? 'bg-logic-indigo-500 text-white scale-105'
                          : 'bg-warm-stone-200 text-warm-stone-700 hover:bg-logic-indigo-100'
                      }
                      ${!isPlayerTurn || disabled || isGameOver ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    -{r}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {hintPileIndex != null && hintRemoveCount != null && isPlayerTurn && !isGameOver && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-game-amber-700 bg-game-amber-50 px-4 py-2 rounded-lg font-medium shadow-sm">
            {hintType === 'both'
              ? t('wythoff.hintTipBoth', { count: hintRemoveCount })
              : t('wythoff.hintTip', { pile: hintPileIndex + 1, count: hintRemoveCount })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
