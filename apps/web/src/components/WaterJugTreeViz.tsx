import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { SolverTrace, Solution, GameState } from '@ludus/core';
import type { WaterJugState } from '@ludus/games';

interface Props {
  trace: SolverTrace;
  solution: Solution;
  gameState: GameState;
}

export function WaterJugTreeViz({ trace, solution }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const data = trace.visualizationData as {
    nodesExplored: number;
    solutionLength: number;
    pathStates: WaterJugState[];
    timeMs: number;
  } | undefined;

  const pathStates = data?.pathStates ?? [];
  const nodesExplored = data?.nodesExplored ?? solution.stats.nodesExplored;
  const solutionLength = data?.solutionLength ?? solution.stats.solutionLength;
  const timeMs = data?.timeMs ?? solution.stats.timeMs;

  // Derive moves between consecutive path states
  const pathMoves: string[] = [];
  for (let i = 0; i < pathStates.length - 1; i++) {
    const prev = pathStates[i]!;
    const next = pathStates[i + 1]!;
    let desc = '';
    for (let j = 0; j < prev.jugs.length; j++) {
      if (next.jugs[j] === next.capacities[j] && prev.jugs[j] !== next.capacities[j]) {
        desc = `Fill ${j + 1}`;
        break;
      }
      if (next.jugs[j] === 0 && prev.jugs[j] !== 0) {
        desc = `Empty ${j + 1}`;
        break;
      }
    }
    if (!desc) {
      for (let j = 0; j < prev.jugs.length; j++) {
        if (next.jugs[j]! > prev.jugs[j]!) {
          for (let k = 0; k < prev.jugs.length; k++) {
            if (next.jugs[k]! < prev.jugs[k]!) {
              desc = `Pour ${k + 1} → ${j + 1}`;
              break;
            }
          }
          break;
        }
      }
    }
    pathMoves.push(desc || '?');
  }

  return (
    <div className="p-4 bg-warm-stone-50 rounded-card border border-warm-stone-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-warm-stone-800">{t('waterJug.bfsTree')}</h3>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-logic-indigo-600 hover:text-logic-indigo-800 font-medium"
        >
          {expanded ? t('waterJug.collapse') : t('waterJug.expand')}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="px-3 py-1.5 rounded-lg bg-logic-indigo-100 text-logic-indigo-800 font-semibold">
          {t('waterJug.nodesExplored')}: {nodesExplored}
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-clarity-teal-100 text-clarity-teal-800 font-semibold">
          {t('waterJug.solutionPath')}: {t('waterJug.pathSteps', { count: solutionLength })}
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-warm-stone-200 text-warm-stone-700 font-semibold">
          {t('waterJug.timeMs', { ms: timeMs })}
        </div>
      </div>

      {/* Solution path */}
      <AnimatePresence>
        {expanded && pathStates.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto pb-2">
              <div className="flex items-start gap-1 min-w-max justify-center pr-3">
                {pathStates.map((state, i) => {
                  const isLast = i === pathStates.length - 1;
                  return (
                    <div key={i} className="flex items-start gap-1">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="text-[10px] text-warm-stone-400 font-medium">
                          #{i}
                        </div>
                        {/* Jug state display */}
                        <div className={`flex gap-1.5 p-2 rounded-lg ${
                          isLast
                            ? 'bg-game-amber-100 ring-2 ring-game-amber-400'
                            : 'bg-warm-stone-100'
                        }`}>
                          {state.jugs.map((amt, j) => (
                            <div key={j} className="flex flex-col items-center gap-0.5">
                              <div className="relative w-8 h-12 rounded-b-md rounded-t-sm border border-warm-stone-400 bg-warm-stone-50 overflow-hidden">
                                <div
                                  className="absolute bottom-0 left-0 right-0 bg-logic-indigo-400 transition-all"
                                  style={{
                                    height: `${state.capacities[j]! > 0 ? (amt / state.capacities[j]!) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[9px] font-mono text-warm-stone-500">
                                {amt}/{state.capacities[j]}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Move description */}
                        {i < pathStates.length - 1 && (
                          <div className="text-[10px] font-medium text-logic-indigo-600 text-center">
                            {pathMoves[i]}
                          </div>
                        )}
                      </div>
                      {i < pathStates.length - 1 && (
                        <div className="flex items-center pt-8 text-warm-stone-400 text-sm font-bold shrink-0">→</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
