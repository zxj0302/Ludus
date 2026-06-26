// apps/web/src/components/SudokuBoard.tsx
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { SudokuState, SudokuMove } from '@ludus/games';

interface Props {
  state: SudokuState;
  onMove: (move: SudokuMove) => void;
  disabled?: boolean;
  highlightCell?: { row: number; col: number } | null;
}

export function SudokuBoard({ state, onMove, disabled, highlightCell }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const { n, grid, givenMask } = state;

  const getBox = (r: number, c: number) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

  // Find conflicts with the currently selected cell
  const selectedValue = selected ? grid[selected.row * n + selected.col] : 0;

  const isConflict = useCallback((r: number, c: number): boolean => {
    const v = grid[r * n + c];
    if (v === 0) return false;
    // Check row/col/box for duplicates
    for (let k = 0; k < n; k++) {
      if (k !== c && grid[r * n + k] === v) return true;
      if (k !== r && grid[k * n + c] === v) return true;
    }
    const b = getBox(r, c);
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const cr = br + dr;
        const cc = bc + dc;
        if (cr === r && cc === c) continue;
        if (grid[cr * n + cc] === v) return true;
      }
    }
    return false;
  }, [grid, n]);

  const isSameNumber = (r: number, c: number): boolean => {
    if (selectedValue === 0) return false;
    return grid[r * n + c] === selectedValue;
  };

  const handleCellClick = (r: number, c: number) => {
    if (disabled) return;
    setSelected({ row: r, col: c });
  };

  const handleNumberInput = (value: number) => {
    if (!selected || disabled) return;
    if (givenMask[selected.row * n + selected.col]) return;
    onMove({ row: selected.row, col: selected.col, value });
  };

  // Keyboard: number keys
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selected || disabled) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      handleNumberInput(num);
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      handleNumberInput(0);
    } else if (e.key === 'ArrowUp' && selected.row > 0) {
      e.preventDefault();
      setSelected({ row: selected.row - 1, col: selected.col });
    } else if (e.key === 'ArrowDown' && selected.row < 8) {
      e.preventDefault();
      setSelected({ row: selected.row + 1, col: selected.col });
    } else if (e.key === 'ArrowLeft' && selected.col > 0) {
      e.preventDefault();
      setSelected({ row: selected.row, col: selected.col - 1 });
    } else if (e.key === 'ArrowRight' && selected.col < 8) {
      e.preventDefault();
      setSelected({ row: selected.row, col: selected.col + 1 });
    }
  }, [selected, disabled]);

  return (
    <div className="flex flex-col items-center gap-4 focus:outline-none" tabIndex={0} onKeyDown={handleKeyDown}>
      {/* 9x9 Grid */}
      <div className="grid grid-cols-9 border-2 border-warm-stone-800 rounded-lg overflow-hidden">
        {Array.from({ length: n * n }, (_, i) => {
          const r = Math.floor(i / n);
          const c = i % n;
          const v = grid[i]!;
          const isGiven = givenMask[i]!;
          const isSelected = selected?.row === r && selected?.col === c;
          const isHL = highlightCell?.row === r && highlightCell?.col === c;
          const conflicting = isConflict(r, c);
          const sameNum = isSameNumber(r, c);

          // Border classes for 3x3 box separators
          const borderRight = (c % 3 === 2 && c !== 8) ? 'border-r-2 border-r-warm-stone-800' : 'border-r border-r-warm-stone-300';
          const borderBottom = (r % 3 === 2 && r !== 8) ? 'border-b-2 border-b-warm-stone-800' : 'border-b border-b-warm-stone-300';

          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => handleCellClick(r, c)}
              whileTap={!disabled ? { scale: 0.92 } : undefined}
              className={`
                w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center
                text-lg font-semibold relative
                ${borderRight} ${borderBottom}
                ${isGiven ? 'text-warm-stone-800' : 'text-logic-indigo-700'}
                ${isSelected ? 'bg-logic-indigo-100 ring-2 ring-inset ring-logic-indigo-500 z-10' : ''}
                ${isHL ? 'bg-game-amber-100 ring-2 ring-inset ring-game-amber-500 z-10' : ''}
                ${conflicting ? 'bg-red-100 text-red-700' : ''}
                ${sameNum && !isSelected ? 'bg-logic-indigo-50' : ''}
                ${!isGiven && !isSelected && !isHL && !conflicting && !sameNum ? 'bg-white hover:bg-warm-stone-50' : ''}
                ${isGiven ? 'bg-warm-stone-100' : ''}
                transition-colors
              `}
              aria-label={`Row ${r + 1}, Column ${c + 1}${v !== 0 ? `, ${v}` : ', empty'}${isGiven ? ', given' : ''}`}
            >
              {v !== 0 ? v : ''}
            </motion.button>
          );
        })}
      </div>

      {/* Number pad */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <motion.button
            key={num}
            type="button"
            onClick={() => handleNumberInput(num)}
            disabled={disabled || !selected}
            whileTap={{ scale: 0.88 }}
            className={`
              w-10 h-12 rounded-btn text-lg font-bold
              ${!selected ? 'bg-warm-stone-100 text-warm-stone-400 cursor-not-allowed' :
                'bg-logic-indigo-600 text-white hover:bg-logic-indigo-700 active:bg-logic-indigo-800'}
              transition-colors disabled:opacity-50
            `}
          >
            {num}
          </motion.button>
        ))}
        <motion.button
          type="button"
          onClick={() => handleNumberInput(0)}
          disabled={disabled || !selected}
          whileTap={{ scale: 0.88 }}
          className={`
            w-10 h-12 rounded-btn text-xs font-bold
            ${!selected ? 'bg-warm-stone-100 text-warm-stone-400 cursor-not-allowed' :
              'bg-warm-stone-400 text-white hover:bg-warm-stone-500'}
            transition-colors disabled:opacity-50
          `}
        >
          x
        </motion.button>
      </div>
    </div>
  );
}
