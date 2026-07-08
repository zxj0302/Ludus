import { useState, useMemo } from 'react';
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

// ═══════════════════════════════════════════════════════════════
// Line-solving step detail
// ═══════════════════════════════════════════════════════════════

const CELL = 16;
const DETERMINED_FILL = '#22c55e';
const DETERMINED_EMPTY = '#ef4444';

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

// ═══════════════════════════════════════════════════════════════
// Backtracking search tree
// ═══════════════════════════════════════════════════════════════

const BT_NODE_W = 108;
const BT_NODE_H = 38;
const BT_LEVEL_H = 72;
const BT_LEAF_GAP = 24;

interface TreeNodeData {
  node: SearchTreeNode;
  children: TreeNodeData[];
}

function buildTree(nodes: SearchTreeNode[]): TreeNodeData | null {
  if (nodes.length === 0) return null;
  const map = new Map<number, TreeNodeData>();
  for (const n of nodes) map.set(n.id, { node: n, children: [] });
  for (const n of nodes) {
    if (n.parentId !== null) {
      const parent = map.get(n.parentId);
      if (parent) parent.children.push(map.get(n.id)!);
    }
  }
  return map.get(0) ?? null;
}

interface LayoutNode {
  node: SearchTreeNode;
  x: number;
  y: number;
}

function computeTreeLayout(root: TreeNodeData): { layout: LayoutNode[]; canvasW: number; canvasH: number } {
  const xMap = new Map<number, number>();
  let leafSeq = 0;

  // Step 1: assign leaf positions (inorder)
  function assignLeaves(tn: TreeNodeData) {
    if (tn.children.length === 0) {
      xMap.set(tn.node.id, leafSeq++);
    } else {
      for (const c of tn.children) assignLeaves(c);
    }
  }
  assignLeaves(root);

  // Step 2: center internal nodes over children
  function centerParents(tn: TreeNodeData) {
    if (tn.children.length > 0) {
      for (const c of tn.children) centerParents(c);
      const childXs = tn.children.map(c => xMap.get(c.node.id)!);
      const minX = Math.min(...childXs);
      const maxX = Math.max(...childXs);
      xMap.set(tn.node.id, (minX + maxX) / 2);
    }
  }
  centerParents(root);

  // Step 3: build layout nodes
  const layout: LayoutNode[] = [];
  let maxDepth = 0;

  function collect(tn: TreeNodeData) {
    const x = xMap.get(tn.node.id) ?? 0;
    const y = tn.node.depth * BT_LEVEL_H;
    if (tn.node.depth > maxDepth) maxDepth = tn.node.depth;
    layout.push({ node: tn.node, x, y });
    for (const c of tn.children) collect(c);
  }
  collect(root);

  const canvasW = Math.max(300, (leafSeq - 1) * (BT_NODE_W + BT_LEAF_GAP) + BT_NODE_W + 48);
  const canvasH = Math.max(120, (maxDepth + 1) * BT_LEVEL_H + 32);

  return { layout, canvasW, canvasH };
}

// Node style helpers
const BT_COLORS = {
  root:    { bg: '#f5f5f4', border: '#a8a29e', text: '#57534e' },
  branch:  { bg: '#eef2ff', border: '#818cf8', text: '#3730a3' },
  solved:  { bg: '#dcfce7', border: '#4ade80', text: '#166534' },
  contradiction: { bg: '#fef2f2', border: '#f87171', text: '#991b1b' },
};

function btNodeStyle(n: SearchTreeNode) {
  if (n.result === 'solved') return BT_COLORS.solved;
  if (n.result === 'contradiction') return BT_COLORS.contradiction;
  if (n.depth === 0 && !n.guess) return BT_COLORS.root;
  return BT_COLORS.branch;
}

function btNodeLabel(n: SearchTreeNode): string {
  if (n.depth === 0 && !n.guess) {
    return `初始线求解 +${n.newCells}`;
  }
  const cell = n.cell;
  const coord = cell ? `R${cell.row + 1}C${cell.col + 1}` : '?';
  const guessIcon = n.guess === 'fill' ? '■' : n.guess === 'cross' ? '✕' : '?';
  const detail = n.newCells > 0 ? `+${n.newCells}` : '';
  const suffix = n.result === 'solved' ? ' ✓' : n.result === 'contradiction' ? ' ✗' : '';
  return `${coord} ${guessIcon} ${detail}${suffix}`.trim();
}

function BacktrackTree({ searchTree }: { searchTree: SearchTreeNode[] }) {
  const { t } = useTranslation();

  const root = useMemo(() => buildTree(searchTree), [searchTree]);
  const { layout, canvasW, canvasH } = useMemo(
    () => root ? computeTreeLayout(root) : { layout: [], canvasW: 300, canvasH: 120 },
    [root],
  );
  const offsetX = canvasW / 2;

  // Build edge data
  const edges = useMemo(() => {
    if (!root) return [];
    const idToLayout = new Map(layout.map(l => [l.node.id, l]));
    const result: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

    function collectEdges(tn: TreeNodeData) {
      const p = idToLayout.get(tn.node.id);
      if (!p) return;
      for (const c of tn.children) {
        const cl = idToLayout.get(c.node.id);
        if (!cl) continue;
        result.push({
          x1: p.x + BT_NODE_W / 2,
          y1: p.y + BT_NODE_H,
          x2: cl.x + BT_NODE_W / 2,
          y2: cl.y,
          color: c.node.result === 'solved' ? '#4ade80' : c.node.result === 'contradiction' ? '#f87171' : '#d6d3d1',
        });
        collectEdges(c);
      }
    }
    collectEdges(root);
    return result;
  }, [root, layout]);

  if (!root || searchTree.length <= 1) {
    return (
      <div className="text-sm text-warm-stone-400 text-center py-6">
        {t('nonogram.noBacktrackNeeded')}
      </div>
    );
  }

  // Count stats
  const branchCount = searchTree.filter(n => n.result === 'branch').length;
  const contradictionCount = searchTree.filter(n => n.result === 'contradiction').length;
  const solvedCount = searchTree.filter(n => n.result === 'solved').length;
  const maxDepth = Math.max(...searchTree.map(n => n.depth));

  return (
    <div>
      {/* Summary */}
      <div className="flex flex-wrap gap-2 mb-3 text-[10px]">
        <span className="px-2 py-0.5 rounded bg-warm-stone-100 text-warm-stone-600">
          {t('nonogram.btNodes')}: {searchTree.length}
        </span>
        <span className="px-2 py-0.5 rounded bg-logic-indigo-100 text-logic-indigo-700">
          {t('nonogram.btBranches')}: {branchCount}
        </span>
        <span className="px-2 py-0.5 rounded bg-red-50 text-red-600">
          ✗: {contradictionCount}
        </span>
        <span className="px-2 py-0.5 rounded bg-green-50 text-green-700">
          ✓: {solvedCount}
        </span>
        <span className="px-2 py-0.5 rounded bg-warm-stone-100 text-warm-stone-600">
          {t('nonogram.btMaxDepth')}: {maxDepth}
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-[10px] text-warm-stone-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm border" style={{ background: BT_COLORS.root.bg, borderColor: BT_COLORS.root.border }} /> 线求解
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm border" style={{ background: BT_COLORS.branch.bg, borderColor: BT_COLORS.branch.border }} /> 分支
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm border" style={{ background: BT_COLORS.solved.bg, borderColor: BT_COLORS.solved.border }} /> 得解
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm border" style={{ background: BT_COLORS.contradiction.bg, borderColor: BT_COLORS.contradiction.border }} /> 矛盾
        </span>
      </div>

      {/* Tree canvas */}
      <div className="overflow-auto" style={{ maxHeight: 400 }}>
        <div className="relative" style={{ width: canvasW, height: canvasH, minHeight: 160 }}>
          {/* SVG edges */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: canvasW, height: canvasH }}>
            {edges.map((e, i) => (
              <line
                key={i}
                x1={e.x1 + offsetX} y1={e.y1}
                x2={e.x2 + offsetX} y2={e.y2}
                stroke={e.color}
                strokeWidth={1.5}
              />
            ))}
          </svg>

          {/* Nodes */}
          {layout.map(ln => {
            const s = btNodeStyle(ln.node);
            return (
              <div
                key={ln.node.id}
                className="absolute flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold leading-tight select-none"
                style={{
                  left: ln.x + offsetX,
                  top: ln.y,
                  width: BT_NODE_W,
                  height: BT_NODE_H,
                  background: s.bg,
                  border: `2px solid ${s.border}`,
                  color: s.text,
                }}
                title={btNodeLabel(ln.node)}
              >
                <span className="truncate">{btNodeLabel(ln.node)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════

export function NonogramTraceViz({ trace, solution }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<'line' | 'backtrack'>('line');

  const data = trace.visualizationData as any;
  const algo = data?.algorithmTrace as AlgorithmTraceData | undefined;
  const steps = algo?.lineSteps ?? [];
  const searchTree = algo?.searchTree ?? [];
  const nodesExplored = data?.nodesExplored ?? solution.stats.nodesExplored;
  const backtracks = data?.backtracks ?? (solution.stats as any).backtracks ?? 0;
  const timeMs = data?.timeMs ?? solution.stats.timeMs;

  const hasBacktrackTree = searchTree.length > 1;

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
        {backtracks > 0 && (
          <div className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold">
            {t('nonogram.btBacktracks')}: {backtracks}
          </div>
        )}
        <div className="px-2 py-1 rounded bg-warm-stone-200 text-warm-stone-700 font-semibold">
          {timeMs}ms
        </div>
      </div>

      {/* Tab switcher — only show if backtrack tree exists */}
      {hasBacktrackTree && (
        <div className="flex gap-1 mb-3">
          <button
            type="button"
            onClick={() => setTab('line')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              tab === 'line' ? 'bg-logic-indigo-600 text-white' : 'bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200'
            }`}
          >
            📏 {t('nonogram.lineSolveTab')}
          </button>
          <button
            type="button"
            onClick={() => setTab('backtrack')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              tab === 'backtrack' ? 'bg-logic-indigo-600 text-white' : 'bg-warm-stone-100 text-warm-stone-600 hover:bg-warm-stone-200'
            }`}
          >
            🌳 {t('nonogram.backtrackTab')}
          </button>
        </div>
      )}

      {/* Tab content */}
      {tab === 'line' || !hasBacktrackTree ? (
        <>
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
        </>
      ) : (
        <BacktrackTree searchTree={searchTree} />
      )}
    </div>
  );
}
