// apps/web/src/components/DLXMatrixViz.tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Solution } from '@ludus/core';

interface Props {
  solution: Solution;
  /** Currently active trace step index (-1 = initial) */
  activeStep?: number;
}

export function DLXMatrixViz({ solution, activeStep = -1 }: Props) {
  const { t } = useTranslation();
  const { stats } = solution;
  const trace = solution.trace;

  const stepsLength = trace?.steps.length ?? 0;

  // Extract step data
  const currentStep = trace && activeStep >= 0 && activeStep < stepsLength
    ? trace.steps[activeStep]
    : null;

  const matrixDesc = (trace?.visualizationData as { matrixDesc?: string; totalRows?: number; totalCols?: number }) ?? {};

  // Count actions by type
  const actionCounts = useMemo(() => {
    const counts = { choose: 0, try: 0, backtrack: 0, solution: 0 };
    if (!trace) return counts;
    for (const step of trace.steps) {
      if (step.description.startsWith('Choose')) counts.choose++;
      else if (step.description.startsWith('Try')) counts.try++;
      else if (step.description.startsWith('Backtrack')) counts.backtrack++;
      else if (step.description === 'Solution found') counts.solution++;
    }
    return counts;
  }, [trace]);

  return (
    <div className="rounded-card border border-warm-stone-200 bg-white p-4 space-y-3">
      <h3 className="text-sm font-bold text-warm-stone-800">
        {t('sudoku.matrix.title')}
      </h3>

      {/* Matrix description */}
      <div className="text-xs text-warm-stone-500 space-y-1">
        <p>{matrixDesc.matrixDesc ?? `${matrixDesc.totalRows ?? 729} rows x ${matrixDesc.totalCols ?? 324} columns`}</p>
        <p>{t('sudoku.matrix.description')}</p>
      </div>

      {/* Search statistics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-warm-stone-50 rounded-btn p-2">
          <div className="text-[10px] text-warm-stone-500">{t('sudoku.matrix.nodes')}</div>
          <div className="text-lg font-bold text-logic-indigo-700">{stats.nodesExplored}</div>
        </div>
        <div className="bg-warm-stone-50 rounded-btn p-2">
          <div className="text-[10px] text-warm-stone-500">{t('sudoku.matrix.time')}</div>
          <div className="text-lg font-bold text-clarity-teal-dark">{stats.timeMs}ms</div>
        </div>
        <div className="bg-warm-stone-50 rounded-btn p-2">
          <div className="text-[10px] text-warm-stone-500">{t('sudoku.matrix.backtracks')}</div>
          <div className="text-lg font-bold text-game-amber-700">{actionCounts.backtrack}</div>
        </div>
        <div className="bg-warm-stone-50 rounded-btn p-2">
          <div className="text-[10px] text-warm-stone-500">{t('sudoku.matrix.choices')}</div>
          <div className="text-lg font-bold text-logic-indigo-700">{actionCounts.choose}</div>
        </div>
      </div>

      {/* Current step info */}
      {currentStep && (
        <div className="bg-logic-indigo-50 rounded-btn p-3 text-xs">
          <div className="font-semibold text-logic-indigo-800">
            {t('sudoku.matrix.currentStep', { current: activeStep + 1, total: stepsLength })}
          </div>
          <div className="text-logic-indigo-600 mt-1 font-mono">
            {currentStep.description}
          </div>
          {currentStep.data ? (
            <pre className="mt-1 text-[10px] text-warm-stone-500 overflow-x-auto">
              {JSON.stringify(currentStep.data, null, 2) ?? ''}
            </pre>
          ) : null}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 text-[10px] text-warm-stone-500">
        {t('sudoku.matrix.legend').split(' | ').map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}
