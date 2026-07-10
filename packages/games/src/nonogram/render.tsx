import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { NonogramState, NonogramMove } from './types';
import { EMPTY, FILLED, CROSS } from './types';
import { isSolved } from './rules';

const COLORS = {
  bg: '#fafaf9',
  gridLine: '#d6d3d1',
  thickLine: '#a8a29e',
  filled: '#292524',
  cross: '#a8a29e',
  hoverRow: 'rgba(99, 102, 241, 0.06)',
  hoverCol: 'rgba(99, 102, 241, 0.06)',
  highlight: '#f59e0b',
  cursor: '#4f46e5',
  clueText: '#57534e',
  solvedBg: '#fef3c7',
  clueAreaBg: '#f5f5f4',
};

const MIN_CELL_SIZE = 12;
const MAX_CELL_SIZE = 40;
const CLUE_FONT_MIN = 8;
const CLUE_FONT_MAX = 14;

interface Layout {
  cellSize: number;
  rowClueWidth: number;
  colClueHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  clueFontSize: number;
}

type Props = BoardProps<NonogramState, NonogramMove>;

export function NonogramBoard({ state, onMove, disabled, highlightCell }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursor, setCursor] = useState<{ row: number; col: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);

  // Stable refs for values needed in callbacks without re-creation
  const stateRef = useRef(state);
  stateRef.current = state;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const highlightRef = useRef(highlightCell);
  highlightRef.current = highlightCell;
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const hoverRef = useRef(hoverCell);
  hoverRef.current = hoverCell;

  const { width, height, grid, rowClues, colClues } = state;

  // ═══════════════════════════════════════════════════════════════
  // Layout — recomputes on dimension/clue changes AND container resize
  // ═══════════════════════════════════════════════════════════════
  //
  // layoutVersion is bumped by ResizeObserver to force re-computation when
  // the container size changes (refs don't invalidate useMemo).
  // Initial value 0 → first render (ref null) returns null; ResizeObserver
  // fires after mount → bumps version → useMemo re-runs with valid ref.
  const [layoutVersion, setLayoutVersion] = useState(0);

  const layout = useMemo<Layout | null>(() => {
    const container = containerRef.current;
    if (!container) return null;

    const cw = container.clientWidth;
    const ch = Math.max(container.clientHeight, 400);

    const maxRowClues = Math.max(...rowClues.map(r => r.length), 0);
    const maxColClues = Math.max(...colClues.map(c => c.length), 0);

    const clueFontSize = Math.max(
      CLUE_FONT_MIN,
      Math.min(CLUE_FONT_MAX, 14 - Math.max(maxRowClues - 3, maxColClues - 3, 0) * 1.5),
    );

    const rowClueWidth = maxRowClues > 0 ? maxRowClues * (clueFontSize + 2) + 16 : 24;
    const colClueHeight = maxColClues > 0 ? maxColClues * (clueFontSize + 2) + 16 : 24;

    const availW = cw - rowClueWidth;
    const availH = ch - colClueHeight;
    const cellSize = Math.max(
      MIN_CELL_SIZE,
      Math.min(MAX_CELL_SIZE, Math.floor(availW / width), Math.floor(availH / height)),
    );

    return {
      cellSize,
      rowClueWidth,
      colClueHeight,
      // +1 so thick border strokes aren't clipped at right/bottom canvas edge
      canvasWidth: rowClueWidth + width * cellSize + 1,
      canvasHeight: colClueHeight + height * cellSize + 1,
      clueFontSize,
    };
  }, [width, height, rowClues, colClues, layoutVersion]);

  // Stable ref for layout (for use in mouse handlers)
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // ═══════════════════════════════════════════════════════════════
  // Canvas resize — only when layout changes
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = layout.canvasWidth * dpr;
    canvas.height = layout.canvasHeight * dpr;
    canvas.style.width = `${layout.canvasWidth}px`;
    canvas.style.height = `${layout.canvasHeight}px`;
    paint();
  }, [layout]);

  // ResizeObserver — bumps layoutVersion to trigger useMemo re-computation
  // (ref changes don't invalidate useMemo, so we need a state signal)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      setLayoutVersion(v => v + 1);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Paint — draws current state to canvas using requestAnimationFrame
  // ═══════════════════════════════════════════════════════════════

  const rafRef = useRef(0);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const l = layoutRef.current;
    if (!canvas || !l) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;
    const hov = hoverRef.current;
    const cur = cursorRef.current;
    const hl = highlightRef.current;
    const dis = disabledRef.current;
    const { cellSize, rowClueWidth, colClueHeight, canvasWidth, canvasHeight, clueFontSize } = l;
    const { grid: g, rowClues: rc, colClues: cc, width: w, height: h } = s;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Clue area backgrounds
    ctx.fillStyle = COLORS.clueAreaBg;
    ctx.fillRect(0, colClueHeight, rowClueWidth, h * cellSize);
    ctx.fillRect(rowClueWidth, 0, w * cellSize, colClueHeight);

    // Column clues
    ctx.font = `${clueFontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = COLORS.clueText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let c = 0; c < w; c++) {
      const clues = cc[c]!;
      const x = rowClueWidth + c * cellSize + cellSize / 2;
      for (let i = 0; i < clues.length; i++) {
        ctx.fillText(String(clues[i]), x, colClueHeight - 4 - (clues.length - 1 - i) * (clueFontSize + 2));
      }
    }

    // Row clues
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < h; r++) {
      const clues = rc[r]!;
      const y = colClueHeight + r * cellSize + cellSize / 2;
      for (let i = 0; i < clues.length; i++) {
        ctx.fillText(String(clues[i]), rowClueWidth - 8 - (clues.length - 1 - i) * (clueFontSize + 3), y);
      }
    }

    // Hover highlight
    if (hov && !dis) {
      ctx.fillStyle = COLORS.hoverRow;
      ctx.fillRect(rowClueWidth, colClueHeight + hov.row * cellSize, w * cellSize, cellSize);
      ctx.fillStyle = COLORS.hoverCol;
      ctx.fillRect(rowClueWidth + hov.col * cellSize, colClueHeight, cellSize, h * cellSize);
    }

    // Grid cells
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const x = rowClueWidth + c * cellSize;
        const y = colClueHeight + r * cellSize;
        const cell = g[r]![c]!;
        if (cell === FILLED) {
          ctx.fillStyle = COLORS.filled;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        } else if (cell === CROSS) {
          const pad = Math.max(3, cellSize * 0.2);
          ctx.strokeStyle = COLORS.cross;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + pad, y + pad);
          ctx.lineTo(x + cellSize - pad, y + cellSize - pad);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + cellSize - pad, y + pad);
          ctx.lineTo(x + pad, y + cellSize - pad);
          ctx.stroke();
        }
      }
    }

    // Highlight
    if (hl) {
      const hx = rowClueWidth + hl.col * cellSize;
      const hy = colClueHeight + hl.row * cellSize;
      ctx.strokeStyle = COLORS.highlight;
      ctx.lineWidth = 3;
      ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
    }

    // Cursor
    if (cur && !dis) {
      const cx = rowClueWidth + cur.col * cellSize;
      const cy = colClueHeight + cur.row * cellSize;
      ctx.strokeStyle = COLORS.cursor;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
    }

    // Grid lines — outer border thick, internal lines thin
    for (let r = 0; r <= h; r++) {
      const y = colClueHeight + r * cellSize;
      const isBorder = r === 0 || r === h;
      ctx.strokeStyle = isBorder ? COLORS.thickLine : COLORS.gridLine;
      ctx.lineWidth = isBorder ? 2 : 0.5;
      ctx.beginPath();
      ctx.moveTo(rowClueWidth, y);
      ctx.lineTo(rowClueWidth + w * cellSize, y);
      ctx.stroke();
    }
    for (let c = 0; c <= w; c++) {
      const x = rowClueWidth + c * cellSize;
      const isBorder = c === 0 || c === w;
      ctx.strokeStyle = isBorder ? COLORS.thickLine : COLORS.gridLine;
      ctx.lineWidth = isBorder ? 2 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, colClueHeight);
      ctx.lineTo(x, colClueHeight + h * cellSize);
      ctx.stroke();
    }

    // Solved check — validate against clues, not a hidden answer pattern
    const solved = isSolved(s);
    if (solved) {
      ctx.fillStyle = COLORS.solvedBg;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(rowClueWidth, colClueHeight, w * cellSize, h * cellSize);
      ctx.globalAlpha = 1;
    }
  }, []); // stable — uses refs, never changes

  // Redraw on state changes (throttled via rAF)
  const schedulePaint = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => {
    schedulePaint();
  }, [grid, hoverCell, cursor, highlightCell, disabled, schedulePaint]);

  // ═══════════════════════════════════════════════════════════════
  // Mouse interaction — uses stable refs, no re-creation on render
  // ═══════════════════════════════════════════════════════════════

  const getCell = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const l = layoutRef.current;
    if (!canvas || !l) return null;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (l.canvasWidth / rect.width);
    const my = (e.clientY - rect.top) * (l.canvasHeight / rect.height);

    const col = Math.floor((mx - l.rowClueWidth) / l.cellSize);
    const row = Math.floor((my - l.colClueHeight) / l.cellSize);

    const s = stateRef.current;
    if (col < 0 || col >= s.width || row < 0 || row >= s.height) return null;
    return { row, col };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabledRef.current) return;
    const cell = getCell(e);
    if (!cell) return;
    if (e.button === 2 || e.shiftKey) {
      e.preventDefault();
      onMoveRef.current({ row: cell.row, col: cell.col, action: 'cross' });
    } else if (e.button === 0) {
      onMoveRef.current({ row: cell.row, col: cell.col, action: 'fill' });
    }
    setCursor(cell);
  }, [getCell]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setHoverCell(getCell(e));
  }, [getCell]);

  // ═══════════════════════════════════════════════════════════════
  // Keyboard interaction
  // ═══════════════════════════════════════════════════════════════

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabledRef.current) return;
    const s = stateRef.current;
    setCursor(prev => {
      const cur = prev ?? { row: 0, col: 0 };
      let { row, col } = cur;
      switch (e.key) {
        case 'ArrowUp': row = Math.max(0, row - 1); break;
        case 'ArrowDown': row = Math.min(s.height - 1, row + 1); break;
        case 'ArrowLeft': col = Math.max(0, col - 1); break;
        case 'ArrowRight': col = Math.min(s.width - 1, col + 1); break;
        case ' ':
        case 'Enter':
          onMoveRef.current({ row, col, action: 'fill' });
          return { row, col };
        case 'x':
        case 'X':
          onMoveRef.current({ row, col, action: 'cross' });
          return { row, col };
        default:
          return prev;
      }
      return { row, col };
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center gap-2 select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        className="max-w-full"
        style={{ cursor: disabled ? 'default' : 'pointer' }}
        onMouseDown={handleMouseDown}
        onContextMenu={e => e.preventDefault()}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCell(null)}
      />
      <div className="text-[10px] text-warm-stone-400 flex flex-wrap justify-center gap-x-3 gap-y-0.5">
        <span>🖱 {t('nonogram.clickToFill')}</span>
        <span>🖱 {t('nonogram.rightClickToCross')}</span>
        <span>⌨ {t('nonogram.keyboardHint')}</span>
      </div>
    </div>
  );
}
