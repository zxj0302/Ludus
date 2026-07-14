import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { ConnectFourMove, ConnectFourState } from './types';
import { COLS, ROWS } from './types';
import { getDropRow, isColumnFull } from './board';

interface ConnectFourBoardProps extends BoardProps<ConnectFourState, ConnectFourMove> {
  onChooseHand?: (playerFirst: boolean) => void;
}

const DISC_SIZE = 'w-11 h-11 sm:w-12 sm:h-12';

function discClasses(cell: number, ghost = false): string {
  if (cell === 1) {
    return ghost
      ? 'bg-logic-indigo-400/50 border-2 border-dashed border-logic-indigo-400'
      : 'bg-logic-indigo-500 shadow-md shadow-logic-indigo-500/30 border border-logic-indigo-600/40';
  }
  if (cell === 2) {
    return ghost
      ? 'bg-game-amber-400/50 border-2 border-dashed border-game-amber-400'
      : 'bg-game-amber-500 shadow-md shadow-game-amber-500/30 border border-game-amber-600/40';
  }
  return 'bg-warm-stone-200/80 shadow-[inset_0_2px_4px_rgba(120,113,108,0.18)] border border-warm-stone-300/50';
}

function Disc({ cell, ghost = false }: { cell: number; ghost?: boolean }) {
  return (
    <div
      className={`${DISC_SIZE} rounded-full flex-shrink-0 transition-colors ${discClasses(cell, ghost)}`}
      aria-hidden
    />
  );
}

export function ConnectFourBoard({
  state,
  onMove,
  disabled = false,
  highlightCell,
  onChooseHand,
}: ConnectFourBoardProps) {
  const { t } = useTranslation();
  const { board, currentPlayer, phase, winner } = state;
  const [hoverColumn, setHoverColumn] = useState<number | null>(null);

  const isPlayerTurn = currentPlayer === 0 && phase === 'playing' && winner === null;
  const isChoosing = phase === 'choosing' && winner === null;
  const isGameOver = winner !== null;
  const hintCol = highlightCell?.col ?? null;
  const canDrop = isPlayerTurn && !disabled && !isGameOver;

  const handleColumn = useCallback((column: number) => {
    if (!canDrop || isColumnFull(board, column)) return;
    onMove({ column });
    setHoverColumn(null);
  }, [board, canDrop, onMove]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!canDrop) return;
      const digit = Number.parseInt(e.key, 10);
      if (digit >= 1 && digit <= COLS) {
        e.preventDefault();
        handleColumn(digit - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canDrop, handleColumn]);

  const playerWon = winner === 0;
  const aiWon = winner === 1;
  const isDraw = winner === 'draw';

  const renderBoard = (interactive: boolean) => (
    <div
      className="rounded-2xl bg-warm-stone-100 p-4 sm:p-5 shadow-inner border border-warm-stone-200/80"
      role="grid"
      aria-label={t('connectFour.boardAria')}
    >
      <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
        {Array.from({ length: COLS }, (_, col) => {
          const full = isColumnFull(board, col);
          const hinted = hintCol === col;
          const hovered = hoverColumn === col;
          const dropRow = getDropRow(board, col);
          const columnEnabled = interactive && canDrop && !full;

          return (
            <motion.button
              key={`col-${col}`}
              type="button"
              disabled={!columnEnabled}
              onClick={() => handleColumn(col)}
              onMouseEnter={() => interactive && setHoverColumn(col)}
              onMouseLeave={() => interactive && setHoverColumn(null)}
              whileHover={columnEnabled ? { y: -2 } : undefined}
              whileTap={columnEnabled ? { scale: 0.98 } : undefined}
              className={`
                flex flex-col items-center gap-2 rounded-xl p-1 transition-colors
                ${columnEnabled ? 'cursor-pointer hover:bg-warm-stone-50/80' : 'cursor-default'}
                ${full && interactive ? 'opacity-60' : ''}
                ${hinted ? 'ring-2 ring-game-amber-400 ring-offset-2 ring-offset-warm-stone-100' : ''}
                ${hovered && columnEnabled ? 'bg-warm-stone-50/90' : ''}
              `}
              aria-label={t('connectFour.column', { n: col + 1 })}
            >
              {Array.from({ length: ROWS }, (_, rowIndex) => {
                const row = rowIndex;
                const cell = board[row]![col]!;
                const showGhost = columnEnabled && hovered && dropRow === row;
                return (
                  <motion.div
                    key={`${row}-${col}-${cell}`}
                    layout
                    initial={cell !== 0 ? { y: -24, opacity: 0.35 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  >
                    {showGhost ? (
                      <Disc cell={1} ghost />
                    ) : (
                      <Disc cell={cell} />
                    )}
                  </motion.div>
                );
              })}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const statusBanner = (
    <AnimatePresence mode="wait">
      {playerWon ? (
        <motion.div key="win" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-bold text-game-amber-600">{t('connectFour.youWin')}</motion.div>
      ) : aiWon ? (
        <motion.div key="lose" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-bold text-warm-stone-400">{t('connectFour.aiWins')}</motion.div>
      ) : isDraw ? (
        <motion.div key="draw" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-bold text-warm-stone-500">{t('connectFour.draw')}</motion.div>
      ) : (
        <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`text-lg font-semibold flex items-center gap-2 ${isPlayerTurn ? 'text-logic-indigo-700' : 'text-warm-stone-500'}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${isPlayerTurn ? 'bg-logic-indigo-500 animate-pulse' : 'bg-warm-stone-400'}`} />
          {isPlayerTurn ? t('connectFour.yourTurn') : t('connectFour.aiThinking')}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const legend = (
    <div className="flex items-center gap-4 text-xs text-warm-stone-500">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-logic-indigo-500" />
        {t('connectFour.discPlayer')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-game-amber-500" />
        {t('connectFour.discAi')}
      </span>
    </div>
  );

  if (isChoosing) {
    const recommendPlayer = highlightCell?.row === 0 && highlightCell.col === 0;
    const recommendAI = highlightCell?.row === 0 && highlightCell.col === 1;
    const btnPlayerCls = recommendPlayer
      ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]' : '';
    const btnAICls = recommendAI
      ? 'ring-[3px] ring-game-amber-400 scale-105 shadow-[0_0_0_4px_rgba(232,168,56,0.5)]' : '';

    return (
      <div className="flex flex-col items-center gap-6 select-none">
        <div className="text-xl font-bold text-warm-stone-700">{t('connectFour.chooseHand')}</div>
        {renderBoard(false)}
        {legend}
        <div className="flex gap-4">
          <motion.button type="button" onClick={() => onChooseHand?.(true)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-logic-indigo-600 text-white font-bold text-lg hover:bg-logic-indigo-700 transition-all shadow-lg ${btnPlayerCls}`}>
            {t('connectFour.playFirst')}
          </motion.button>
          <motion.button type="button" onClick={() => onChooseHand?.(false)} whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl bg-warm-stone-200 text-warm-stone-700 font-bold text-lg hover:bg-warm-stone-300 transition-all shadow-md ${btnAICls}`}>
            {t('connectFour.aiFirst')}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {statusBanner}

      {!isGameOver && (
        <p className="text-xs text-warm-stone-400">{t('connectFour.dropHint')}</p>
      )}

      {renderBoard(true)}
      {legend}
    </div>
  );
}
