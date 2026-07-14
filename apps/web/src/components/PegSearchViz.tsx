import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ReactFlow,
  Position,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useTranslation } from 'react-i18next';
import type { Solution, SolverTrace } from '@ludus/core';
import type { PegSolitaireMove, PegTreeNode } from '@ludus/games';
import { holeNotation } from '@ludus/games';

interface Props {
  trace: SolverTrace;
  solution: Solution;
}

interface PegTraceData {
  nodesExplored?: number;
  timeMs?: number;
  solutionLength?: number;
  path?: PegSolitaireMove[];
  treeNodes?: PegTreeNode[];
  maxDepth?: number;
  terminated?: 'solved' | 'timeout' | 'exhausted';
  symmetry?: string;
  search?: 'bfs' | 'dfs' | string;
}

function asPegMoves(value: unknown): PegSolitaireMove[] {
  if (!Array.isArray(value)) return [];
  return value.filter((move): move is PegSolitaireMove => (
    typeof move === 'object'
    && move !== null
    && Number.isInteger((move as Partial<PegSolitaireMove>).from)
    && Number.isInteger((move as Partial<PegSolitaireMove>).over)
    && Number.isInteger((move as Partial<PegSolitaireMove>).to)
  ));
}

function asTreeNodes(value: unknown): PegTreeNode[] {
  if (!Array.isArray(value)) return [];
  return value.filter((node): node is PegTreeNode => (
    typeof node === 'object'
    && node !== null
    && typeof (node as PegTreeNode).id === 'string'
  ));
}

/** Fallback: principal variation only (when older traces lack treeNodes). */
function pathAsTree(path: PegSolitaireMove[], startLabel: string, goalLabel: string): PegTreeNode[] {
  const nodes: PegTreeNode[] = [{
    id: '0',
    parentId: null,
    depth: 0,
    onPath: true,
    moveLabel: null,
  }];
  for (let i = 0; i < path.length; i += 1) {
    const move = path[i]!;
    nodes.push({
      id: String(i + 1),
      parentId: String(i),
      depth: i + 1,
      onPath: true,
      moveLabel: `${holeNotation(move.from)}→${holeNotation(move.to)}`,
    });
  }
  if (nodes[0]) nodes[0] = { ...nodes[0], moveLabel: startLabel };
  const last = nodes[nodes.length - 1];
  if (last && path.length > 0) {
    nodes[nodes.length - 1] = { ...last, moveLabel: last.moveLabel ? `${last.moveLabel} · ${goalLabel}` : goalLabel };
  }
  return nodes;
}

function layoutTree(
  treeNodes: PegTreeNode[],
  startLabel: string,
  goalLabel: string,
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 28, ranksep: 52 });

  for (const node of treeNodes) {
    g.setNode(node.id, { width: 132, height: 44 });
  }
  for (const node of treeNodes) {
    if (node.parentId) g.setEdge(node.parentId, node.id);
  }
  dagre.layout(g);

  const nodes: Node[] = treeNodes.map((node) => {
    const dagNode = g.node(node.id) as { x: number; y: number } | undefined;
    const isRoot = node.parentId === null;
    const isGoal = node.onPath && treeNodes.every(n => !n.onPath || n.depth <= node.depth)
      && node.depth === Math.max(0, ...treeNodes.filter(n => n.onPath).map(n => n.depth));
    const label = isRoot
      ? startLabel
      : isGoal
        ? `${node.moveLabel ?? ''} · ${goalLabel}`
        : (node.moveLabel ?? `d${node.depth}`);

    // Design tokens: indigo root / amber path / stone branch / teal goal
    const palette = isGoal
      ? { bg: '#f0fdf9', border: '#14b897' }
      : node.onPath
        ? { bg: '#fffbeb', border: '#f79409' }
        : isRoot
          ? { bg: '#f0f2ff', border: '#3b3fd4' }
          : { bg: '#fafaf9', border: '#d4cbc2' };

    return {
      id: node.id,
      position: { x: (dagNode?.x ?? 0) - 66, y: (dagNode?.y ?? 0) - 22 },
      data: { label },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      style: {
        background: palette.bg,
        border: `2px solid ${palette.border}`,
        borderRadius: '8px',
        padding: '6px 8px',
        fontSize: '10px',
        fontFamily: 'JetBrains Mono, monospace',
        textAlign: 'center' as const,
        width: 132,
        opacity: node.onPath || isRoot ? 1 : 0.85,
      },
    };
  });

  const edges: Edge[] = treeNodes
    .filter(node => node.parentId)
    .map((node) => ({
      id: `e-${node.parentId}-${node.id}`,
      source: node.parentId!,
      target: node.id,
      style: {
        stroke: node.onPath ? '#f79409' : '#d4cbc2',
        strokeWidth: node.onPath ? 2 : 1.25,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: node.onPath ? '#f79409' : '#d4cbc2',
        width: 16,
        height: 16,
      },
    }));

  return { nodes, edges };
}

export function PegSearchViz({ trace, solution }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const data = (trace.visualizationData ?? {}) as PegTraceData;
  const path = useMemo(() => {
    const tracePath = asPegMoves(data.path);
    if (tracePath.length > 0) return tracePath;
    return asPegMoves(solution.moves);
  }, [data.path, solution.moves]);

  const treeNodes = useMemo(() => {
    const recorded = asTreeNodes(data.treeNodes);
    if (recorded.length > 0) return recorded;
    return pathAsTree(path.slice(0, 16), t('pegSolitaire.viz.treeStart'), t('pegSolitaire.viz.treeGoal'));
  }, [data.treeNodes, path, t]);

  const nodesExplored = data.nodesExplored ?? solution.stats.nodesExplored ?? 0;
  const terminated = data.terminated ?? solution.stats.terminated ?? (solution.solvable ? 'solved' : 'exhausted');
  const rawLength = data.solutionLength ?? solution.stats.solutionLength ?? path.length;
  const solutionLength = terminated === 'timeout' && path.length === 0 ? null : rawLength;
  const timeMs = data.timeMs ?? solution.stats.timeMs ?? 0;
  const maxDepth = data.maxDepth ?? trace.steps.length;
  const search = data.search ?? 'dfs';
  const symmetry = data.symmetry ?? 'D4';
  const branchCount = treeNodes.filter(n => !n.onPath && n.parentId).length;

  const tree = useMemo(
    () => layoutTree(treeNodes, t('pegSolitaire.viz.treeStart'), t('pegSolitaire.viz.treeGoal')),
    [treeNodes, t],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(tree.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(tree.edges);

  useEffect(() => {
    setNodes(tree.nodes);
    setEdges(tree.edges);
  }, [tree, setNodes, setEdges]);

  return (
    <div className="bg-logic-indigo-50/60 rounded-card border border-logic-indigo-200/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-logic-indigo-200/50 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-logic-indigo-900">{t('pegSolitaire.viz.title')}</h3>
          <p className="text-xs text-logic-indigo-500 mt-1">{t('pegSolitaire.viz.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          className="text-xs text-logic-indigo-600 hover:text-logic-indigo-800 font-semibold shrink-0"
        >
          {expanded ? t('pegSolitaire.viz.collapse') : t('pegSolitaire.viz.expand')}
        </button>
      </div>

      <div className="p-4">
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <div className="px-2.5 py-1 rounded-lg bg-logic-indigo-100 text-logic-indigo-800 font-semibold">
          {t('pegSolitaire.viz.nodesExplored')}: {nodesExplored.toLocaleString()}
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-clarity-teal-100 text-clarity-teal-800 font-semibold">
          {t('pegSolitaire.viz.solutionLength')}: {solutionLength ?? '—'}
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-warm-stone-100 text-warm-stone-700 font-semibold">
          {t('pegSolitaire.viz.ms', { ms: timeMs })}
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-game-amber-100 text-game-amber-800 font-semibold">
          {t('pegSolitaire.viz.maxDepth')}: {maxDepth}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <Badge>{t('pegSolitaire.viz.searchMode', { mode: t(`pegSolitaire.viz.search.${search}`) })}</Badge>
        <Badge>{t('pegSolitaire.viz.symmetry', { symmetry })}</Badge>
        <Badge>{t(`pegSolitaire.viz.terminated.${terminated}`)}</Badge>
        <Badge>{solution.solvable ? t('pegSolitaire.viz.reachable') : t('pegSolitaire.viz.notReached')}</Badge>
        {branchCount > 0 && (
          <Badge>{t('pegSolitaire.viz.branchSample', { count: branchCount })}</Badge>
        )}
      </div>

      <p className="text-[11px] text-logic-indigo-500 mb-2 font-mono leading-relaxed">
        {t('pegSolitaire.viz.notationHint')}
      </p>

      {expanded && (
        <div className="rounded-lg bg-white/80 border border-logic-indigo-100 overflow-hidden">
          <div className="px-3 pt-3">
            <h4 className="text-sm font-bold text-logic-indigo-900 mb-1">{t('pegSolitaire.viz.pathTitle')}</h4>
            <p className="text-xs text-logic-indigo-500 mb-2">{t('pegSolitaire.viz.treeHint')}</p>
            <div className="flex flex-wrap gap-3 text-[10px] text-logic-indigo-500 mb-2">
              <Legend swatch="#f0f2ff" border="#3b3fd4" label={t('pegSolitaire.viz.legendRoot')} />
              <Legend swatch="#fffbeb" border="#f79409" label={t('pegSolitaire.viz.legendPath')} />
              <Legend swatch="#fafaf9" border="#d4cbc2" label={t('pegSolitaire.viz.legendBranch')} />
              <Legend swatch="#f0fdf9" border="#14b897" label={t('pegSolitaire.viz.legendGoal')} />
            </div>
          </div>
          {treeNodes.length > 0 ? (
            <div style={{ width: '100%', height: Math.min(480, 140 + Math.max(3, maxDepth + 1) * 64) }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                nodesDraggable={false}
                zoomOnScroll={false}
                proOptions={{ hideAttribution: true }}
              />
            </div>
          ) : (
            <p className="px-3 pb-3 text-sm text-logic-indigo-500">{t('pegSolitaire.viz.emptyPath')}</p>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function Legend({ swatch, border, label }: { swatch: string; border: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm border-2" style={{ background: swatch, borderColor: border }} />
      {label}
    </span>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="px-2 py-1 rounded-lg bg-white/80 border border-logic-indigo-200 text-logic-indigo-700 font-semibold">
      {children}
    </span>
  );
}
