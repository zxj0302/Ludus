import type { Solution, SolverTrace, TraceStep, SolutionStats } from '../types/plugin';
import type { SokobanState, SokobanMove } from '../types/sokoban';
import {
  legalMoves, applyMove, isSolved, isDeadlock,
  stateHash,
} from './sokoban';

// ═══════════════════════════════════════════════════════════════
// BFS 求解器 — 搜索最短推箱路径
// ═══════════════════════════════════════════════════════════════

interface BFSNode {
  state: SokobanState;
  move: SokobanMove | null;   // 到达此状态的移动
  parentHash: string | null;   // 父状态哈希
  depth: number;
}

export const SOKOBAN_BFS_TIMEOUT_MS = 8000;

/**
 * BFS 求解 Sokoban。
 *
 * @param state     初始状态
 * @param timeoutMs 超时（毫秒），默认 8 秒
 */
export function solveSokobanBFS(
  state: SokobanState,
  timeoutMs = SOKOBAN_BFS_TIMEOUT_MS,
): Solution {
  const t0 = performance.now();
  const initialHash = stateHash(state);

  // 已经解决
  if (isSolved(state)) {
    return {
      solvable: true,
      moves: [],
      trace: buildTrace([], 0, t0, 0, 'solved', 0),
      stats: buildStats(0, 0, t0, 'solved'),
    };
  }

  // visited: hash → BFSNode
  const visited = new Map<string, BFSNode>();
  visited.set(initialHash, { state, move: null, parentHash: null, depth: 0 });

  // BFS 队列（index-based dequeue，O(1) 出队）
  const queue: string[] = [initialHash];
  let head = 0;

  let nodesExplored = 0;
  const traceSteps: TraceStep[] = [];
  let maxDepth = 0;
  let lastTraceTime = t0;
  // 首层必入 trace，避免 SearchTreeViz 等可视化首层缺失
  traceSteps.push({
    description: `Depth 0: start, frontier 1`,
    data: { depth: 0, nodesExplored: 0, frontier: 1 },
  });

  while (head < queue.length) {
    // 超时保护
    if (performance.now() - t0 > timeoutMs) {
      return {
        solvable: false,
        moves: [],
        trace: buildTrace(traceSteps, nodesExplored, t0, null, 'timeout', maxDepth),
        stats: buildStats(nodesExplored, 0, t0, 'timeout'),
      };
    }

    const hash = queue[head++]!;
    const node = visited.get(hash)!;
    nodesExplored++;

    if (node.depth > maxDepth) {
      maxDepth = node.depth;
      // 每进入新深度记录一个 trace step（200ms 节流避免爆炸）
      const now = performance.now();
      if (now - lastTraceTime > 200) {
        lastTraceTime = now;
        traceSteps.push({
          description: `Depth ${maxDepth}: explored ${nodesExplored} nodes, frontier ${queue.length - head}`,
          data: { depth: maxDepth, nodesExplored, frontier: queue.length - head },
        });
      }
    }

    // 展开当前状态
    const moves = legalMoves(node.state);
    for (const move of moves) {
      const nextState = applyMove(node.state, move);

      // 死锁剪枝
      if (isDeadlock(nextState)) continue;

      const nextHash = stateHash(nextState);

      // 已访问过，跳过
      if (visited.has(nextHash)) continue;

      const nextNode: BFSNode = {
        state: nextState,
        move,
        parentHash: hash,
        depth: node.depth + 1,
      };

      visited.set(nextHash, nextNode);
      queue.push(nextHash);

      // 检查是否解决
      if (isSolved(nextState)) {
        const path = reconstructPath(visited, nextHash);
        return {
          solvable: true,
          moves: path,
          trace: buildTrace(traceSteps, nodesExplored, t0, path.length, 'solved', maxDepth),
          stats: buildStats(nodesExplored, path.length, t0, 'solved'),
        };
      }
    }
  }

  // 队列耗尽，无解
  return {
    solvable: false,
    moves: [],
    trace: buildTrace(traceSteps, nodesExplored, t0, null, 'exhausted', maxDepth),
    stats: buildStats(nodesExplored, 0, t0, 'exhausted'),
  };
}

// ═══════════════════════════════════════════════════════════════
// 路径重建
// ═══════════════════════════════════════════════════════════════

function reconstructPath(
  visited: Map<string, BFSNode>,
  goalHash: string,
): SokobanMove[] {
  const moves: SokobanMove[] = [];
  let current = visited.get(goalHash)!;

  while (current.parentHash != null) {
    moves.push(current.move!);
    current = visited.get(current.parentHash)!;
  }
  moves.reverse();

  return moves;
}

// ═══════════════════════════════════════════════════════════════
// Trace 与 Stats 构建
// ═══════════════════════════════════════════════════════════════

function buildTrace(
  steps: TraceStep[],
  nodesExplored: number,
  t0: number,
  solutionLength: number | null,
  terminated: 'solved' | 'timeout' | 'exhausted',
  maxDepth: number,
): SolverTrace {
  const elapsed = Math.round(performance.now() - t0);
  return {
    type: 'search-tree',
    steps: steps.length > 0 ? steps : [{
      description: `BFS explored ${nodesExplored} nodes in ${elapsed}ms`,
      data: { nodesExplored, timeMs: elapsed, solutionLength, depth: maxDepth },
    }],
    visualizationData: {
      nodesExplored,
      timeMs: elapsed,
      solutionLength,
      maxDepth,
      terminated,
    },
  };
}

function buildStats(
  nodesExplored: number,
  solutionLength: number,
  t0: number,
  terminated: 'solved' | 'timeout' | 'exhausted',
): SolutionStats {
  return {
    nodesExplored,
    timeMs: Math.round(performance.now() - t0),
    solutionLength,
    solverName: 'BFS + deadlock detection',
    terminated,
  };
}
