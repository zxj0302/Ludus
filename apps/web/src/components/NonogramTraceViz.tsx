import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface SearchTreeNode {
  id: number;
  parentId: number | null;
  cell?: { row: number; col: number };
  guess?: 'fill' | 'cross';
  depth: number;
  result: 'solved' | 'contradiction' | 'branch';
  newCells: number;
}

interface AlgorithmTraceData {
  lineSteps: LineSolveTraceStep[];
  searchTree: SearchTreeNode[];
  totalLineSolveIterations: number;
  branchCount: number;
  solutionNodeIds: number[];
}

const CELL = 16;
const FILL = '#292524';
const EMPTY_BG = '#fafaf9';
const DETERMINED_FILL = '#22c55e';
const DETERMINED_EMPTY = '#ef4444';
const BORDER = '#d6d3d1';

export function NonogramTraceViz({ trace, solution }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'line' | 'tree'>('line');

  const data = trace.visualizationData as any;
  const algo = data?.algorithmTrace as AlgorithmTraceData | undefined;
  const nodesExplored = data?.nodesExplored ?? solution.stats.nodesExplored;
  const backtracks = data?.backtracks ?? 0;
  const timeMs = data?.timeMs ?? solution.stats.timeMs;

  return (
    <div className="p-4 bg-warm-stone-50 rounded-card border border-warm-stone-200">
      <h3 className="text-lg font-bold text-warm-stone-800 mb-3">🧠 {t('nonogram.bfsTree')}</h3>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <div className="px-2 py-1 rounded bg-logic-indigo-100 text-logic-indigo-800 font-semibold">
          {t('nonogram.nodesExplored')}: {nodesExplored}
        </div>
        <div className="px-2 py-1 rounded bg-clarity-teal-100 text-clarity-teal-800 font-semibold">
          {t('nonogram.lineSolved')}: {algo?.totalLineSolveIterations ?? 0} steps
        </div>
        <div className="px-2 py-1 rounded bg-game-amber-100 text-game-amber-800 font-semibold">
          {t('nonogram.backtrackDepth')}: {backtracks}
        </div>
        <div className="px-2 py-1 rounded bg-warm-stone-200 text-warm-stone-700 font-semibold">
          {timeMs}ms
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 mb-3">
        {(['line', 'tree'] as const).map(tKey => (
          <button
            key={tKey}
            type="button"
            onClick={() => setTab(tKey)}
            className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all
              ${tab === tKey ? 'bg-logic-indigo-600 text-white shadow-sm' : 'bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200'}`}
          >
            {tKey === 'line' ? '📐 线求解推理' : '🌲 回溯搜索树'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'line' && algo && (
        <LineSolvePanel steps={algo.lineSteps} width={data?.width ?? 5} height={data?.height ?? 5} />
      )}
      {tab === 'tree' && algo && (
        <SearchTreePanel tree={algo.searchTree} solutionIds={algo.solutionNodeIds} />
      )}
      {!algo && (
        <div className="text-sm text-warm-stone-500 text-center py-4">{t('nonogram.noTrace')}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Line Solving Panel
// ═══════════════════════════════════════════════════════════════

function LineSolvePanel({ steps, width, height }: { steps: LineSolveTraceStep[]; width: number; height: number }) {
  const [selected, setSelected] = useState(0);

  if (steps.length === 0) {
    return <div className="text-sm text-warm-stone-500 text-center py-4">求解器直接找到了解（纯线求解，无需回溯）</div>;
  }

  const step = steps[selected]!;

  return (
    <div>
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
      <div className="bg-white rounded-lg p-3 border border-warm-stone-200">
        <div className="text-xs font-semibold text-warm-stone-700 mb-2">
          {step.lineType === 'row' ? '行' : '列'} {step.lineIndex + 1}
          {' — '}线索: [{step.clues.join(', ')}]
          {' — '}共 {step.totalPlacements} 种合法排列
          {' — 确定 '}{step.determinedIndices.length} 个格子
        </div>

        {/* Line visualization */}
        <div className="flex flex-col gap-1">
          {/* Clue row */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-warm-stone-400 w-16 shrink-0">线索</span>
            <div className="flex">
              {Array.from({ length: step.length }).map((_, i) => (
                <div key={i} style={{ width: CELL, height: CELL }}
                  className="border border-transparent flex items-center justify-center text-[8px] text-warm-stone-400" />
              ))}
            </div>
            <span className="text-[10px] text-warm-stone-400 ml-2">[{step.clues.join(', ')}]</span>
          </div>

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

          {/* Result: determined cells */}
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Search Tree Panel
// ═══════════════════════════════════════════════════════════════

function SearchTreePanel({ tree, solutionIds }: { tree: SearchTreeNode[]; solutionIds: number[] }) {
  if (tree.length === 0) return null;

  // Build parent→children map
  const children = new Map<number | null, SearchTreeNode[]>();
  for (const node of tree) {
    const key = node.parentId;
    if (!children.has(key)) children.set(key, []);
    children.get(key)!.push(node);
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-warm-stone-200 max-h-80 overflow-auto">
      <div className="text-xs font-semibold text-warm-stone-700 mb-2">
        搜索树 — {tree.length} 个节点，{solutionIds.length} 个解
      </div>
      <div className="font-mono text-[11px] leading-relaxed">
        <TreeNodeView
          nodes={children.get(null) ?? []}
          childrenMap={children}
          solutionIds={solutionIds}
          depth={0}
        />
      </div>
      <div className="flex gap-3 mt-2 text-[10px] pt-2 border-t border-warm-stone-200">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500" /> 解
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-400" /> 矛盾
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-logic-indigo-400" /> 分支
        </span>
      </div>
    </div>
  );
}

function TreeNodeView({
  nodes, childrenMap, solutionIds, depth,
}: {
  nodes: SearchTreeNode[];
  childrenMap: Map<number | null, SearchTreeNode[]>;
  solutionIds: number[];
  depth: number;
}) {
  return (
    <>
      {nodes.map((node, i) => {
        const isLast = i === nodes.length - 1;
        const isSolution = solutionIds.includes(node.id);
        const prefix = depth > 0
          ? '  '.repeat(depth - 1) + (isLast ? '└─' : '├─')
          : '';

        const colorClass = isSolution
          ? 'text-green-600'
          : node.result === 'contradiction'
            ? 'text-red-400'
            : 'text-logic-indigo-600';

        const icon = isSolution ? '✅' : node.result === 'contradiction' ? '❌' : '🔀';

        const desc = node.guess
          ? `猜 (${node.cell!.row + 1},${node.cell!.col + 1}) = ${node.guess === 'fill' ? '■' : '✕'}`
          : '初始状态';

        const childNodes = childrenMap.get(node.id) ?? [];

        return (
          <div key={node.id}>
            <div className={colorClass}>
              {prefix}{icon} {desc}
              {node.newCells > 0 && ` → +${node.newCells}格`}
              {node.result === 'contradiction' && ' 矛盾!'}
            </div>
            {childNodes.length > 0 && (
              <TreeNodeView
                nodes={childNodes}
                childrenMap={childrenMap}
                solutionIds={solutionIds}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
