import React from 'react';
import { motion } from 'framer-motion';
import type { LightsOutState, LightsOutMove } from './rules';

interface Props {
  state: LightsOutState;
  onMove: (move: LightsOutMove) => void;
  disabled?: boolean;
  highlightCell?: { row: number; col: number } | null;
}

const ON_COLOR = '#ffb41e';
const ON_BORDER = '#db6f04';
const OFF_COLOR = '#e7e0d8';
const OFF_BORDER = '#d4cbc2';
const HIGHLIGHT_RING = '#5feacb';

export function LightsOutBoard({ state, onMove, disabled = false, highlightCell }: Props) {
  const { n, grid } = state;
  const cellSize = Math.max(48, Math.min(80, 320 / n));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${n}, ${cellSize}px)`,
        gap: 4,
        justifyContent: 'center',
      }}
    >
      {grid.map((cell, idx) => {
        const row = Math.floor(idx / n);
        const col = idx % n;
        const isHighlighted = highlightCell?.row === row && highlightCell?.col === col;
        const isOn = cell === 1;

        const bg = isOn ? ON_COLOR : OFF_COLOR;
        const border = isOn ? ON_BORDER : OFF_BORDER;
        const hoverBg = isOn ? ON_COLOR : '#d4cbc2';

        return (
          <motion.button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onMove({ row, col })}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 12,
              border: `2px solid ${border}`,
              outline: 'none',
              backgroundColor: bg,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              boxShadow: isOn ? '0 4px 12px rgba(255, 180, 30, 0.3)' : undefined,
              ...(isHighlighted ? { boxShadow: `0 0 0 3px ${HIGHLIGHT_RING}` } : {}),
            }}
            whileHover={!disabled ? { backgroundColor: hoverBg } : undefined}
            whileTap={!disabled ? { scale: 0.9 } : undefined}
            animate={{ backgroundColor: bg }}
            transition={{ duration: 0.15 }}
            aria-label={`Row ${row + 1}, Column ${col + 1}, ${isOn ? 'on' : 'off'}`}
            aria-pressed={isOn}
          />
        );
      })}
    </div>
  );
}
