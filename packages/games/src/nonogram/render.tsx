import { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from '../types';
import type { NonogramState, NonogramMove } from './types';
import { EMPTY, FILLED, CROSS } from './types';

// ═══════════════════════════════════════════════════════════════
// Drawing constants
// ═══════════════════════════════════════════════════════════════

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
};

const MIN_CELL_SIZE = 12;
const MAX_CELL_SIZE = 40;
const CLUE_FONT_MIN = 8;
const CLUE_FONT_MAX = 14;
const GRID_GROUP_SIZE = 5; // thick line every 5 cells

type Props = BoardProps<NonogramState, NonogramMove>;

export function NonogramBoard({ state, onMove, disabled, highlightCell }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursor, setCursor] = useState<{ row: number; col: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const animFrameRef = useRef<number>(0);

  const { width, height, grid, rowClues, colClues, solution } = state;

  // ═══════════════════════════════════════════════════════════
  // Layout calculation
  // ═══════════════════════════════════════════════════════════

  const computeLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return null;

    const containerWidth = container.clientWidth;
    const containerHeight = Math.max(container.clientHeight, 400);

    // Calculate clue area sizes
    const maxRowClues = Math.max(...rowClues.map(r => r.length), 0);
    const maxColClues = Math.max(...colClues.map(c => c.length), 0);

    const clueFontSize = Math.max(
      CLUE_FONT_MIN,
      Math.min(CLUE_FONT_MAX, 14 - Math.max(maxRowClues - 3, maxColClues - 3, 0) * 1.5),
    );

    const rowClueWidth = maxRowClues > 0
      ? maxRowClues * (clueFontSize + 2) + 16
      : 24;
    const colClueHeight = maxColClues > 0
      ? maxColClues * (clueFontSize + 2) + 16
      : 24;

    const availWidth = containerWidth - rowClueWidth;
    const availHeight = containerHeight - colClueHeight;

    const cellSize = Math.max(
      MIN_CELL_SIZE,
      Math.min(MAX_CELL_SIZE, Math.floor(availWidth / width), Math.floor(availHeight / height)),
    );

    const canvasWidth = rowClueWidth + width * cellSize;
    const canvasHeight = colClueHeight + height * cellSize;

    return {
      cellSize,
      rowClueWidth,
      colClueHeight,
      canvasWidth,
      canvasHeight,
      clueFontSize,
    };
  }, [width, height, rowClues, colClues]);

  // ═══════════════════════════════════════════════════════════
  // Drawing
  // ═══════════════════════════════════════════════════════════

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const layout = computeLayout();
    if (!canvas || !layout) return;

    const { cellSize, rowClueWidth, colClueHeight, canvasWidth, canvasHeight, clueFontSize } = layout;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Solved state background
    const solved = grid.every((row, r) =>
      row.every((cell, c) => {
        const filled = cell === FILLED;
        return filled === (solution[r]![c]!);
      }),
    );

    // Row clue area background
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(0, colClueHeight, rowClueWidth, height * cellSize);

    // Column clue area background
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(rowClueWidth, 0, width * cellSize, colClueHeight);

    // Draw column clues
    ctx.font = `${clueFontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = COLORS.clueText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let c = 0; c < width; c++) {
      const clues = colClues[c]!;
      const x = rowClueWidth + c * cellSize + cellSize / 2;
      for (let i = 0; i < clues.length; i++) {
        const y = colClueHeight - 4 - (clues.length - 1 - i) * (clueFontSize + 2);
        ctx.fillText(String(clues[i]), x, y);
      }
    }

    // Draw row clues
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < height; r++) {
      const clues = rowClues[r]!;
      const y = colClueHeight + r * cellSize + cellSize / 2;
      for (let i = 0; i < clues.length; i++) {
        const x = rowClueWidth - 8 - (clues.length - 1 - i) * (clueFontSize + 3);
        ctx.fillText(String(clues[i]), x, y);
      }
    }

    // Draw hover highlight
    if (hoverCell && !disabled) {
      const hRow = hoverCell.row;
      const hCol = hoverCell.col;
      ctx.fillStyle = COLORS.hoverRow;
      ctx.fillRect(rowClueWidth, colClueHeight + hRow * cellSize, width * cellSize, cellSize);
      ctx.fillStyle = COLORS.hoverCol;
      ctx.fillRect(rowClueWidth + hCol * cellSize, colClueHeight, cellSize, height * cellSize);
    }

    // Draw grid cells
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const x = rowClueWidth + c * cellSize;
        const y = colClueHeight + r * cellSize;
        const cell = grid[r]![c]!;

        if (cell === FILLED) {
          ctx.fillStyle = COLORS.filled;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        } else if (cell === CROSS) {
          // Draw X mark
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

    // Draw highlight (from solve playback)
    if (highlightCell) {
      const hx = rowClueWidth + highlightCell.col * cellSize;
      const hy = colClueHeight + highlightCell.row * cellSize;
      ctx.strokeStyle = COLORS.highlight;
      ctx.lineWidth = 3;
      ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
    }

    // Draw cursor
    if (cursor && !disabled) {
      const cx = rowClueWidth + cursor.col * cellSize;
      const cy = colClueHeight + cursor.row * cellSize;
      ctx.strokeStyle = COLORS.cursor;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
    }

    // Draw grid lines
    for (let r = 0; r <= height; r++) {
      const y = colClueHeight + r * cellSize;
      const isGroup = r % GRID_GROUP_SIZE === 0;
      ctx.strokeStyle = isGroup ? COLORS.thickLine : COLORS.gridLine;
      ctx.lineWidth = isGroup ? 2 : 0.5;
      ctx.beginPath();
      ctx.moveTo(rowClueWidth, y);
      ctx.lineTo(rowClueWidth + width * cellSize, y);
      ctx.stroke();
    }
    for (let c = 0; c <= width; c++) {
      const x = rowClueWidth + c * cellSize;
      const isGroup = c % GRID_GROUP_SIZE === 0;
      ctx.strokeStyle = isGroup ? COLORS.thickLine : COLORS.gridLine;
      ctx.lineWidth = isGroup ? 2 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, colClueHeight);
      ctx.lineTo(x, colClueHeight + height * cellSize);
      ctx.stroke();
    }

    // Solved overlay
    if (solved) {
      ctx.fillStyle = COLORS.solvedBg;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(rowClueWidth, colClueHeight, width * cellSize, height * cellSize);
      ctx.globalAlpha = 1;
    }
  }, [grid, width, height, rowClues, colClues, solution, hoverCell, cursor, highlightCell, disabled, computeLayout]);

  // ═══════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    draw();
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => draw());
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  // ═══════════════════════════════════════════════════════════
  // Mouse interaction
  // ═══════════════════════════════════════════════════════════

  const getCellFromEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>): { row: number; col: number } | null => {
    const canvas = canvasRef.current;
    const layout = computeLayout();
    if (!canvas || !layout) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = layout.canvasWidth / rect.width;
    const scaleY = layout.canvasHeight / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const col = Math.floor((mx - layout.rowClueWidth) / layout.cellSize);
    const row = Math.floor((my - layout.colClueHeight) / layout.cellSize);

    if (col < 0 || col >= width || row < 0 || row >= height) return null;
    return { row, col };
  }, [width, height, computeLayout]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;

    if (e.button === 2 || e.shiftKey) {
      // Right click or Shift+click → toggle cross
      e.preventDefault();
      onMove({ row: cell.row, col: cell.col, action: 'cross' });
    } else if (e.button === 0) {
      // Left click → toggle fill
      onMove({ row: cell.row, col: cell.col, action: 'fill' });
    }

    setCursor(cell);
  }, [disabled, onMove, getCellFromEvent]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e);
    setHoverCell(cell);
  }, [getCellFromEvent]);

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Keyboard interaction
  // ═══════════════════════════════════════════════════════════

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    setCursor(prev => {
      const cur = prev ?? { row: 0, col: 0 };
      let { row, col } = cur;

      switch (e.key) {
        case 'ArrowUp': row = Math.max(0, row - 1); break;
        case 'ArrowDown': row = Math.min(height - 1, row + 1); break;
        case 'ArrowLeft': col = Math.max(0, col - 1); break;
        case 'ArrowRight': col = Math.min(width - 1, col + 1); break;
        case ' ':
        case 'Enter':
          onMove({ row, col, action: 'fill' });
          return { row, col };
        case 'x':
        case 'X':
          onMove({ row, col, action: 'cross' });
          return { row, col };
        default:
          return prev;
      }

      return { row, col };
    });
  }, [disabled, width, height, onMove]);

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center gap-2 select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        style={{ maxWidth: '100%', cursor: disabled ? 'default' : 'pointer' }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div className="text-[10px] text-warm-stone-400 flex flex-wrap justify-center gap-x-3 gap-y-0.5">
        <span>🖱 {t('nonogram.clickToFill')}</span>
        <span>🖱 {t('nonogram.rightClickToCross')}</span>
        <span>⌨ {t('nonogram.keyboardHint')}</span>
      </div>
    </div>
  );
}
