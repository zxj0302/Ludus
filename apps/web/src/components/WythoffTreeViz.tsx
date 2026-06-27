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
import { isWythoffPPosition } from '@ludus/games';
import type { WythoffState } from '@ludus/games';

interface Props {
  trace?: SolverTrace;
  state: WythoffState;
}

interface TreeNodeData {
  piles: [number, number];
  isP: boolean;
  depth: number;
  move?: string;
}

function expandTree(piles: [number, number], depth: number, maxDepth: number, maxNodes = 500): { nodes: TreeNodeData[]; edges: { from: number; to: number; label: string }[] } {
  const nodes: TreeNodeData[] = [];
  const edges: { from: number; to: number; label: string }[] = [];
  const queue: { piles: [number, number]; parentIdx: number | null; depth: number; moveLabel: string }[] = [
    { piles, parentIdx: null, depth: 0, moveLabel: '' }
  ];

  while (queue.length > 0 && nodes.length < maxNodes) {
    const item = queue.shift()!;
    if (item.depth > maxDepth) continue;

    const isP = isWythoffPPosition(item.piles[0]!, item.piles[1]!);
    const nodeIdx = nodes.length;
    nodes.push({ piles: item.piles, isP, depth: item.depth, move: item.moveLabel || undefined });

    if (item.parentIdx !== null) {
      edges.push({ from: item.parentIdx, to: nodeIdx, label: item.moveLabel });
    }

    if (item.depth < maxDepth && nodes.length < maxNodes) {
      const [a, b] = item.piles;
      // Single-pile moves
      for (let i = 0; i < 2 && nodes.length < maxNodes; i++) {
        const count = item.piles[i]!;
        for (let r = 1; r <= count && nodes.length < maxNodes; r++) {
          const newPiles: [number, number] = [...item.piles];
          newPiles[i]! -= r;
          queue.push({ piles: newPiles, parentIdx: nodeIdx, depth: item.depth + 1, moveLabel: `${i + 1}↓${r}` });
        }
      }
      // Both-pile moves
      const maxBoth = Math.min(a, b);
      for (let r = 1; r <= maxBoth && nodes.length < maxNodes; r++) {
        const newPiles: [number, number] = [a - r, b - r];
        queue.push({ piles: newPiles, parentIdx: nodeIdx, depth: item.depth + 1, moveLabel: `↔${r}` });
      }
    }
  }

  return { nodes, edges };
}

function layoutDagre(nodes: TreeNodeData[], edges: { from: number; to: number; label: string }[], currentPlayer: 0 | 1) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 16, ranksep: 56 });

  nodes.forEach((_, i) => {
    g.setNode(String(i), { width: 72, height: 44 });
  });

  edges.forEach(e => {
    g.setEdge(String(e.from), String(e.to));
  });

  dagre.layout(g);

  const rfNodes: Node[] = nodes.map((n, i) => {
    const dagNode = g.node(String(i)) as { x: number; y: number } | undefined;
    const x = (dagNode?.x ?? 0) - 36;
    const y = (dagNode?.y ?? 0) - 22;
    const isPlayerTurn = (n.depth + currentPlayer) % 2 === 0;
    const turnIcon = isPlayerTurn ? '🧑' : '🤖';
    return {
      id: String(i),
      position: { x, y },
      data: { label: `${turnIcon} (${n.piles[0]},${n.piles[1]})\n${n.isP ? 'P' : 'N'}` },
      style: {
        background: n.isP ? '#fef2f2' : '#eff6ff',
        border: `2px solid ${n.isP ? '#e05d5d' : '#4a90d9'}`,
        borderRadius: '8px',
        padding: '4px 8px',
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

export function WythoffTreeViz({ trace, state }: Props) {
  const { t } = useTranslation();

  const tree = useMemo(() => {
    const { nodes, edges } = expandTree(state.piles, 0, 3);
    return layoutDagre(nodes, edges, state.currentPlayer);
  }, [state.piles, state.currentPlayer]);

  const [nodes, setNodes, onNodesChange] = useNodesState(tree.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(tree.edges);

  useEffect(() => {
    setNodes(tree.nodes);
    setEdges(tree.edges);
  }, [tree, setNodes, setEdges]);

  const [a, b] = state.piles;
  const isP = isWythoffPPosition(a, b);
  const k = Math.abs(b - a);

  const traceData = trace?.visualizationData as
    | { piles: number[]; isP: boolean; k: number; phi: number; beattyPair: number[] | null }
    | undefined;

  const displayP = traceData ? traceData.isP : isP;
  const displayK = traceData ? traceData.k : k;

  return (
    <div className="bg-logic-indigo-50/60 border border-logic-indigo-200/60 rounded-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-logic-indigo-800">{t('wythoff.gameTree')}</h3>
      <div className="text-xs text-logic-indigo-700 space-y-1">
        <p>
          ({a}, {b}) → k = {displayK}
          {' '}({displayP ? t('wythoff.pPosition') : t('wythoff.nPosition')})
        </p>
        <p>{t('wythoff.goldenRatio')} φ = 1.618...</p>
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
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-500 inline-block" /> {t('wythoff.nPosition')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-500 inline-block" /> {t('wythoff.pPosition')}
        </span>
      </div>
    </div>
  );
}
