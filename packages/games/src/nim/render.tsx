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

const STONE_W = 48;
const STONE_H = 36;
const STONE_STEP = 22;

const GRADIENTS = [
  'radial-gradient(circle at 35% 30%, #f5f2ee, #c4bdb2 50%, #8c8273 100%)',
  'radial-gradient(circle at 35% 30%, #f0ede7, #bdb5a7 50%, #857968 100%)',
  'radial-gradient(circle at 35% 30%, #f3efe9, #c2b9aa 50%, #8a7d6c 100%)',
  'radial-gradient(circle at 35% 30%, #f2eee7, #c0b6a5 50%, #877a68 100%)',
  'radial-gradient(circle at 35% 30%, #f4f0eb, #c6bcad 50%, #8e8170 100%)',
];

// Horizontal offsets so stones in a pile don't align perfectly
const JIGGLE = [0, -3, 2, -1, 3, -2, 0, 1, -3, 2, -1, 3];
const SHADOW = '0 1px 3px rgba(0,0,0,0.2), inset 0 -2px 3px rgba(0,0,0,0.1)';

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

  const renderStone = (
    pileIndex: number,
    stoneIdx: number,
    count: number,
    opts: {
      isHinted: boolean;
      isPlayerTurn: boolean;
      canInteract: boolean;
      isInHover: boolean;
      visible: number;
      gradient: string;
    },
  ) => {
    const removeCount = count - stoneIdx;
    const isHintStone = opts.isHinted && removeCount === hintRemoveCount;
    const left = 4 + JIGGLE[stoneIdx % JIGGLE.length]!;
    const top = stoneIdx * STONE_STEP;

    let ring = '';
    let brightness = '';
    let z = stoneIdx;
    if (isHintStone && opts.canInteract) {
      ring = 'ring-[3px] ring-game-amber-400';
      z = 50;
    } else if (opts.isInHover && opts.canInteract) {
      brightness = 'brightness-75';
      z = stoneIdx + 20;
    }

    return (
      <button
        key={stoneIdx}
        type="button"
        onClick={() => handleStoneClick(pileIndex, stoneIdx)}
        onMouseEnter={() => opts.canInteract ? setHoverCount(removeCount) : null}
        onMouseLeave={() => setHoverCount(null)}
        disabled={!opts.canInteract}
        className={`absolute rounded-full border border-white/20 transition-all duration-150 cursor-pointer
          ${ring} ${brightness}
          ${opts.canInteract ? 'hover:brightness-90 active:scale-90' : ''}
        `}
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${STONE_W}px`,
          height: `${STONE_H}px`,
          background: opts.gradient,
          boxShadow: isHintStone ? '0 0 0 4px rgba(232,168,56,0.5), ' + SHADOW : SHADOW,
          zIndex: z,
        }}
        aria-label={`Remove ${removeCount} stones from pile ${pileIndex + 1}`}
      />
    );
  };

  const containerStyle = (visible: number) => ({
    width: `${STONE_W + 10}px`,
    height: `${Math.max(visible * STONE_STEP + STONE_H, STONE_H)}px`,
  });

  // ── Choosing phase ──
  if (isChoosing) {
    return (
      <div className="flex flex-col items-center gap-8 select-none">
        <div className="text-xl font-bold text-warm-stone-700">{t('nim.chooseHand')}</div>
        <div className="text-sm text-warm-stone-500 font-mono">
          Nim-sum = {piles.join(' ^ ')} = {piles.reduce((a, b) => a ^ b, 0)}
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {piles.map((count, i) => {
            const gradient = GRADIENTS[i % GRADIENTS.length]!;
            const visible = Math.min(count, 8);
            return (
              <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-warm-stone-50 min-w-[90px]">
                <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                  {t('nim.pile', { index: i + 1 })}
                </span>
                <div className="relative" style={containerStyle(visible)}>
                  {Array.from({ length: visible }, (_, j) => (
                    <span
                      key={j}
                      className="absolute rounded-full border border-white/20"
                      style={{
                        left: `${4 + JIGGLE[j % JIGGLE.length]!}px`,
                        top: `${j * STONE_STEP}px`,
                        width: `${STONE_W}px`,
                        height: `${STONE_H}px`,
                        background: gradient,
                        boxShadow: SHADOW,
                        zIndex: j,
                      }}
                    />
                  ))}
                  {count > 8 && (
                    <span className="absolute text-[11px] text-warm-stone-500 font-bold" style={{ left: '20px', top: `${8 * STONE_STEP + 6}px` }}>
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

      <div className="text-sm text-warm-stone-500 font-mono">
        {piles.join('  ')} &nbsp;→&nbsp; XOR = {piles.reduce((a, b) => a ^ b, 0)}
        {piles.reduce((a, b) => a ^ b, 0) === 0
          ? <span className="ml-2 text-red-500 font-semibold">{t('nim.pPosition')}</span>
          : <span className="ml-2 text-blue-600 font-semibold">{t('nim.nPosition')}</span>
        }
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {piles.map((count, i) => {
          const isEmpty = count === 0;
          const isHinted = hintPileIndex === i && isPlayerTurn;
          const gradient = GRADIENTS[i % GRADIENTS.length]!;
          const visible = Math.min(count, 10);
          const canInteract = isPlayerTurn && !disabled && !isGameOver;

          return (
            <motion.div key={i} layout
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl min-w-[110px] transition-all duration-200
                ${isHinted && isPlayerTurn ? 'bg-game-amber-50 ring-2 ring-game-amber-400 shadow-lg' : 'bg-warm-stone-50'}
                ${!isPlayerTurn || disabled || isGameOver || isEmpty ? 'opacity-50' : ''}
              `}
            >
              <span className="text-[10px] uppercase tracking-wider text-warm-stone-400 font-semibold">
                {t('nim.pile', { index: i + 1 })}
              </span>
              <div className="relative" style={containerStyle(visible)}>
                {Array.from({ length: visible }, (_, j) => {
                  const removeCount = count - j;
                  const isInHover = hoverCount != null && hoverCount >= removeCount;
                  return renderStone(i, j, count, { isHinted, isPlayerTurn, canInteract, isInHover, visible, gradient });
                })}
                {count > 10 && (
                  <span className="absolute text-[11px] text-warm-stone-500 font-bold" style={{ left: '22px', top: `${10 * STONE_STEP + 6}px` }}>
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

      <AnimatePresence>
        {hintPileIndex != null && hintRemoveCount != null && isPlayerTurn && !isGameOver && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-game-amber-700 bg-game-amber-50 px-4 py-2 rounded-lg font-medium shadow-sm">
            {t('nim.hintTip', { pile: hintPileIndex + 1, count: hintRemoveCount })}
          </motion.div>
        )}
      </AnimatePresence>

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
