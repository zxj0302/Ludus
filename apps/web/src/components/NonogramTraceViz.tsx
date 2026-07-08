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
        <SearchTreePanel tree={algo.searchTree} solutionIds={algo.solutionNodeIds} lineSteps={algo.lineSteps} />
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
// Search Tree Panel — SVG tree diagram
// ═══════════════════════════════════════════════════════════════

const NODE_W = 130;
const NODE_H = 36;
const LAYER_GAP = 140; // horizontal spacing between depth layers
const NODE_GAP = 10;   // vertical spacing between sibling nodes

interface LayoutNode {
  node: SearchTreeNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

function SearchTreePanel({ tree, solutionIds, lineSteps }: { tree: SearchTreeNode[]; solutionIds: number[]; lineSteps?: LineSolveTraceStep[] }) {
  if (tree.length === 0) return null;

  // If only 1 root node (no backtracking happened), build a linear tree from line-solve steps
  let displayTree = tree;
  if (tree.length === 1 && lineSteps && lineSteps.length > 0) {
    displayTree = [];
    // Root node
    displayTree.push({ ...tree[0]!, id: 0, parentId: null });
    // One node per line-solve step
    for (let i = 0; i < lineSteps.length; i++) {
      const step = lineSteps[i]!;
      displayTree.push({
        id: i + 1,
        parentId: i, // chain: 0 → 1 → 2 → ...
        cell: undefined,
        guess: undefined,
        depth: i + 1,
        result: i === lineSteps.length - 1 ? 'solved' : 'branch',
        newCells: step.determinedIndices.length,
      });
    }
    solutionIds = [lineSteps.length]; // last node is solution
  }

  // Build parent→children map
  const childrenMap = new Map<number | null, SearchTreeNode[]>();
  for (const node of displayTree) {
    const key = node.parentId;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(node);
  }

  // Build layout tree
  function buildLayout(parentId: number | null): LayoutNode[] {
    const kids = childrenMap.get(parentId) ?? [];
    return kids.map(n => ({
      node: n,
      x: 0, y: 0, // computed later
      children: buildLayout(n.id),
    }));
  }

  const roots = buildLayout(null);

  // Assign y positions (in-order traversal)
  let nextY = NODE_GAP;
  function assignY(nodes: LayoutNode[]): number {
    let totalH = 0;
    for (const n of nodes) {
      if (n.children.length > 0) {
        totalH += assignY(n.children);
      } else {
        n.y = nextY;
        nextY += NODE_H + NODE_GAP;
        totalH += NODE_H + NODE_GAP;
      }
    }
    if (nodes.length > 0) {
      // Center parent between children
      const first = nodes[0]!;
      const childrenBottom = first.children.length > 0
        ? first.children[first.children.length - 1]!.y
        : first.y;
      const childrenTop = first.children.length > 0
        ? first.children[0]!.y
        : first.y;
      for (const n of nodes) {
        n.y = (childrenTop + childrenBottom + NODE_H) / 2 - NODE_H / 2;
      }
    }
    return totalH;
  }
  assignY(roots);
  nextY = Math.max(nextY, 50);
  const svgH = nextY + 20;

  // Assign x positions
  function assignX(nodes: LayoutNode[], depth: number) {
    for (const n of nodes) {
      n.x = 10 + depth * LAYER_GAP;
      assignX(n.children, depth + 1);
    }
  }
  assignX(roots, 0);
  const maxX = Math.max(...displayTree.map(n => n.depth), 0);
  const svgW = 20 + (maxX + 1) * LAYER_GAP + NODE_W;

  // Collect all layout nodes
  const allNodes: LayoutNode[] = [];
  function collect(nodes: LayoutNode[]) {
    for (const n of nodes) {
      allNodes.push(n);
      collect(n.children);
    }
  }
  collect(roots);

  return (
    <div className="bg-white rounded-lg border border-warm-stone-200 overflow-auto" style={{ maxHeight: 420 }}>
      <div className="text-xs font-semibold text-warm-stone-700 px-3 pt-2">
        搜索树 — {tree.length} 个节点，{solutionIds.length} 个解
      </div>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="block">
        {/* Edges */}
        {allNodes.map(ln =>
          ln.children.map(child => {
            const x1 = ln.x + NODE_W;
            const y1 = ln.y + NODE_H / 2;
            const x2 = child.x;
            const y2 = child.y + NODE_H / 2;
            const midX = (x1 + x2) / 2;
            const isSolution = solutionIds.includes(child.node.id);
            const stroke = child.node.result === 'contradiction' ? '#fca5a5'
              : isSolution ? '#86efac'
              : '#a5b4fc';
            return (
              <g key={`edge-${ln.node.id}-${child.node.id}`}>
                <path
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none" stroke={stroke} strokeWidth={2}
                />
                {/* Edge label: guess value or step count */}
                {child.node.guess && (
                  <text x={midX} y={(y1 + y2) / 2 - 4} textAnchor="middle"
                    fill="#78716c" fontSize="10" fontWeight="bold">
                    {child.node.guess === 'fill' ? '■' : '✕'}
                  </text>
                )}
                {!child.node.guess && child.node.newCells > 0 && (
                  <text x={midX} y={(y1 + y2) / 2 - 4} textAnchor="middle"
                    fill="#78716c" fontSize="9">
                    +{child.node.newCells}
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* Nodes */}
        {allNodes.map(ln => {
          const n = ln.node;
          const isSolution = solutionIds.includes(n.id);
          const fill = isSolution ? '#dcfce7'
            : n.result === 'contradiction' ? '#fee2e2'
            : '#eef2ff';
          const stroke = isSolution ? '#22c55e'
            : n.result === 'contradiction' ? '#ef4444'
            : '#6366f1';
          const hasCell = n.cell && n.guess;
          const label = hasCell
            ? `(${n.cell!.row + 1},${n.cell!.col + 1})`
            : n.parentId === null ? '始' : `L${n.id}`;
          const resultIcon = isSolution ? '✅'
            : n.result === 'contradiction' ? '❌'
            : '';

          return (
            <g key={`node-${n.id}`}>
              <rect x={ln.x} y={ln.y} width={NODE_W} height={NODE_H}
                rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
              <text x={ln.x + 8} y={ln.y + 14} fill="#44403c" fontSize="11" fontWeight="bold">
                {label} {resultIcon}
              </text>
              <text x={ln.x + 8} y={ln.y + 28} fill="#78716c" fontSize="10">
                {n.newCells > 0 ? `+${n.newCells}格` : ''}
                {n.result === 'contradiction' ? ' 矛盾' : n.result === 'solved' ? ' 解!' : ''}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-3 px-3 pb-2 text-[10px]">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-green-300" /> 解</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-200" /> 矛盾</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-indigo-100" /> 分支</span>
        <span className="flex items-center gap-1 ml-2">边标注: <b>■</b>=填 <b>✕</b>=空</span>
      </div>
    </div>
  );
}
