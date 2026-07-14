import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import { HOLE_COORDS } from './geometry';
import { hasPeg, legalMoves } from './rules';
import type { PegSolitaireMove, PegSolitaireState } from './types';

type Props = BoardProps<PegSolitaireState, PegSolitaireMove>;

const BOARD_SIZE = 7;

function holeKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function PegSolitaireBoard({
  state,
  onMove,
  disabled = false,
  highlightCell,
}: Props) {
  const { t } = useTranslation();
  const [selectedHole, setSelectedHole] = useState<number | null>(null);

  const holeByCoord = useMemo(
    () => new Map(HOLE_COORDS.map((coord, hole) => [holeKey(coord.row, coord.col), hole])),
    [],
  );
  const legal = useMemo(() => legalMoves(state), [state]);
  const selectedMoves = useMemo(
    () => (selectedHole === null ? [] : legal.filter(move => move.from === selectedHole)),
    [legal, selectedHole],
  );
  const landingMoveByHole = useMemo(
    () => new Map(selectedMoves.map(move => [move.to, move])),
    [selectedMoves],
  );

  function handleHoleClick(hole: number): void {
    if (disabled) return;

    const landingMove = landingMoveByHole.get(hole);
    if (landingMove) {
      onMove(landingMove);
      setSelectedHole(null);
      return;
    }

    if (hasPeg(state.pegs, hole) && legal.some(move => move.from === hole)) {
      setSelectedHole(hole);
      return;
    }

    setSelectedHole(null);
  }

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div
        className="grid gap-1 rounded-card bg-warm-stone-100 p-3 shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(2.5rem, 3.25rem))`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(2.5rem, 3.25rem))`,
        }}
        role="grid"
        aria-label={t('pegSolitaire.boardAria')}
      >
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
          const row = Math.floor(index / BOARD_SIZE);
          const col = index % BOARD_SIZE;
          const hole = holeByCoord.get(holeKey(row, col));
          if (hole === undefined) {
            return <div key={index} aria-hidden="true" />;
          }

          const occupied = hasPeg(state.pegs, hole);
          const selected = selectedHole === hole;
          const landing = landingMoveByHole.has(hole);
          const highlighted = highlightCell?.row === row && highlightCell?.col === col;
          const selectable = occupied && legal.some(move => move.from === hole);

          return (
            <motion.button
              key={hole}
              type="button"
              role="gridcell"
              disabled={disabled}
              onClick={() => handleHoleClick(hole)}
              className={`
                relative rounded-full border-2 outline-none transition-colors
                ${occupied ? 'bg-game-amber-400 border-game-amber-700 shadow-md shadow-game-amber-400/30' : 'bg-warm-stone-200 border-warm-stone-300'}
                ${selectable && !disabled ? 'cursor-pointer hover:border-logic-indigo-500' : ''}
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
                ${selected ? 'ring-4 ring-logic-indigo-400' : ''}
                ${landing ? 'ring-4 ring-clarity-teal-light bg-clarity-teal-light border-clarity-teal-dark' : ''}
                ${highlighted ? 'ring-4 ring-game-amber-600' : ''}
              `}
              aria-label={t('pegSolitaire.holeAria', {
                row: row + 1,
                col: col + 1,
                state: occupied ? t('pegSolitaire.peg') : t('pegSolitaire.empty'),
              })}
              aria-pressed={occupied}
              whileHover={!disabled && (selectable || landing) ? { scale: 1.06 } : undefined}
              whileTap={!disabled ? { scale: 0.92 } : undefined}
            >
              {occupied && (
                <span className="absolute inset-2 rounded-full bg-game-amber-200/70 shadow-inner" />
              )}
              {landing && !occupied && (
                <span className="absolute inset-3 rounded-full border-2 border-dashed border-clarity-teal-dark" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-warm-stone-500">
        <span>{t('pegSolitaire.selectHint')}</span>
        <span>{t(`pegSolitaire.goal.${state.goal}`)}</span>
      </div>
    </div>
  );
}
