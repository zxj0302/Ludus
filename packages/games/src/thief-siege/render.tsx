import { useTranslation } from 'react-i18next';
import { cellIndex, legalMoves } from './rules';
import type { ThiefSiegeMove, ThiefSiegeState } from './types';

interface Props {
  state: ThiefSiegeState;
  onMove: (move: ThiefSiegeMove) => void;
  disabled?: boolean;
  highlightCell?: { row: number; col: number; value?: number } | null;
}

function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

function cellKindKey(kind: string): string {
  if (kind === 'exit') return 'thiefSiege.cell.exit';
  if (kind === 'floor') return 'thiefSiege.cell.floor';
  return 'thiefSiege.cell.obstacle';
}

export function ThiefSiegeBoard({ state, onMove, disabled, highlightCell }: Props) {
  const { t } = useTranslation();
  const legalPlacements = new Set(
    legalMoves(state)
      .filter((move): move is Extract<ThiefSiegeMove, { type: 'place' }> => move.type === 'place')
      .map(move => posKey(move.row, move.col)),
  );
  const copPositions = new Set(state.cops.map(cop => posKey(cop.row, cop.col)));
  const thiefKey = posKey(state.thief.row, state.thief.col);
  const canPlace = !disabled && state.status === 'playing' && state.phase === 'cop';

  const handleCellClick = (row: number, col: number) => {
    if (!canPlace) return;
    if (!legalPlacements.has(posKey(row, col))) return;
    onMove({ type: 'place', row, col });
  };

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="text-sm text-warm-stone-600 text-center">
        <div className="font-semibold text-warm-stone-800">
          {state.status === 'cop-win'
            ? t('thiefSiege.status.copWin')
            : state.status === 'thief-win'
              ? t('thiefSiege.status.thiefWin')
              : state.phase === 'cop'
                ? t('thiefSiege.phase.cop')
                : t('thiefSiege.phase.thief')}
        </div>
        <div>{t('thiefSiege.placeHint')}</div>
      </div>

      <div
        className="grid gap-1.5 p-3 rounded-2xl bg-warm-stone-100 shadow-inner"
        style={{ gridTemplateColumns: `repeat(${state.width}, minmax(0, 1fr))` }}
      >
        {state.cells.map((kind, idx) => {
          const row = Math.floor(idx / state.width);
          const col = idx % state.width;
          const key = posKey(row, col);
          const hasCop = copPositions.has(key);
          const hasThief = key === thiefKey;
          const isHighlighted = highlightCell?.row === row && highlightCell?.col === col;
          const isLegal = canPlace && legalPlacements.has(key);
          const label = t('thiefSiege.cellLabel', {
            row: row + 1,
            col: col + 1,
            kind: t(cellKindKey(kind)),
          });

          if (kind === 'obstacle') {
            return (
              <div
                key={idx}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warm-stone-800 shadow-inner"
                aria-label={label}
              />
            );
          }

          const baseClass = kind === 'exit'
            ? 'bg-game-amber-100 border-game-amber-400 text-game-amber-800'
            : 'bg-warm-stone-50 border-warm-stone-300 text-warm-stone-700';

          return (
            <button
              key={idx}
              type="button"
              disabled={!isLegal}
              onClick={() => handleCellClick(row, col)}
              className={`
                w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2
                flex items-center justify-center text-lg font-bold
                transition duration-150
                ${baseClass}
                ${isLegal ? 'cursor-pointer hover:scale-105 hover:shadow-md hover:border-logic-indigo-400' : 'cursor-default'}
                ${isHighlighted ? 'ring-2 ring-game-amber-500 ring-offset-2' : ''}
                ${hasCop ? 'bg-logic-indigo-100 border-logic-indigo-400' : ''}
                ${hasThief ? 'bg-red-100 border-red-400 text-red-700' : ''}
              `}
              aria-label={label}
            >
              {hasThief ? '🕵️' : hasCop ? '🚨' : kind === 'exit' ? '↗' : ''}
            </button>
          );
        })}
      </div>

      <div className="text-xs text-warm-stone-500">
        {t('thiefSiege.cops')}: {t('thiefSiege.copsPlaced', { count: state.cops.length, max: state.maxCops })}
      </div>
    </div>
  );
}
