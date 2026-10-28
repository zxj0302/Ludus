import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FifteenState, FifteenMove } from './types';
import { SIZE, GOAL_GRID } from './types';
import { legalMoves } from './rules';

interface Props {
  state: FifteenState;
  onMove: (move: FifteenMove) => void;
  disabled?: boolean;
  highlightCell?: { row: number; col: number; value?: number } | null;
}

const TILE_COLORS = [
  '', // 0 = empty, unused
  'bg-logic-indigo-500 text-white shadow-logic-indigo/20',
  'bg-logic-indigo-400 text-white shadow-logic-indigo/15',
  'bg-logic-indigo-600 text-white shadow-logic-indigo/25',
  'bg-clarity-teal-500 text-white shadow-clarity-teal/20',
  'bg-clarity-teal-400 text-white shadow-clarity-teal/15',
  'bg-clarity-teal-600 text-white shadow-clarity-teal/25',
  'bg-game-amber-500 text-white shadow-game-amber/20',
  'bg-game-amber-400 text-white shadow-game-amber/15',
  'bg-game-amber-600 text-white shadow-game-amber/25',
  'bg-logic-indigo-500 text-white shadow-logic-indigo/20',
  'bg-logic-indigo-400 text-white shadow-logic-indigo/15',
  'bg-clarity-teal-500 text-white shadow-clarity-teal/20',
  'bg-clarity-teal-400 text-white shadow-clarity-teal/15',
  'bg-game-amber-500 text-white shadow-game-amber/20',
  'bg-game-amber-400 text-white shadow-game-amber/15',
];

export function FifteenBoard({ state, onMove, disabled, highlightCell }: Props) {
  const { grid } = state;
  const { t } = useTranslation();
  const isWin = grid.every((v, i) => v === GOAL_GRID[i]);

  const movableTiles = new Set(legalMoves(state).map(m => m.tileIndex));
  const hintIdx = highlightCell != null ? highlightCell.row * SIZE + highlightCell.col : -1;

  const handleTileClick = (idx: number) => {
    if (disabled || isWin) return;
    if (!movableTiles.has(idx)) return;
    onMove({ tileIndex: idx });
  };

  // Keyboard support
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled || isWin) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
      return;
    }
    const emptyIdx = grid.indexOf(0);
    const row = Math.floor(emptyIdx / SIZE);
    const col = emptyIdx % SIZE;
    let tileIdx = -1;
    if (e.key === 'ArrowUp' && row < SIZE - 1) tileIdx = emptyIdx + SIZE;
    else if (e.key === 'ArrowDown' && row > 0) tileIdx = emptyIdx - SIZE;
    else if (e.key === 'ArrowLeft' && col < SIZE - 1) tileIdx = emptyIdx + 1;
    else if (e.key === 'ArrowRight' && col > 0) tileIdx = emptyIdx - 1;
    if (tileIdx >= 0) {
      e.preventDefault();
      onMove({ tileIndex: tileIdx });
    }
  }, [disabled, isWin, grid, onMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div
        className="grid gap-1.5 p-3 rounded-2xl bg-warm-stone-100 shadow-inner"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
      >
        {grid.map((val, idx) => {
          if (val === 0) {
            return (
              <div
                key="empty"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-warm-stone-300 bg-warm-stone-50/50"
                aria-label={t('fifteen.empty')}
              />
            );
          }

          const row = Math.floor(idx / SIZE);
          const col = idx % SIZE;
          const isMovable = movableTiles.has(idx);
          const isHinted = idx === hintIdx;
          const colorClass = TILE_COLORS[val] || 'bg-warm-stone-500 text-white';

          return (
            <motion.button
              key={val}
              type="button"
              layout
              onClick={() => handleTileClick(idx)}
              disabled={!isMovable || disabled || isWin}
              className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-xl font-bold text-xl sm:text-2xl
                flex items-center justify-center
                transition-shadow duration-150
                ${colorClass}
                ${isMovable ? 'cursor-pointer hover:brightness-110 hover:shadow-lg' : 'cursor-default opacity-60'}
                ${isHinted ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]' : ''}
                ${isWin ? 'brightness-110' : ''}
                shadow-md
              `}
              style={{ aspectRatio: '1' }}
              aria-label={t('fifteen.tileAria', { value: val, row: row + 1, col: col + 1 })}
              whileTap={isMovable ? { scale: 0.9 } : {}}
            >
              {val}
            </motion.button>
          );
        })}
      </div>

      {isWin && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-bold text-game-amber-600"
        >
          {t('fifteen.solved')}
        </motion.div>
      )}
    </div>
  );
}
