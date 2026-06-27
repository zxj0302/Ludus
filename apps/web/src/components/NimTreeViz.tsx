import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ReactFlow,
  type Node,
  type Edge,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { SolverTrace } from '@ludus/core';
import { computeNimSum } from '@ludus/games';
import type { NimState } from '@ludus/games';

interface Props {
  trace?: SolverTrace;
  state: NimState;
}

interface TreeNodeData {
  piles: number[];
  nimSum: number;
  isP: boolean;
  depth: number;
  move?: string;
}

function expandTree(piles: number[], depth: number, maxDepth: number, maxNodes = 500): { nodes: TreeNodeData[]; edges: { from: number; to: number; label: string }[] } {
  const nodes: TreeNodeData[] = [];
  const edges: { from: number; to: number; label: string }[] = [];
  const queue: { piles: number[]; parentIdx: number | null; depth: number; moveLabel: string }[] = [
    { piles, parentIdx: null, depth: 0, moveLabel: '' }
  ];

  while (queue.length > 0 && nodes.length < maxNodes) {
    const item = queue.shift()!;
    if (item.depth > maxDepth) continue;

    const nimSum = computeNimSum(item.piles);
    const nodeIdx = nodes.length;
    nodes.push({ piles: [...item.piles], nimSum, isP: nimSum === 0, depth: item.depth, move: item.moveLabel || undefined });

    if (item.parentIdx !== null) {
      edges.push({ from: item.parentIdx, to: nodeIdx, label: item.moveLabel });
    }

    if (item.depth < maxDepth && nodes.length < maxNodes) {
      for (let i = 0; i < item.piles.length && nodes.length < maxNodes; i++) {
        for (let r = 1; r <= item.piles[i]! && nodes.length < maxNodes; r++) {
          const newPiles = [...item.piles];
          newPiles[i]! -= r;
          queue.push({ piles: newPiles, parentIdx: nodeIdx, depth: item.depth + 1, moveLabel: `${i + 1}:${r}` });
        }
      }
    }
  }

  return { nodes, edges };
}

function layoutDagre(nodes: TreeNodeData[], edges: { from: number; to: number; label: string }[], currentPlayer: 0 | 1) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 20, ranksep: 60 });

  nodes.forEach((_, i) => {
    const w = 80;
    const h = 48;
    g.setNode(String(i), { width: w, height: h });
  });

  edges.forEach(e => {
    g.setEdge(String(e.from), String(e.to));
  });

  dagre.layout(g);

  const rfNodes: Node[] = nodes.map((n, i) => {
    const dagNode = g.node(String(i)) as { x: number; y: number } | undefined;
    const x = (dagNode?.x ?? 0) - 40;
    const y = (dagNode?.y ?? 0) - 24;
    const isPlayerTurn = (n.depth + currentPlayer) % 2 === 0;
    const turnIcon = isPlayerTurn ? '🧑' : '🤖';
    return {
      id: String(i),
      position: { x, y },
      data: { label: `${turnIcon} ${n.piles.join(',')}\n${n.nimSum} ${n.isP ? 'P' : 'N'}` },
      style: {
        background: n.isP ? '#fef2f2' : '#eff6ff',
        border: `2px solid ${n.isP ? '#e05d5d' : '#4a90d9'}`,
        borderRadius: '8px',
        padding: '6px 10px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        textAlign: 'center',
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });

  const rfEdges: Edge[] = edges.map((e, i) => ({
    id: `e${i}`,
    source: String(e.from),
    target: String(e.to),
    label: e.label,
    style: { stroke: '#a8a29e', strokeWidth: 1 },
    labelStyle: { fontSize: 9, fill: '#78716c' },
    labelBgStyle: { fill: '#fafaf9' },
  }));

  return { nodes: rfNodes, edges: rfEdges };
}

export function NimTreeViz({ trace, state }: Props) {
  const { t } = useTranslation();

  const tree = useMemo(() => {
    const { nodes, edges } = expandTree(state.piles, 0, 3);
    return layoutDagre(nodes, edges, state.currentPlayer);
  }, [state.piles, state.currentPlayer]);

  const [nodes, setNodes, onNodesChange] = useNodesState(tree.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(tree.edges);

  // Sync React Flow state when tree recalculates
  useEffect(() => {
    setNodes(tree.nodes);
    setEdges(tree.edges);
  }, [tree, setNodes, setEdges]);

  const nimSum = useMemo(() => computeNimSum(state.piles), [state.piles]);

  // Extract trace metadata if available
  const traceData = trace?.visualizationData as
    | { nimSum: number; piles: number[]; pValue: number; xorExpr: string }
    | undefined;

  const isP = traceData ? traceData.pValue === 0 : nimSum === 0;

  return (
    <div className="bg-logic-indigo-50/60 border border-logic-indigo-200/60 rounded-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-logic-indigo-800">{t('nim.gameTree')}</h3>
      <div className="text-xs text-logic-indigo-700 space-y-1">
        <p>
          {t('nim.nimSum')} = {traceData?.xorExpr ?? state.piles.join(' ^ ') + ' = ' + nimSum}
          {' '}({isP ? t('nim.pPosition') : t('nim.nPosition')})
        </p>
      </div>
      <div style={{ width: '100%', height: 400 }}>
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
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-500 inline-block" /> {t('nim.nPosition')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-500 inline-block" /> {t('nim.pPosition')}
        </span>
      </div>
    </div>
  );
}
