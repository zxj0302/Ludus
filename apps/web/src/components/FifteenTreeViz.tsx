import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { SolverTrace, Solution, GameState } from '@ludus/core';

interface Props {
  trace: SolverTrace;
  solution: Solution;
  gameState: GameState;
}

interface PathNode {
  grid: number[];
  g: number;
  h: number;
  f: number;
}

export function FifteenTreeViz({ trace, solution }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const data = trace.visualizationData as {
    nodesExplored: number;
    solutionLength: number;
    pathNodes: PathNode[];
    timeMs: number;
  } | undefined;

  const pathNodes = data?.pathNodes ?? [];
  const nodesExplored = data?.nodesExplored ?? solution.stats.nodesExplored;
  const solutionLength = data?.solutionLength ?? solution.stats.solutionLength;
  const timeMs = data?.timeMs ?? solution.stats.timeMs;

  return (
    <div className="p-4 bg-warm-stone-50 rounded-card border border-warm-stone-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-warm-stone-800">{t('fifteen.searchTree')}</h3>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-logic-indigo-600 hover:text-logic-indigo-800 font-medium"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-logic-indigo-100 text-logic-indigo-800 font-semibold">
          {t('fifteen.nodesExplored')}: {nodesExplored.toLocaleString()}
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-clarity-teal-100 text-clarity-teal-800 font-semibold">
          {t('fifteen.solutionPath')}: {solutionLength} steps
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-warm-stone-200 text-warm-stone-700 font-semibold">
          {timeMs}ms
        </div>
      </div>

      {/* Solution path */}
      <AnimatePresence>
        {expanded && pathNodes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="text-xs text-warm-stone-500 mb-3 font-medium">
              Each node shows: step number, g (cost so far), h (heuristic), f = g + h
            </div>

            {/* Grid thumbnails along the solution path */}
            <div className="flex flex-wrap gap-4 justify-center">
              {pathNodes.map((node, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`grid gap-0.5 p-1 rounded-lg ${
                      i === pathNodes.length - 1
                        ? 'bg-game-amber-100 ring-2 ring-game-amber-400'
                        : 'bg-warm-stone-100'
                    }`}
                    style={{ gridTemplateColumns: 'repeat(4, 1fr)', width: 'fit-content' }}
                  >
                    {node.grid.map((val, idx) => (
                      <div
                        key={idx}
                        className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold
                          ${val === 0 ? 'bg-transparent' : 'bg-logic-indigo-500 text-white'}`}
                      >
                        {val !== 0 ? val : ''}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-warm-stone-600 text-center">
                    <div>g={node.g} h={node.h}</div>
                    <div className="font-bold text-logic-indigo-700">f={node.f}</div>
                  </div>
                  {i < pathNodes.length - 1 && (
                    <div className="text-warm-stone-400 text-xs">↓</div>
                  )}
                </div>
              ))}
            </div>

            {/* f-value trend bar chart */}
            {pathNodes.length > 1 && (
              <div className="mt-4">
                <div className="text-xs text-warm-stone-500 mb-2 font-medium">
                  f = g + h trend (non-decreasing along optimal path)
                </div>
                <div className="flex items-end gap-0.5 h-16">
                  {pathNodes.map((node, i) => {
                    const maxF = pathNodes[pathNodes.length - 1]!.f || 1;
                    const heightPct = (node.f / maxF) * 100;
                    const isLast = i === pathNodes.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div
                          className={`w-full rounded-t-sm min-h-[2px] ${
                            isLast ? 'bg-game-amber-400' : 'bg-logic-indigo-300'
                          }`}
                          style={{ height: `${Math.max(heightPct, 2)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-warm-stone-400 mt-1">
                  <span>Step 0</span>
                  <span>Step {pathNodes.length - 1}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
