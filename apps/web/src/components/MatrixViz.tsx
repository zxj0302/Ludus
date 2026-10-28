import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { Solution, SolverTrace } from '@ludus/core'; import type { EliminationStep } from '@ludus/games';
import { KnowledgeCard } from './KnowledgeCard';
import type { LightsOutState } from '@ludus/games';
import { useGameStore } from '../stores/gameStore';

interface Props {
  solution: Solution;
  solveStepIndex: number;
  gameState: LightsOutState | null;
  /** When set, solution cells (value 1) apply this press on the board. */
  onPressCell?: (row: number, col: number) => void;
  solvePlayback?: boolean;
}

type ViewMode = 'solution' | 'matrix' | 'elimination' | 'stats';

export function MatrixViz({
  solution,
  solveStepIndex,
  gameState,
  onPressCell,
  solvePlayback = false,
}: Props) {
  const { t } = useTranslation();
  const solverStatus = useGameStore(s => s.solverStatus);
  const [viewMode, setViewMode] = useState<ViewMode>('solution');
  const [elimStepIdx, setElimStepIdx] = useState(0);
  /** Odd toggles from viz clicks (GF(2)); used for ✓ when not in playback. */
  const [vizPressed, setVizPressed] = useState<Set<number>>(() => new Set());
  const internalPressRef = useRef(false);

  const trace = solution.trace as SolverTrace | undefined;
  const vizData = trace?.visualizationData as Record<string, unknown> | undefined;

  const rank = vizData?.rank as number | undefined;
  const nullity = (vizData?.nullity as number | undefined) ?? 0;
  const solutionVec = vizData?.solution as number[] | null | undefined;
  const [baselineSolutionVec, setBaselineSolutionVec] = useState<number[] | null | undefined>(solutionVec);
  const matrix = vizData?.matrix as number[][] | undefined;
  const liveVector = gameState?.grid as number[] | undefined;
  const vector = liveVector ?? (vizData?.vector as number[] | undefined);
  const N = solutionVec?.length ?? 0;
  const gridSize = Math.round(Math.sqrt(N)) || 1;

  const eliminationSteps = vizData?.eliminationSteps as EliminationStep[] | undefined;

  useEffect(() => {
    if (internalPressRef.current) {
      internalPressRef.current = false;
      return;
    }
    setElimStepIdx(0);
    setVizPressed(new Set());
    setBaselineSolutionVec(solutionVec);
  }, [eliminationSteps, solutionVec]);

  const activeSolutionVec = (!solvePlayback && baselineSolutionVec && baselineSolutionVec.length === N)
    ? baselineSolutionVec
    : solutionVec;

  const playbackExecuted = new Set<number>();
  if (solvePlayback && solveStepIndex > 0 && solution.moves) {
    for (let i = 0; i < solveStepIndex; i++) {
      const m = solution.moves[i] as { row: number; col: number } | undefined;
      if (m) playbackExecuted.add(m.row * gridSize + m.col);
    }
  }
  const boardCleared = !!liveVector && liveVector.length > 0 && liveVector.every(v => v === 0);
  const allSolutionPressed = new Set<number>();
  if (boardCleared && activeSolutionVec) {
    activeSolutionVec.forEach((v, i) => { if (v === 1) allSolutionPressed.add(i); });
  }
  const executedIndices = new Set<number>([
    ...playbackExecuted,
    ...(solvePlayback ? [] : vizPressed),
    ...allSolutionPressed,
  ]);
  const currentMove = solvePlayback && solveStepIndex < solution.moves.length
    ? solution.moves[solveStepIndex] as { row: number; col: number } | undefined
    : null;
  const currentIdx = currentMove ? currentMove.row * gridSize + currentMove.col : -1;

  // Cleared board: no more presses (applyMove would no-op when solved anyway).
  const effectiveOnPressCell = (solvePlayback || solverStatus === 'running') ? undefined : onPressCell;
  const interactive = !!effectiveOnPressCell && !solvePlayback && solverStatus !== 'running' && !boardCleared;

  const handleCellPress = (row: number, col: number, idx: number, val: number) => {
    if (!interactive || val !== 1 || !effectiveOnPressCell) return;
    internalPressRef.current = true;
    setVizPressed(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    effectiveOnPressCell(row, col);
  };

  if (!vizData) return null;

  // 当前消元步骤
  const currentElimStep = eliminationSteps?.[elimStepIdx];
  const maxElimSteps = eliminationSteps?.length ?? 0;

  return (
    <div className="space-y-3">
      {/* View mode tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(['solution', 'elimination', 'matrix', 'stats'] as ViewMode[]).map(mode => {
          const labels: Record<ViewMode, string> = {
            solution: t('matrix.solution'),
            elimination: t('matrix.tab.elimination'),
            matrix: t('matrix.title'),
            stats: t('matrix.tab.stats'),
          };
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`text-xs px-3 py-1.5 rounded-btn font-medium transition-all
                ${viewMode === mode ? 'bg-logic-indigo-600 text-white' : 'bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200'}`}
            >
              {labels[mode]}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="sync">
        {/* Solution grid */}
        {viewMode === 'solution' && activeSolutionVec && (
          <motion.div key="solution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <KnowledgeCard title={t('matrix.solution')} icon="💡">
              <p className="text-[11px] text-warm-stone-500 mb-3">
                {nullity === 0 ? t('matrix.unique') : t('matrix.multiple', { count: 1 << nullity })}
                {' — '}
                {interactive ? t('matrix.solutionHintInteractive') : t('matrix.solutionHint')}
              </p>
              <div className="flex justify-center">
                <div>
                  <div className="flex mb-0.5 ml-6">
                    {Array.from({ length: gridSize }, (_, c) => (
                      <div key={c} className="w-10 text-center text-[9px] text-warm-stone-400">{c + 1}</div>
                    ))}
                  </div>
                  {Array.from({ length: gridSize }, (_, r) => (
                    <div key={r} className="flex items-center mb-0.5">
                      <div className="w-5 text-right text-[9px] text-warm-stone-400 mr-1">{r + 1}</div>
                      {Array.from({ length: gridSize }, (_, c) => {
                        const idx = r * gridSize + c;
                        const val = activeSolutionVec[idx]!;
                        const isExecuted = executedIndices.has(idx);
                        const isCurrent = idx === currentIdx;
                        const canPress = interactive && val === 1;
                        const cellClass = `w-10 h-9 flex items-center justify-center text-xs font-mono font-bold border-2 transition-colors duration-150
                              ${isCurrent ? 'border-logic-indigo-500 bg-logic-indigo-100 text-logic-indigo-700 shadow-md'
                                : isExecuted ? 'border-clarity-teal-light bg-clarity-teal-light/30 text-clarity-teal-dark'
                                : val === 1 ? 'border-game-amber-400 bg-game-amber-400 text-game-amber-800'
                                : 'border-warm-stone-200 bg-warm-stone-50 text-warm-stone-300'}
                              ${canPress ? 'cursor-pointer hover:ring-2 hover:ring-logic-indigo-400 hover:ring-offset-1' : ''}`;
                        const label = val === 1 ? (isExecuted ? '✓' : '●') : '·';
                        return (
                          <motion.div
                            key={c}
                            initial={{ scale: 0 }}
                            animate={{ scale: isCurrent ? 1.15 : 1, opacity: isExecuted && !isCurrent ? 0.4 : 1 }}
                            transition={{ duration: 0.15 }}
                          >
                            {canPress ? (
                              <button
                                type="button"
                                className={cellClass}
                                onClick={() => handleCellPress(r, c, idx, val)}
                                aria-label={t('matrix.pressCell', { row: r + 1, col: c + 1 })}
                              >
                                {label}
                              </button>
                            ) : (
                              <div className={cellClass} aria-hidden={val === 0}>
                                {label}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-warm-stone-400 mt-2 text-center">
                {solveStepIndex > 0 || executedIndices.size > 0
                  ? t('matrix.legend.completed', { done: executedIndices.size, total: activeSolutionVec.filter(v => v === 1).length })
                  : t('matrix.legend.pending', { total: activeSolutionVec.filter(v => v === 1).length })}
              </p>
            </KnowledgeCard>
          </motion.div>
        )}

        {/* Elimination steps — step-by-step augmented matrix */}
        {viewMode === 'elimination' && eliminationSteps && currentElimStep && (
          <motion.div key="elimination" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <KnowledgeCard title={t('matrix.elimination.title', { step: elimStepIdx + 1, total: maxElimSteps })} icon="🔍">
              {/* Step description */}
              <p className="text-xs text-warm-stone-700 mb-2 font-medium">
                {t(currentElimStep.descriptionKey, currentElimStep.descriptionParams as Record<string, string | number>)}
              </p>

              {/* Phase indicator */}
              <div className="flex gap-2 mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                  ${currentElimStep.phase === 'forward' ? 'bg-logic-indigo-100 text-logic-indigo-700'
                    : currentElimStep.phase === 'back' ? 'bg-game-amber-100 text-game-amber-700'
                    : 'bg-clarity-teal-light text-clarity-teal-dark'}`}>
                  {currentElimStep.phase === 'forward' ? t('matrix.elimination.phase.forward') : currentElimStep.phase === 'back' ? t('matrix.elimination.phase.back') : t('matrix.elimination.phase.done')}
                </span>
                {currentElimStep.pivotRow >= 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-stone-100 text-warm-stone-600">
                    {t('matrix.elimination.pivot', { row: currentElimStep.pivotRow + 1, col: currentElimStep.pivotCol + 1 })}
                  </span>
                )}
              </div>

              {/* 完整增广矩阵 — 显示所有行 */}
              <div className="max-h-80 overflow-auto bg-warm-stone-50 rounded-lg p-2 border border-warm-stone-200 mb-3">
                <div className="inline-block min-w-full">
                  {currentElimStep.augmentedMatrix.map((row, i) => {
                    const isPivotRow = i === currentElimStep.pivotRow;
                    const isEliminated = currentElimStep.eliminatedRows.includes(i);
                    const cols = row.length;
                    return (
                      <div key={i} className={`flex text-[9px] font-mono leading-snug py-px
                        ${isPivotRow ? 'bg-logic-indigo-100/60 rounded' : ''}
                        ${isEliminated ? 'bg-game-amber-50' : ''}`}>
                        <span className={`w-7 text-right mr-1 shrink-0
                          ${isPivotRow ? 'text-logic-indigo-700 font-bold' : isEliminated ? 'text-game-amber-700' : 'text-warm-stone-400'}`}>
                          {i + 1}{isPivotRow ? ' ⬤' : isEliminated ? ' ✕' : ''}
                        </span>
                        {row.slice(0, cols - 1).map((val, j) => {
                          const isPivotCol = j === currentElimStep.pivotCol;
                          return (
                            <span key={j} className={`w-3 text-center shrink-0
                              ${isPivotCol && isPivotRow ? 'text-logic-indigo-700 font-extrabold scale-125' : ''}
                              ${isPivotCol && !isPivotRow ? 'text-logic-indigo-400' : ''}
                              ${val === 1 ? (isPivotCol ? '' : 'text-logic-indigo-600 font-bold') : 'text-warm-stone-300'}`}>
                              {val}
                            </span>
                          );
                        })}
                        <span className="text-warm-stone-300 mx-1 shrink-0">│</span>
                        <span className={`w-3 text-center shrink-0 font-bold
                          ${isPivotRow ? 'text-logic-indigo-700' : isEliminated ? 'text-game-amber-700' : 'text-game-amber-600'}`}>
                          {row[cols - 1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step navigation */}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setElimStepIdx(0)} disabled={elimStepIdx === 0}
                  className="text-xs px-2 py-1 rounded bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200 disabled:opacity-30">
                  ⏮
                </button>
                <button type="button" onClick={() => setElimStepIdx(Math.max(0, elimStepIdx - 1))} disabled={elimStepIdx === 0}
                  className="text-xs px-2 py-1 rounded bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200 disabled:opacity-30">
                  ◀
                </button>
                <div className="flex-1 h-1.5 bg-warm-stone-200 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-logic-indigo-600 rounded-full"
                    animate={{ width: `${((elimStepIdx + 1) / maxElimSteps) * 100}%` }}
                    transition={{ duration: 0.2 }} />
                </div>
                <button type="button" onClick={() => setElimStepIdx(Math.min(maxElimSteps - 1, elimStepIdx + 1))} disabled={elimStepIdx >= maxElimSteps - 1}
                  className="text-xs px-2 py-1 rounded bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200 disabled:opacity-30">
                  ▶
                </button>
                <button type="button" onClick={() => setElimStepIdx(maxElimSteps - 1)} disabled={elimStepIdx >= maxElimSteps - 1}
                  className="text-xs px-2 py-1 rounded bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200 disabled:opacity-30">
                  ⏭
                </button>
              </div>

              <p className="text-[10px] text-warm-stone-400 mt-2">
                {t('matrix.elimination.legend')}
              </p>
            </KnowledgeCard>
          </motion.div>
        )}

        {/* Matrix view — live augmented matrix */}
        {viewMode === 'matrix' && (
          <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <KnowledgeCard title={t('matrix.title')} icon="📊">
              <div className="flex gap-3 mb-4">
                <div className="flex-1 bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                  <div className="text-[10px] text-warm-stone-500">{t('matrix.rank')}</div>
                  <div className="text-lg font-bold text-logic-indigo-700">{rank}</div>
                </div>
                <div className="flex-1 bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                  <div className="text-[10px] text-warm-stone-500">{t('matrix.nullity')}</div>
                  <div className="text-lg font-bold text-logic-indigo-700">{nullity}</div>
                </div>
                <div className="flex-1 bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
                  <div className="text-[10px] text-warm-stone-500">{t('matrix.stats.size')}</div>
                  <div className="text-lg font-bold text-warm-stone-800">{N}×{N}</div>
                </div>
              </div>
              <p className="text-[11px] text-warm-stone-600 mb-1">
                {t('matrix.augmentedDesc')}
              </p>
              <p className="text-[10px] text-warm-stone-400 mb-3">
                {liveVector ? t('matrix.liveVector') : t('matrix.snapshotVector')}
                {t('matrix.viewElimSteps')}
              </p>
              {matrix && (
                <div className="max-h-96 overflow-auto bg-warm-stone-50 rounded-lg p-2 border border-warm-stone-200">
                  <div className="inline-block">
                    {matrix.slice(0, Math.min(30, matrix.length)).map((row, i) => (
                      <div key={i} className="flex text-[10px] font-mono leading-tight">
                        <span className="text-warm-stone-400 w-7 text-right mr-1 shrink-0">{i + 1}</span>
                        {row.slice(0, Math.min(30, row.length)).map((val, j) => (
                          <span key={j} className={`w-3 text-center shrink-0 ${val === 1 ? 'text-logic-indigo-600 font-bold bg-logic-indigo-100/50' : 'text-warm-stone-300'}`}>
                            {val}
                          </span>
                        ))}
                        {row.length > 30 && <span className="text-warm-stone-400">…</span>}
                        {vector && i < vector.length && (
                          <>
                            <span className="text-warm-stone-300 mx-1 shrink-0">│</span>
                            <span className="text-game-amber-700 font-bold w-3 text-center shrink-0">{vector[i]}</span>
                          </>
                        )}
                      </div>
                    ))}
                    {matrix.length > 30 && <div className="text-[10px] text-warm-stone-400 mt-1">{t('matrix.moreRows', { count: matrix.length - 30 })}</div>}
                  </div>
                </div>
              )}
            </KnowledgeCard>
          </motion.div>
        )}

        {/* Stats */}
        {viewMode === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <KnowledgeCard title={t('matrix.stats.title')} icon="📈">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded-btn p-2.5 border border-warm-stone-200">
                  <div className="text-warm-stone-500">{t('matrix.stats.solver')}</div>
                  <div className="font-mono text-logic-indigo-700 font-medium">{solution.stats.solverName}</div>
                </div>
                <div className="bg-white rounded-btn p-2.5 border border-warm-stone-200">
                  <div className="text-warm-stone-500">{t('matrix.stats.time')}</div>
                  <div className="font-mono font-medium">{solution.stats.timeMs}ms</div>
                </div>
                <div className="bg-white rounded-btn p-2.5 border border-warm-stone-200">
                  <div className="text-warm-stone-500">{t('matrix.stats.solution')}</div>
                  <div className="font-bold text-lg text-clarity-teal-dark">{t('matrix.stats.steps', { count: solution.stats.solutionLength })}</div>
                </div>
                <div className="bg-white rounded-btn p-2.5 border border-warm-stone-200">
                  <div className="text-warm-stone-500">{t('matrix.stats.status')}</div>
                  <div className={solution.solvable ? 'text-clarity-teal-dark font-bold' : 'text-red-500 font-bold'}>
                    {solution.solvable ? t('matrix.stats.solvable') : t('matrix.stats.unsolvable')}
                  </div>
                </div>
              </div>
            </KnowledgeCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
