import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { LightsOutState, LightsOutMove } from './types';

export function LightsOutBoard({
  state, onMove, disabled = false, highlightCell,
}: BoardProps<LightsOutState, LightsOutMove>) {
  const { t } = useTranslation();
  const { n, grid } = state;
  const cellSize = Math.max(48, Math.min(80, 320 / n));

  return (
    <div
      className="grid justify-center gap-1"
      style={{
        gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${n}, ${cellSize}px)`,
      }}
    >
      {grid.map((cell, idx) => {
        const row = Math.floor(idx / n);
        const col = idx % n;
        const isHighlighted = highlightCell?.row === row && highlightCell?.col === col;
        const isOn = cell === 1;

        return (
          <motion.button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onMove({ row, col })}
            className={`
              rounded-xl border-2 outline-none transition-colors
              ${isOn
                ? 'bg-game-amber-400 border-game-amber-600 shadow-md shadow-game-amber-400/30'
                : 'bg-warm-stone-200 border-warm-stone-300'}
              ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              ${isHighlighted ? 'ring-[3px] ring-clarity-teal-light' : ''}
            `}
            style={{ width: cellSize, height: cellSize }}
            whileHover={!disabled ? { scale: 1.02 } : undefined}
            whileTap={!disabled ? { scale: 0.9 } : undefined}
            aria-label={t('lightsOut.cellAria', { row: row + 1, col: col + 1, state: isOn ? t('lightsOut.on') : t('lightsOut.off') })}
            aria-pressed={isOn}
          />
        );
      })}
    </div>
  );
}
