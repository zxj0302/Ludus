import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import { HOLE_COORDS, holeNotation } from './geometry';
import { hasPeg, legalMoves, popcount } from './rules';
import { PEG_CATALOG } from './puzzles';
import type { PegSolitaireMove, PegSolitaireState } from './types';

type Props = BoardProps<PegSolitaireState, PegSolitaireMove>;

const BOARD_SIZE = 7;
const COL_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;
const CELL_MIN = 'minmax(2.5rem, 3.25rem)';
const LABEL_TRACK = '1.35rem';

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
  const boardLocked = disabled || state.status !== 'playing';
  const holeByCoord = useMemo(
    () => new Map(HOLE_COORDS.map((coord, hole) => [holeKey(coord.row, coord.col), hole])),
    [],
  );

  useEffect(() => {
    setSelectedHole(null);
  }, [state.pegs, state.goal, state.status]);

  // Hint / solve playback: pre-select the peg that should jump so destination is obvious.
  useEffect(() => {
    if (!highlightCell?.from) return;
    const hole = holeByCoord.get(holeKey(highlightCell.from.row, highlightCell.from.col));
    if (hole === undefined) return;
    if (!hasPeg(state.pegs, hole)) return;
    setSelectedHole(hole);
  }, [highlightCell?.from, state.pegs, holeByCoord]);

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
    if (boardLocked) return;

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

  const statusMessage =
    state.status === 'won'
      ? t('pegSolitaire.status.won')
      : state.status === 'stuck'
        ? t('pegSolitaire.status.stuck')
        : t('pegSolitaire.selectHint');

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div
        className="grid gap-1 rounded-card bg-warm-stone-100 p-3 shadow-inner"
        style={{
          gridTemplateColumns: `${LABEL_TRACK} repeat(${BOARD_SIZE}, ${CELL_MIN})`,
          gridTemplateRows: `${LABEL_TRACK} repeat(${BOARD_SIZE}, ${CELL_MIN})`,
        }}
        role="grid"
        aria-label={t('pegSolitaire.boardAria')}
      >
        {/* Corner + file labels a–g */}
        <div aria-hidden="true" />
        {COL_LABELS.map(label => (
          <div
            key={`file-${label}`}
            aria-hidden="true"
            className="flex items-center justify-center text-[11px] font-mono font-semibold uppercase text-warm-stone-500"
          >
            {label}
          </div>
        ))}

        {Array.from({ length: BOARD_SIZE }, (_, row) => (
          <BoardRow
            key={`rank-${row}`}
            row={row}
            boardLocked={boardLocked}
            holeByCoord={holeByCoord}
            state={state}
            selectedHole={selectedHole}
            landingMoveByHole={landingMoveByHole}
            legal={legal}
            highlightCell={highlightCell}
            onHoleClick={handleHoleClick}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-warm-stone-500">
        <span
          className={
            state.status === 'won'
              ? 'font-semibold text-clarity-teal-dark'
              : state.status === 'stuck'
                ? 'font-semibold text-game-amber-700'
                : undefined
          }
        >
          {statusMessage}
        </span>
        {state.catalogId && (
          <span className="font-medium text-warm-stone-600">
            {t(PEG_CATALOG.find(e => e.id === state.catalogId)?.titleKey ?? 'pegSolitaire.levelLabel')}
          </span>
        )}
        <span>{t(`pegSolitaire.goal.${state.goal}`)}</span>
        <span>{t('pegSolitaire.pegCountShort', { count: popcount(state.pegs) })}</span>
        <span className="font-mono text-warm-stone-400">{t('pegSolitaire.boardNotationHint')}</span>
      </div>
    </div>
  );
}

function BoardRow({
  row,
  boardLocked,
  holeByCoord,
  state,
  selectedHole,
  landingMoveByHole,
  legal,
  highlightCell,
  onHoleClick,
}: {
  row: number;
  boardLocked: boolean;
  holeByCoord: Map<string, number>;
  state: PegSolitaireState;
  selectedHole: number | null;
  landingMoveByHole: Map<number, PegSolitaireMove>;
  legal: PegSolitaireMove[];
  highlightCell: Props['highlightCell'];
  onHoleClick: (hole: number) => void;
}): ReactNode {
  const { t } = useTranslation();
  const rankLabel = String(row + 1);

  return (
    <>
      <div
        aria-hidden="true"
        className="flex items-center justify-center text-[11px] font-mono font-semibold text-warm-stone-500"
      >
        {rankLabel}
      </div>
      {Array.from({ length: BOARD_SIZE }, (_, col) => {
        const hole = holeByCoord.get(holeKey(row, col));
        if (hole === undefined) {
          return <div key={`${row}-${col}`} aria-hidden="true" />;
        }

        const occupied = hasPeg(state.pegs, hole);
        const selected = selectedHole === hole;
        const landing = landingMoveByHole.has(hole);
        const hintTo = highlightCell?.row === row && highlightCell?.col === col;
        const hintFrom = highlightCell?.from?.row === row && highlightCell?.from?.col === col;
        const hintOver = highlightCell?.over?.row === row && highlightCell?.over?.col === col;
        const selectable = occupied && legal.some(move => move.from === hole);
        const notation = holeNotation(hole);

        return (
          <motion.button
            key={hole}
            type="button"
            role="gridcell"
            disabled={boardLocked}
            onClick={() => onHoleClick(hole)}
            className={`
              relative rounded-full border-2 outline-none transition-colors
              ${occupied ? 'bg-game-amber-400 border-game-amber-700 shadow-md shadow-game-amber-400/30' : 'bg-warm-stone-200 border-warm-stone-300'}
              ${selectable && !boardLocked ? 'cursor-pointer hover:border-logic-indigo-500' : ''}
              ${boardLocked ? 'cursor-not-allowed opacity-60' : ''}
              ${selected ? 'ring-4 ring-logic-indigo-400' : ''}
              ${landing ? 'ring-4 ring-clarity-teal-light bg-clarity-teal-light border-clarity-teal-dark' : ''}
              ${hintFrom ? 'ring-4 ring-logic-indigo-500' : ''}
              ${hintOver ? 'ring-4 ring-game-amber-500 opacity-90' : ''}
              ${hintTo ? 'ring-4 ring-clarity-teal-dark bg-clarity-teal-light/40 border-clarity-teal-dark' : ''}
            `}
            aria-label={t('pegSolitaire.holeAria', {
              square: notation,
              state: occupied ? t('pegSolitaire.peg') : t('pegSolitaire.empty'),
            })}
            title={notation}
            aria-pressed={occupied}
            whileHover={!boardLocked && (selectable || landing) ? { scale: 1.06 } : undefined}
            whileTap={!boardLocked ? { scale: 0.92 } : undefined}
          >
            {occupied && (
              <span className="absolute inset-2 rounded-full bg-game-amber-200/70 shadow-inner" />
            )}
            {landing && !occupied && (
              <span className="absolute inset-3 rounded-full border-2 border-dashed border-clarity-teal-dark" />
            )}
            {hintTo && !occupied && (
              <span className="absolute inset-3 rounded-full border-2 border-dashed border-clarity-teal-dark" />
            )}
            {hintFrom && occupied && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-logic-indigo-500" />
            )}
          </motion.button>
        );
      })}
    </>
  );
}
