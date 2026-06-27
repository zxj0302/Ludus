import React from 'react';
import { motion } from 'framer-motion';
import type { SokobanState, SokobanMove } from './types';
import { legalMoves } from './rules';

interface Props {
  state: SokobanState;
  onMove: (move: SokobanMove) => void;
  disabled?: boolean;
  highlightCell?: { row: number; col: number } | null;
}

// ═══════════════════════════════════════════════════════════════
// 颜色常量
// ═══════════════════════════════════════════════════════════════
const WALL_BG = '#6b5e53';
const WALL_SHADOW = '#4a3f38';
const FLOOR_BG = '#f5f0e8';
const FLOOR_ALT = '#ede4d6';
const BOX_BG = '#d4914a';
const BOX_SHADOW = '#8b5e2f';
const BOX_ON_GOAL_BG = '#5fb868';
const BOX_ON_GOAL_SHADOW = '#3a7a42';
const PLAYER_COLOR = '#4a90d9';
const PLAYER_INNER = '#ffffff';
const GOAL_COLOR = '#c4a882';
const HIGHLIGHT_RING = '#5feacb';

export function SokobanBoard({ state, onMove, disabled = false, highlightCell }: Props) {
  const { width, height, player, walls, goals, boxes } = state;
  const cellSize = Math.max(36, Math.min(64, Math.min(480 / width, 480 / height)));

  // Build a cell map for quick lookup
  const goalSet = new Set(goals.map(g => `${g.row},${g.col}`));
  const boxSet = new Set(boxes.map(b => `${b.row},${b.col}`));
  const wallSet = new Set<string>();
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (walls[r]![c]) wallSet.add(`${r},${c}`);
    }
  }

  // 仅执行合法移动
  const legalDirs = React.useMemo(() => {
    const set = new Set(legalMoves(state).map(m => m.direction));
    return set;
  }, [state]);

  const tryMove = React.useCallback((dir: SokobanMove['direction']) => {
    if (disabled) return;
    if (legalDirs.has(dir)) onMove({ direction: dir } as SokobanMove);
  }, [disabled, legalDirs, onMove]);

  const boardRef = React.useRef<HTMLDivElement>(null);

  // 全局键盘监听：按下方向键 / WASD 时自动聚焦游戏区
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
      if (!keys.includes(e.key)) return;
      // 如果焦点在输入框或已聚焦棋盘，不抢焦点
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.activeElement === boardRef.current) return;
      boardRef.current?.focus();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Keyboard controls
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    const keyMap: Record<string, SokobanMove['direction']> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    };
    const dir = keyMap[e.key];
    if (dir) { e.preventDefault(); tryMove(dir); }
  }, [tryMove]);

  // Swipe support
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

  return (
    <div
      ref={boardRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logic-indigo-500"
      style={{ touchAction: 'manipulation' }}
    >
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
          gap: 1,
          justifyContent: 'center',
          background: WALL_SHADOW,
          border: `3px solid ${WALL_SHADOW}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: height }).map((_, r) =>
          Array.from({ length: width }).map((_, c) => {
            const isWall = wallSet.has(`${r},${c}`);
            const isGoal = goalSet.has(`${r},${c}`);
            const isBox = boxSet.has(`${r},${c}`);
            const isPlayer = player.row === r && player.col === c;
            const h = isHighlighted(r, c);
            const isAlt = (r + c) % 2 === 0;

            // Cell background
            let cellBg = isWall ? WALL_BG : isAlt ? FLOOR_BG : FLOOR_ALT;
            let cellInner: React.ReactNode = null;

            if (isWall) {
              cellInner = (
                <div
                  style={{
                    width: '100%', height: '100%',
                    background: `linear-gradient(135deg, ${WALL_BG} 0%, ${WALL_SHADOW} 100%)`,
                    borderRadius: 2,
                  }}
                />
              );
            }

            if (isGoal && !isWall) {
              cellInner = (
                <div
                  style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <div style={{
                    width: cellSize * 0.5,
                    height: cellSize * 0.5,
                    borderRadius: '50%',
                    border: `2px dashed ${GOAL_COLOR}`,
                    opacity: 0.7,
                  }} />
                </div>
              );
            }

            return (
              <div
                key={`${r}-${c}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  position: 'relative',
                  backgroundColor: cellBg,
                  boxShadow: h ? `inset 0 0 0 3px ${HIGHLIGHT_RING}` : undefined,
                  zIndex: h ? 2 : 1,
                }}
              >
                {cellInner}
              </div>
            );
          })
        )}

        {/* Boxes — positioned absolutely over the grid for animated movement */}
        {boxes.map((b, i) => {
          const isOnGoal = goalSet.has(`${b.row},${b.col}`);
          const bg = isOnGoal ? BOX_ON_GOAL_BG : BOX_BG;
          const shadow = isOnGoal ? BOX_ON_GOAL_SHADOW : BOX_SHADOW;
          return (
            <motion.div
              key={`box-${i}`}
              style={{
                position: 'absolute',
                left: b.col * (cellSize + 1) + 1,
                top: b.row * (cellSize + 1) + 1,
                width: cellSize - 2,
                height: cellSize - 2,
                borderRadius: Math.max(4, cellSize * 0.15),
                background: `linear-gradient(135deg, ${bg} 0%, ${shadow} 100%)`,
                boxShadow: `0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 3, left: 4, right: 4, bottom: 3,
                border: `1.5px solid ${isOnGoal ? '#4a9f56' : '#c47f3a'}`,
                borderRadius: Math.max(2, cellSize * 0.1),
              }} />
            </motion.div>
          );
        })}

        {/* Player — positioned absolutely for animated movement */}
        <motion.div
          style={{
            position: 'absolute',
            left: player.col * (cellSize + 1) + 1,
            top: player.row * (cellSize + 1) + 1,
            width: cellSize - 2,
            height: cellSize - 2,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${PLAYER_COLOR} 0%, #2d6db5 100%)`,
            boxShadow: '0 2px 8px rgba(74, 144, 217, 0.4)',
            zIndex: 5,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Simple face */}
          <div style={{
            width: cellSize * 0.36,
            height: cellSize * 0.36,
            borderRadius: '50%',
            background: PLAYER_INNER,
            opacity: 0.8,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '25%', left: '20%',
              width: 3, height: 3,
              borderRadius: '50%',
              background: '#2d6db5',
            }} />
            <div style={{
              position: 'absolute',
              top: '25%', right: '20%',
              width: 3, height: 3,
              borderRadius: '50%',
              background: '#2d6db5',
            }} />
          </div>
        </motion.div>
      </div>

      {/* Mobile directional pad */}
      <div
        className="lg:hidden grid grid-cols-3 gap-1 mt-4 mx-auto"
        style={{ width: Math.min(200, cellSize * 4) }}
      >
        <div />
        <DirButton dir="up" onClick={tryMove} disabled={disabled} />
        <div />
        <DirButton dir="left" onClick={tryMove} disabled={disabled} />
        <div />
        <DirButton dir="right" onClick={tryMove} disabled={disabled} />
        <div />
        <DirButton dir="down" onClick={tryMove} disabled={disabled} />
        <div />
      </div>
    </div>
  );
}

/** 移动端方向按钮 */
function DirButton({
  dir, onClick, disabled,
}: {
  dir: SokobanMove['direction'];
  onClick: (dir: SokobanMove['direction']) => void;
  disabled: boolean;
}) {
  const arrows: Record<string, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.85 } : undefined}
      onClick={() => onClick(dir)}
      className="w-full aspect-square rounded-xl bg-warm-stone-100 text-warm-stone-600 text-lg flex items-center justify-center active:bg-warm-stone-200 disabled:opacity-40"
      aria-label={dir}
    >
      {arrows[dir]}
    </motion.button>
  );
}
