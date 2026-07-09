import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { SokobanState, SokobanMove } from './types';
import { legalMoves } from './rules';

export function SokobanBoard({ state, onMove, disabled = false, highlightCell }: BoardProps<SokobanState, SokobanMove>) {
  const { t } = useTranslation();
  const { width, height, player, walls, goals, boxes } = state;
  const cellSize = Math.max(36, Math.min(64, Math.min(480 / width, 480 / height)));

  const goalSet = React.useMemo(
    () => new Set(goals.map(g => `${g.row},${g.col}`)),
    [goals],
  );
  const wallSet = React.useMemo(() => {
    const set = new Set<string>();
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (walls[r]![c]) set.add(`${r},${c}`);
      }
    }
    return set;
  }, [walls, height, width]);

  const legalDirs = React.useMemo(() => {
    return new Set(legalMoves(state).map(m => m.direction));
  }, [state]);

  const tryMove = React.useCallback((dir: SokobanMove['direction']) => {
    if (disabled) return;
    if (legalDirs.has(dir)) onMove({ direction: dir });
  }, [disabled, legalDirs, onMove]);

  const boardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
      if (!keys.includes(e.key)) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.activeElement === boardRef.current) return;
      boardRef.current?.focus();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    const keyMap: Record<string, SokobanMove['direction']> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    };
    const dir = keyMap[e.key];
    if (dir) { e.preventDefault(); tryMove(dir); }
  }, [tryMove]);

  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
  }, []);
  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0]!.clientX - touchStart.current.x;
    const dy = e.changedTouches[0]!.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    const dir: SokobanMove['direction'] =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    tryMove(dir);
  }, [tryMove]);

  const isHighlighted = (r: number, c: number) =>
    highlightCell?.row === r && highlightCell?.col === c;

  const boxRadius = Math.max(4, cellSize * 0.15);
  const innerRadius = Math.max(2, cellSize * 0.1);
  const faceSize = cellSize * 0.36;

  return (
    <div
      ref={boardRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="select-none touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logic-indigo-500"
    >
      <div
        className="relative grid gap-px justify-center rounded-lg overflow-hidden border-[3px] border-warm-stone-800 bg-warm-stone-800"
        style={{
          gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: height }).map((_, r) =>
          Array.from({ length: width }).map((_, c) => {
            const isWall = wallSet.has(`${r},${c}`);
            const isGoal = goalSet.has(`${r},${c}`);
            const isAlt = (r + c) % 2 === 0;
            const h = isHighlighted(r, c);

            return (
              <div
                key={`${r}-${c}`}
                className={`
                  relative
                  ${isWall
                    ? 'bg-gradient-to-br from-warm-stone-600 to-warm-stone-800'
                    : isAlt ? 'bg-warm-stone-100' : 'bg-warm-stone-200'}
                  ${h ? 'ring-[3px] ring-inset ring-clarity-teal-light z-[2]' : 'z-[1]'}
                `}
                style={{ width: cellSize, height: cellSize }}
              >
                {isGoal && !isWall && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      className="rounded-full border-2 border-dashed border-warm-stone-400 opacity-70"
                      style={{ width: cellSize * 0.5, height: cellSize * 0.5 }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}

        {boxes.map((b, i) => {
          const isOnGoal = goalSet.has(`${b.row},${b.col}`);
          return (
            <motion.div
              key={`box-${i}`}
              className={`
                absolute pointer-events-none
                ${isOnGoal
                  ? 'bg-gradient-to-br from-clarity-teal-400 to-clarity-teal-600 shadow-lg shadow-clarity-teal-500/40 ring-2 ring-clarity-teal-700'
                  : 'bg-gradient-to-br from-game-amber-400 to-game-amber-700 shadow-md'}
              `}
              style={{
                left: b.col * (cellSize + 1) + 1,
                top: b.row * (cellSize + 1) + 1,
                width: cellSize - 2,
                height: cellSize - 2,
                borderRadius: boxRadius,
                zIndex: 3,
              }}
            >
              <div
                className={`absolute border-[1.5px] ${isOnGoal ? 'border-clarity-teal-800/60' : 'border-game-amber-600'}`}
                style={{
                  top: 3, left: 4, right: 4, bottom: 3,
                  borderRadius: innerRadius,
                }}
              />
              {isOnGoal && (
                <div
                  className="absolute inset-0 flex items-center justify-center text-white font-bold drop-shadow-sm"
                  style={{ fontSize: Math.max(10, cellSize * 0.28) }}
                  aria-hidden
                >
                  ✓
                </div>
              )}
            </motion.div>
          );
        })}

        <motion.div
          className="absolute pointer-events-none rounded-full bg-gradient-to-br from-logic-indigo-500 to-logic-indigo-800 shadow-md shadow-logic-indigo-500/40 flex items-center justify-center"
          style={{
            left: player.col * (cellSize + 1) + 1,
            top: player.row * (cellSize + 1) + 1,
            width: cellSize - 2,
            height: cellSize - 2,
            zIndex: 5,
          }}
        >
          <div
            className="relative rounded-full bg-white/80"
            style={{ width: faceSize, height: faceSize }}
          >
            <div className="absolute rounded-full bg-logic-indigo-700" style={{ top: '25%', left: '20%', width: 3, height: 3 }} />
            <div className="absolute rounded-full bg-logic-indigo-700" style={{ top: '25%', right: '20%', width: 3, height: 3 }} />
          </div>
        </motion.div>
      </div>

      <div
        className="lg:hidden grid grid-cols-3 gap-1 mt-4 mx-auto"
        style={{ width: Math.min(200, cellSize * 4) }}
      >
        <div />
        <DirButton dir="up" onClick={tryMove} disabled={disabled} label={t('education.move.up')} />
        <div />
        <DirButton dir="left" onClick={tryMove} disabled={disabled} label={t('education.move.left')} />
        <div />
        <DirButton dir="right" onClick={tryMove} disabled={disabled} label={t('education.move.right')} />
        <div />
        <DirButton dir="down" onClick={tryMove} disabled={disabled} label={t('education.move.down')} />
        <div />
      </div>
    </div>
  );
}

function DirButton({
  dir, onClick, disabled, label,
}: {
  dir: SokobanMove['direction'];
  onClick: (dir: SokobanMove['direction']) => void;
  disabled: boolean;
  label: string;
}) {
  const arrows: Record<string, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.85 } : undefined}
      onClick={() => onClick(dir)}
      className="w-full aspect-square rounded-xl bg-warm-stone-100 text-warm-stone-600 text-lg flex items-center justify-center active:bg-warm-stone-200 disabled:opacity-40"
      aria-label={label}
    >
      {arrows[dir]}
    </motion.button>
  );
}
