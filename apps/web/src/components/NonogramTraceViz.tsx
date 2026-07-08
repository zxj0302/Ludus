import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { SolverTrace, Solution } from '@ludus/core';

interface Props {
  trace: SolverTrace;
  solution: Solution;
}

interface Snapshot {
  label: string;
  grid: number[][];
}

const CELL_SIZE = 14;
const FILL_COLOR = '#292524';
const EMPTY_COLOR = '#fafaf9';
const CROSS_COLOR = '#d6d3d1';
const BORDER_COLOR = '#a8a29e';

export function NonogramTraceViz({ trace, solution }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [activeSnapshot, setActiveSnapshot] = useState(0);

  const data = trace.visualizationData as {
    nodesExplored: number;
    backtracks: number;
    maxDepth: number;
    lineSolveCells: number;
    timeMs: number;
    width: number;
    height: number;
    snapshots?: Snapshot[];
  } | undefined;

  const snapshots = data?.snapshots ?? [];
  const width = data?.width ?? 0;
  const height = data?.height ?? 0;
  const nodesExplored = data?.nodesExplored ?? solution.stats.nodesExplored;
  const timeMs = data?.timeMs ?? solution.stats.timeMs;
  const lineSolveCells = data?.lineSolveCells ?? 0;
  const backtracks = data?.backtracks ?? 0;
  const totalCells = width * height;

  const currentSnapshot = snapshots[activeSnapshot] ?? snapshots[snapshots.length - 1];

  return (
    <div className="p-4 bg-warm-stone-50 rounded-card border border-warm-stone-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-warm-stone-800">
          {t('nonogram.bfsTree')}
        </h3>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-logic-indigo-600 hover:text-logic-indigo-800 font-medium"
        >
          {expanded ? t('nonogram.collapse') : t('nonogram.expand')}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-logic-indigo-100 text-logic-indigo-800 font-semibold">
          {t('nonogram.nodesExplored')}: {nodesExplored}
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-clarity-teal-100 text-clarity-teal-800 font-semibold">
          {t('nonogram.lineSolved')}: {lineSolveCells}/{totalCells}
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-game-amber-100 text-game-amber-800 font-semibold">
          {t('nonogram.backtrackDepth')}: {backtracks}
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-warm-stone-200 text-warm-stone-700 font-semibold">
          {t('nonogram.timeMs', { ms: timeMs })}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Snapshot grid viewer */}
            {currentSnapshot && (
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="text-xs text-warm-stone-500 font-medium">
                  {currentSnapshot.label}
                </div>
                <SnapshotGrid grid={currentSnapshot.grid} width={width} height={height} />
              </div>
            )}

            {/* Snapshot timeline */}
            {snapshots.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {snapshots.map((snap, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSnapshot(i)}
                    className={`px-2.5 py-1.5 rounded-btn text-xs font-medium transition-all
                      ${i === activeSnapshot
                        ? 'bg-logic-indigo-600 text-white shadow-sm'
                        : 'bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200'
                      }`}
                    title={snap.label}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* No snapshots — show explanation */}
            {snapshots.length === 0 && (
              <div className="text-sm text-warm-stone-500 text-center py-4">
                {t('nonogram.noTrace')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Render a single snapshot grid as inline SVG */
function SnapshotGrid({ grid, width, height }: { grid: number[][]; width: number; height: number }) {
  const svgW = width * CELL_SIZE;
  const svgH = height * CELL_SIZE;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="border border-warm-stone-300 rounded-sm"
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const x = c * CELL_SIZE;
          const y = r * CELL_SIZE;
          const fill =
            cell === 1 ? FILL_COLOR
            : cell === 2 ? CROSS_COLOR
            : EMPTY_COLOR;
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} fill={fill} stroke={BORDER_COLOR} strokeWidth={0.5} />
              {cell === 2 && (
                <>
                  <line x1={x + 3} y1={y + 3} x2={x + CELL_SIZE - 3} y2={y + CELL_SIZE - 3} stroke="#a8a29e" strokeWidth={0.5} />
                  <line x1={x + CELL_SIZE - 3} y1={y + 3} x2={x + 3} y2={y + CELL_SIZE - 3} stroke="#a8a29e" strokeWidth={0.5} />
                </>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}
