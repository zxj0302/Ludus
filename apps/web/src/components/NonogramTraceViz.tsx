import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SolverTrace, Solution } from '@ludus/core';

interface Props {
  trace: SolverTrace;
  solution: Solution;
}

interface LineSolveTraceStep {
  lineType: 'row' | 'col';
  lineIndex: number;
  length: number;
  clues: number[];
  placements: boolean[][];
  totalPlacements: number;
  determinedIndices: number[];
  determinedValues: ('fill' | 'empty')[];
}

interface AlgorithmTraceData {
  lineSteps: LineSolveTraceStep[];
  totalLineSolveIterations: number;
}

const CELL = 16;
const DETERMINED_FILL = '#22c55e';
const DETERMINED_EMPTY = '#ef4444';

export function NonogramTraceViz({ trace, solution }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);

  const data = trace.visualizationData as any;
  const algo = data?.algorithmTrace as AlgorithmTraceData | undefined;
  const steps = algo?.lineSteps ?? [];
  const nodesExplored = data?.nodesExplored ?? solution.stats.nodesExplored;
  const timeMs = data?.timeMs ?? solution.stats.timeMs;

  return (
    <div className="p-4 bg-warm-stone-50 rounded-card border border-warm-stone-200">
      <h3 className="text-lg font-bold text-warm-stone-800 mb-3">
        📐 {t('nonogram.bfsTree')}
      </h3>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <div className="px-2 py-1 rounded bg-logic-indigo-100 text-logic-indigo-800 font-semibold">
          {t('nonogram.nodesExplored')}: {nodesExplored}
        </div>
        <div className="px-2 py-1 rounded bg-clarity-teal-100 text-clarity-teal-800 font-semibold">
          {t('nonogram.lineSolved')}: {algo?.totalLineSolveIterations ?? 0} steps
        </div>
        <div className="px-2 py-1 rounded bg-warm-stone-200 text-warm-stone-700 font-semibold">
          {timeMs}ms
        </div>
      </div>

      {steps.length === 0 ? (
        <div className="text-sm text-warm-stone-500 text-center py-4">
          {t('nonogram.noTrace')}
        </div>
      ) : (
        <>
          {/* Step selector */}
          <div className="flex flex-wrap gap-1 mb-3">
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all
                  ${i === selected ? 'bg-logic-indigo-600 text-white' : 'bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200'}`}
                title={`${s.lineType === 'row' ? 'Row' : 'Col'} ${s.lineIndex + 1}: ${s.determinedIndices.length} cells`}
              >
                {s.lineType === 'row' ? 'R' : 'C'}{s.lineIndex + 1}
              </button>
            ))}
          </div>

          {/* Step detail */}
          <StepDetail step={steps[selected]!} />
        </>
      )}
    </div>
  );
}

function StepDetail({ step }: { step: LineSolveTraceStep }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-warm-stone-200">
      <div className="text-xs font-semibold text-warm-stone-700 mb-2">
        {step.lineType === 'row' ? '行' : '列'} {step.lineIndex + 1}
        {' — '}线索: [{step.clues.join(', ')}]
        {' — '}共 {step.totalPlacements} 种合法排列
        {' — 确定 '}{step.determinedIndices.length} 个格子
      </div>

      <div className="flex flex-col gap-1">
        {/* Placements */}
        {step.placements.slice(0, 8).map((placement, pi) => (
          <div key={pi} className="flex items-center gap-1">
            <span className="text-[10px] text-warm-stone-400 w-16 shrink-0">
              {pi === 0 ? '排列' : ''}
            </span>
            <div className="flex">
              {placement.map((filled, i) => (
                <div key={i} style={{ width: CELL, height: CELL }}
                  className={`border border-warm-stone-200 ${filled ? 'bg-warm-stone-700' : 'bg-white'}`} />
              ))}
            </div>
          </div>
        ))}

        {step.totalPlacements > step.placements.length && (
          <div className="text-[10px] text-warm-stone-400 ml-16">
            ... 还有 {step.totalPlacements - step.placements.length} 种排列
          </div>
        )}

        {/* Result: intersection → determined cells */}
        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-warm-stone-200">
          <span className="text-[10px] text-warm-stone-700 font-semibold w-16 shrink-0">交集 →</span>
          <div className="flex">
            {Array.from({ length: step.length }).map((_, i) => {
              const detIdx = step.determinedIndices.indexOf(i);
              const isDetermined = detIdx !== -1;
              const val = isDetermined ? step.determinedValues[detIdx] : null;
              return (
                <div key={i}
                  style={{
                    width: CELL, height: CELL,
                    backgroundColor: val === 'fill' ? DETERMINED_FILL : val === 'empty' ? DETERMINED_EMPTY : 'white',
                  }}
                  className={`border ${isDetermined ? 'border-white' : 'border-warm-stone-200'} flex items-center justify-center`}>
                  {val === 'fill' && <span className="text-white text-[8px] font-bold">■</span>}
                  {val === 'empty' && <span className="text-white text-[8px] font-bold">✕</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 mt-1 ml-16 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: DETERMINED_FILL }} /> 必然填
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: DETERMINED_EMPTY }} /> 必然空
          </span>
        </div>
      </div>
    </div>
  );
}
