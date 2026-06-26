import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { SokobanState, SokobanMove } from '@ludus/games';
import { expandState, stateHash, solveSokobanBFS, applyMove, isDeadlock, isSolved } from '@ludus/core';
import { SOKOBAN_BFS_TIMEOUT_MS } from '@ludus/core';

const ROW_H = 56;
const NODE_W = 80;
const NODE_H = 28;
const NODE_GAP = 8;
const PAD_TOP = 16;

const ARROWS: Record<string, string> = { up: '↑', down: '↓', left: '←', right: '→' };

// ═══════════════════════════════════════
// 树节点
// ═══════════════════════════════════════

interface TreeNode {
  state: SokobanState;
  direction: string | null;
  depth: number;
  isPush: boolean;
  isDeadlock: boolean;
  isSolved: boolean;
  expanded: boolean;
  children: string[];
  onOptimalPath: boolean;
}

interface LayoutNode {
  id: string;
  node: TreeNode;
  x: number;
  y: number;
}

// ═══════════════════════════════════════
// 节点样式
// ═══════════════════════════════════════

type NodeStyle = { bg: string; border: string; text: string; ring: string };
const DEFAULT_NODE_STYLE: NodeStyle = { bg: '#eff6ff', border: '#4a90d9', text: '#1e40af', ring: 'rgba(74,144,217,0.12)' };

function nodeStyle(n: TreeNode): NodeStyle {
  if (n.isDeadlock) return { bg: '#fef2f2', border: '#e05d5d', text: '#b91c1c', ring: 'rgba(224,93,93,0.25)' };
  if (n.isSolved)   return { bg: '#f0fdf4', border: '#5fb868', text: '#166534', ring: 'rgba(95,184,104,0.25)' };
  if (n.onOptimalPath) return { bg: '#fffbeb', border: '#e8a838', text: '#92400e', ring: 'rgba(232,168,56,0.3)' };
  if (n.expanded)   return { bg: '#f5f3ff', border: '#8e7cc3', text: '#5b21b6', ring: 'rgba(142,124,195,0.15)' };
  return DEFAULT_NODE_STYLE;
}

function legendStyle(kind: 'expandable' | 'deadlock' | 'solved' | 'optimal'): NodeStyle {
  switch (kind) {
    case 'deadlock': return nodeStyle({ isDeadlock: true } as TreeNode);
    case 'solved':   return nodeStyle({ isSolved: true } as TreeNode);
    case 'optimal':  return nodeStyle({ onOptimalPath: true } as TreeNode);
    case 'expandable':
    default:         return DEFAULT_NODE_STYLE;
  }
}

// ═══════════════════════════════════════
// 布局：垂直分层
// ═══════════════════════════════════════

function computeLayout(
  nodes: Map<string, TreeNode>,
  rootHash: string,
): LayoutNode[] {
  const levelNodes = new Map<number, string[]>();
  const visited = new Set<string>();

  function collect(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodes.get(id);
    if (!node) return;
    if (!levelNodes.has(node.depth)) levelNodes.set(node.depth, []);
    levelNodes.get(node.depth)!.push(id);
    if (node.expanded) {
      for (const c of node.children) collect(c);
    }
  }

  collect(rootHash);

  const result: LayoutNode[] = [];
  for (const [depth, ids] of levelNodes) {
    const totalW = ids.length * NODE_W + (ids.length - 1) * NODE_GAP;
    for (let i = 0; i < ids.length; i++) {
      const node = nodes.get(ids[i]!)!;
      result.push({
        id: ids[i]!,
        node,
        x: i * (NODE_W + NODE_GAP) - totalW / 2,
        y: depth * ROW_H + PAD_TOP,
      });
    }
  }
  return result;
}

// ═══════════════════════════════════════
// 沿 BFS 最优路径标记节点
// ═══════════════════════════════════════

function markOptimalPath(
  prev: Map<string, TreeNode>,
  rootState: SokobanState,
  moves: SokobanMove[],
): Map<string, TreeNode> {
  const next = new Map(prev);
  const pathIds = new Set<string>();
  let cur = rootState;
  let curHash = stateHash(cur);
  pathIds.add(curHash);

  for (const move of moves) {
    const ns = applyMove(cur, move);
    const nh = stateHash(ns);

    const oldSet = new Set(cur.boxes.map(b => `${b.row},${b.col}`));
    const isPush = !ns.boxes.every(b => oldSet.has(`${b.row},${b.col}`));

    if (!next.has(nh)) {
      next.set(nh, {
        state: ns, direction: move.direction,
        depth: (next.get(curHash)?.depth ?? 0) + 1,
        isPush, isDeadlock: false, isSolved: false,
        expanded: false, children: [], onOptimalPath: true,
      });
    }
    const parent = next.get(curHash);
    if (parent && !parent.children.includes(nh)) {
      next.set(curHash, { ...parent, expanded: true, children: [...parent.children, nh] });
    }
    pathIds.add(nh);
    cur = ns;
    curHash = nh;
  }

  // 标记终点
  const end = next.get(curHash);
  if (end) next.set(curHash, { ...end, isSolved: true });

  // 全路径标记最优
  for (const id of pathIds) {
    const n = next.get(id);
    if (n) next.set(id, { ...n, onOptimalPath: true });
  }

  return next;
}

// ═══════════════════════════════════════
// 组件
// ═══════════════════════════════════════

export default function BFSTreeViz({ gameState }: { gameState: SokobanState }) {
  const { t } = useTranslation();

  // -- 内部状态 --
  const [treeNodes, setTreeNodes] = useState<Map<string, TreeNode>>(() => {
    const m = new Map<string, TreeNode>();
    m.set(stateHash(gameState), makeRoot(gameState));
    return m;
  });
  const [bfsPending, setBfsPending] = useState(false);
  const [bfsResult, setBfsResult] = useState<'idle' | 'solved' | 'unsolvable' | 'timeout'>('idle');

  // 当前状态判定
  const deadlocked = useMemo(() => isDeadlock(gameState), [gameState]);
  const solved = useMemo(() => isSolved(gameState), [gameState]);

  // Ref 闭包
  const nodesRef = useRef(treeNodes);
  nodesRef.current = treeNodes;

  // ── 游戏状态变化 → 重置根并自动展开一层 ──
  const newHash = stateHash(gameState);
  useEffect(() => {
    const m = new Map<string, TreeNode>();
    const root = makeRoot(gameState);
    m.set(newHash, root);

    // 自动展开根节点（一级子节点）
    const children = expandState(gameState);
    const ids: string[] = [];
    for (const c of children) {
      const h = stateHash(c.state);
      ids.push(h);
      if (!m.has(h)) {
        m.set(h, {
          state: c.state, direction: c.direction, depth: 1,
          isPush: c.isPush, isDeadlock: c.isDeadlock, isSolved: c.isSolved,
          expanded: false, children: [], onOptimalPath: false,
        });
      }
    }
    m.set(newHash, { ...root, expanded: true, children: ids });
    setTreeNodes(m);
    setBfsResult('idle');
    setBfsPending(false);
  }, [newHash]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 手动触发 BFS 找最优路径 ──
  const findOptimal = useCallback(() => {
    const nodes = nodesRef.current;
    const root = nodes.get(newHash);
    if (!root) return;

    setBfsPending(true);
    setBfsResult('idle');
    setTimeout(() => {
      try {
        const sol = solveSokobanBFS(root.state, SOKOBAN_BFS_TIMEOUT_MS);
        if (sol.solvable && sol.moves.length > 0) {
          setTreeNodes(prev => markOptimalPath(prev, root.state, sol.moves as SokobanMove[]));
          setBfsResult('solved');
        } else if (sol.stats.terminated === 'timeout') {
          setBfsResult('timeout');
        } else {
          setBfsResult('unsolvable');
        }
      } catch { setBfsResult('idle'); }
      setBfsPending(false);
    }, 50);
  }, [newHash]);

  // ── 手动展开更深层 ──
  const expandNode = useCallback((nodeId: string) => {
    setTreeNodes(prev => {
      const node = prev.get(nodeId);
      if (!node || node.expanded || node.isDeadlock || node.isSolved) return prev;

      const next = new Map(prev);
      const children = expandState(node.state);
      const ids: string[] = [];

      for (const c of children) {
        const h = stateHash(c.state);
        if (next.has(h)) { if (!ids.includes(h)) ids.push(h); continue; }
        ids.push(h);
        next.set(h, {
          state: c.state, direction: c.direction, depth: node.depth + 1,
          isPush: c.isPush, isDeadlock: c.isDeadlock, isSolved: c.isSolved,
          expanded: false, children: [], onOptimalPath: false,
        });
      }
      next.set(nodeId, { ...node, expanded: true, children: ids });
      return next;
    });
  }, []);

  // ── 布局 ──
  const rootHash = newHash; // 当前游戏状态哈希
  const layout = useMemo(() => computeLayout(treeNodes, rootHash), [treeNodes, rootHash]);
  const layoutMap = useMemo(() => {
    const m = new Map<string, LayoutNode>();
    for (const ln of layout) m.set(ln.id, ln);
    return m;
  }, [layout]);

  const canvasW = useMemo(() => {
    let w = NODE_W;
    for (const ln of layout) {
      const r = ln.x + NODE_W;
      if (r > w) w = r;
      if (ln.x < 0 && -ln.x + NODE_W > w) w = -ln.x + NODE_W;
    }
    return w + 40;
  }, [layout]);
  const canvasH = useMemo(() => {
    let maxY = 0;
    for (const ln of layout) {
      if (ln.y + NODE_H > maxY) maxY = ln.y + NODE_H;
    }
    return Math.max(200, maxY + 24);
  }, [layout]);
  const offsetX = useMemo(() => canvasW / 2, [canvasW]);

  // ── SVG 连线 ──
  const lines = useMemo(() => {
    const r: { x1: number; y1: number; x2: number; y2: number; color: string; dash: boolean }[] = [];
    for (const [id, node] of treeNodes) {
      if (!node.expanded || node.children.length === 0) continue;
      const p = layoutMap.get(id);
      if (!p) continue;
      for (const cid of node.children) {
        const c = layoutMap.get(cid);
        if (!c) continue;
        const childNode = treeNodes.get(cid);
        r.push({
          x1: p.x + NODE_W / 2, y1: p.y + NODE_H,
          x2: c.x + NODE_W / 2, y2: c.y,
          color: childNode?.onOptimalPath ? '#e8a838' : '#d4cbc2',
          dash: !childNode?.onOptimalPath,
        });
      }
    }
    return r;
  }, [treeNodes, layoutMap]);

  return (
    <div className="bg-logic-indigo-50/60 rounded-card border border-logic-indigo-200/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-logic-indigo-200/50 flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-logic-indigo-900 shrink-0">{t('bfsTree.title')}</h4>
        <div className="flex items-center gap-2 text-[10px] text-logic-indigo-500 flex-1 justify-end">
          {bfsPending && <span className="animate-pulse">{t('game.status.solving')}</span>}
          <button
            type="button"
            onClick={findOptimal}
            disabled={bfsPending}
            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-logic-indigo-600 text-white hover:bg-logic-indigo-700 disabled:opacity-40 transition-colors shrink-0"
          >
            {bfsPending ? '…' : '⚡'} {t('bfsTree.findOptimal')}
          </button>
          {(['expandable', 'deadlock', 'solved', 'optimal'] as const).map(k => {
            const s = legendStyle(k);
            return (
              <span key={k} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm border" style={{ background: s.bg, borderColor: s.border }} />
                {t(`bfsTree.legend.${k}`)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Status banner */}
      {(solved || deadlocked || bfsResult === 'unsolvable' || bfsResult === 'timeout') && (
        <div className={`px-4 py-2 border-b text-xs font-semibold flex items-center gap-2 ${
          solved ? 'bg-green-50 text-green-700 border-green-100' :
          deadlocked ? 'bg-red-50 text-red-700 border-red-100' :
          'bg-amber-50 text-amber-700 border-amber-100'
        }`}>
          <span className="text-sm">
            {solved ? '✓' : deadlocked ? '✕' : '⚠'}
          </span>
          <span>
            {solved
              ? t('bfsTree.solvedBanner')
              : deadlocked
                ? t('bfsTree.deadlockWarn')
                : bfsResult === 'timeout'
                  ? t('bfsTree.timeoutWarn')
                  : t('bfsTree.unsolvableWarn')}
          </span>
        </div>
      )}

      {/* Tree — flexbox 居中，窄时自动居中，宽时可滚动 */}
      <div style={{ height: 280, display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
        <div className="relative shrink-0" style={{ width: canvasW, height: canvasH, minHeight: 280 }}>
          {/* SVG edges */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: canvasW, height: canvasH }}>
            <AnimatePresence>
              {lines.map((l, i) => (
                <motion.line
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  x1={l.x1 + offsetX} y1={l.y1}
                  x2={l.x2 + offsetX} y2={l.y2}
                  stroke={l.color}
                  strokeWidth={l.dash ? 1.5 : 2.5}
                  strokeDasharray={l.dash ? '4 3' : 'none'}
                />
              ))}
            </AnimatePresence>
          </svg>

          {/* Nodes */}
          {layout.map(ln => {
            const s = nodeStyle(ln.node);
            const canExpand = !ln.node.isDeadlock && !ln.node.isSolved && !ln.node.expanded;
            const dir = ln.node.direction as string | null;
            const label = dir
              ? (ln.node.isPush ? t('bfsTree.push') : t('bfsTree.walk'))
              : t('bfsTree.start');

            return (
              <motion.button
                key={ln.id}
                type="button"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => expandNode(ln.id)}
                disabled={!canExpand}
                className="absolute flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold select-none transition-shadow"
                style={{
                  left: ln.x + offsetX,
                  top: ln.y,
                  width: NODE_W,
                  height: NODE_H,
                  background: s.bg,
                  border: `2px solid ${s.border}`,
                  color: s.text,
                  boxShadow: ln.node.onOptimalPath ? `0 0 0 3px ${s.ring}` : undefined,
                  cursor: canExpand ? 'pointer' : 'default',
                }}
              >
                <span className="shrink-0 text-sm">{dir ? ARROWS[dir] : '⊙'}</span>
                <span className="truncate leading-tight">{label}</span>
                {ln.node.isPush && <span className="text-[10px] opacity-70">▣</span>}
                {ln.node.isDeadlock && <span className="text-[10px]">✕</span>}
                {ln.node.isSolved && <span className="text-[10px]">✓</span>}
                {ln.node.onOptimalPath && <span className="text-[10px]">★</span>}
                {canExpand && <span className="text-[8px] ml-auto opacity-60">▶</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function makeRoot(state: SokobanState): TreeNode {
  return {
    state,
    direction: null,
    depth: 0,
    isPush: false,
    isDeadlock: false,
    isSolved: false,
    expanded: false,
    children: [],
    onOptimalPath: false,
  };
}
