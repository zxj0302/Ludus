import type { SokobanState, SokobanMove } from '../types/sokoban';
import { DIRECTION_DELTA } from '../types/sokoban';
import type { Difficulty } from '../types/plugin';

// ═══════════════════════════════════════════════════════════════
// Sokoban 规则引擎（框架无关，可放入 Worker）
// ═══════════════════════════════════════════════════════════════

/** 检查坐标是否撞墙 */
export function isWall(state: SokobanState, row: number, col: number): boolean {
  if (row < 0 || row >= state.height || col < 0 || col >= state.width) return true;
  return state.walls[row]![col]!;
}

/** 检查坐标是否有箱子 */
export function isBox(state: SokobanState, row: number, col: number): boolean {
  return state.boxes.some(b => b.row === row && b.col === col);
}

/** 检查坐标是否为目标点 */
export function isGoal(state: SokobanState, row: number, col: number): boolean {
  return state.goals.some(g => g.row === row && g.col === col);
}

/** 枚举所有合法移动 */
export function legalMoves(state: SokobanState): SokobanMove[] {
  const moves: SokobanMove[] = [];
  for (const dir of ['up', 'down', 'left', 'right'] as const) {
    const { dr, dc } = DIRECTION_DELTA[dir];
    const nr = state.player.row + dr;
    const nc = state.player.col + dc;

    if (isWall(state, nr, nc)) continue;

    if (isBox(state, nr, nc)) {
      // 推箱子：箱子前方必须为空且非墙且非另一箱子
      const br = nr + dr;
      const bc = nc + dc;
      if (isWall(state, br, bc) || isBox(state, br, bc)) continue;
    }

    moves.push({ direction: dir } as SokobanMove);
  }
  return moves;
}

/** 不可变地应用移动。非法移动返回原 state 引用——调用方应先通过 legalMoves 过滤 */
export function applyMove(state: SokobanState, move: SokobanMove): SokobanState {
  const { dr, dc } = DIRECTION_DELTA[move.direction];
  const nr = state.player.row + dr;
  const nc = state.player.col + dc;

  // 撞墙 → 非法，返回原引用
  if (isWall(state, nr, nc)) return state;

  if (isBox(state, nr, nc)) {
    const br = nr + dr;
    const bc = nc + dc;
    // 箱子推不动 → 非法
    if (isWall(state, br, bc) || isBox(state, br, bc)) return state;
  }

  // 合法移动：不可变地生成新状态。纯走子不碰箱子，直接浅拷贝引用即可
  const pushing = isBox(state, nr, nc);
  const newBoxes = pushing
    ? state.boxes.map(b =>
        b.row === nr && b.col === nc ? { row: nr + dr, col: nc + dc } : { ...b }
      )
    : [...state.boxes];

  return {
    ...state,
    player: { row: nr, col: nc },
    boxes: newBoxes,
  };
}

/** 所有箱子在目标点上 */
export function isSolved(state: SokobanState): boolean {
  return state.boxes.every(b => isGoal(state, b.row, b.col));
}

// ═══════════════════════════════════════════════════════════════
// 死锁检测
// ═══════════════════════════════════════════════════════════════

/**
 * 检测箱子是否处于不可解的死锁位置。
 * 包括：
 *   - 角死锁：箱子在角落（两面临墙）且不在目标上
 *   - 边死锁：箱子靠墙但不沿墙方向可移动，且不在目标上
 */
export function isDeadlock(state: SokobanState): boolean {
  for (const b of state.boxes) {
    if (isGoal(state, b.row, b.col)) continue;

    // 角死锁：两相邻方向均为墙（或边界）
    const cornerPairs: [number, number][][] = [
      [[-1, 0], [0, -1]], [[-1, 0], [0, 1]],
      [[1, 0], [0, -1]], [[1, 0], [0, 1]],
    ];
    let cornerDead = false;
    for (const pair of cornerPairs) {
      const d1r = pair[0]![0]!, d1c = pair[0]![1]!;
      const d2r = pair[1]![0]!, d2c = pair[1]![1]!;
      if (isWall(state, b.row + d1r, b.col + d1c) && isWall(state, b.row + d2r, b.col + d2c)) {
        cornerDead = true;
        break;
      }
    }
    if (cornerDead) return true;

    // 边死锁：箱子靠一面墙，且沿墙两个方向均不可推
    const edgeChecks = [
      { wr: -1, wc: 0, along: [[[0, -1], [0, 1]]] as [number, number][][] },
      { wr: 1, wc: 0, along: [[[0, -1], [0, 1]]] as [number, number][][] },
      { wr: 0, wc: -1, along: [[[-1, 0], [1, 0]]] as [number, number][][] },
      { wr: 0, wc: 1, along: [[[-1, 0], [1, 0]]] as [number, number][][] },
    ];
    for (const { wr, wc, along } of edgeChecks) {
      if (!isWall(state, b.row + wr, b.col + wc)) continue;
      let stuck = true;
      for (const pair of along) {
        const d1r = pair[0]![0]!, d1c = pair[0]![1]!;
        const d2r = pair[1]![0]!, d2c = pair[1]![1]!;
        const b1 = isWall(state, b.row + d1r, b.col + d1c);
        const b2 = isWall(state, b.row + d2r, b.col + d2c);
        if (!b1 || !b2) { stuck = false; break; }
      }
      if (stuck) return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════
// 交互式逐层展开（供 BFSTreeViz 使用）
// ═══════════════════════════════════════════════════════════════

/** 展开单个状态的子节点元数据 */
export interface ExpandedChild {
  direction: SokobanMove['direction'];
  state: SokobanState;
  /** 该走子是否推动了箱子 */
  isPush: boolean;
  /** 子状态是否死锁 */
  isDeadlock: boolean;
  /** 子状态是否已解决 */
  isSolved: boolean;
}

/**
 * 展开一层：返回当前状态的所有合法子节点及元数据。
 * 复用 legalMoves 的合法性检查，仅计算一层（最多 4 个子节点）。
 */
export function expandState(state: SokobanState): ExpandedChild[] {
  const result: ExpandedChild[] = [];
  const moves = legalMoves(state);
  for (const move of moves) {
    const { dr, dc } = DIRECTION_DELTA[move.direction];
    const nr = state.player.row + dr;
    const nc = state.player.col + dc;
    const isPush = isBox(state, nr, nc);
    const next = applyMove(state, move);
    result.push({
      direction: move.direction,
      state: next,
      isPush,
      isDeadlock: isPush ? isDeadlock(next) : false,
      isSolved: isPush ? isSolved(next) : false,
    });
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// 状态序列化（用于 BFS 去重哈希）
// ═══════════════════════════════════════════════════════════════

/**
 * 生成紧凑的状态哈希字符串。
 * 箱子顺序由 applyMove 保持（map 保序），无需排序。
 */
export function stateHash(state: SokobanState): string {
  const player = `${state.player.row},${state.player.col}`;
  const boxes = state.boxes
    .map(b => `${b.row},${b.col}`)
    .join('|');
  return `${player}|${boxes}`;
}

/** 深拷贝状态（用于 BFS 队列等需要独立拷贝的场景） */
export function cloneState(state: SokobanState): SokobanState {
  return {
    ...state,
    player: { ...state.player },
    walls: state.walls.map(row => [...row]),
    goals: state.goals.map(g => ({ ...g })),
    boxes: state.boxes.map(b => ({ ...b })),
  };
}

// ═══════════════════════════════════════════════════════════════
// 难度度量（单一真相源，供 rules.ts 与 generator 共用）
// ═══════════════════════════════════════════════════════════════

export function computeSokobanDifficulty(state: SokobanState): Difficulty {
  const size = state.width * state.height;
  const boxCount = state.boxes.length;

  const sizeFactor = Math.max(0, Math.min((size - 20) / 80, 1));
  const boxFactor = Math.max(0, Math.min((boxCount - 1) / 7, 1));

  const score = Math.round(sizeFactor * 40 + boxFactor * 60);
  const clamped = Math.max(0, Math.min(100, score));

  const labelKey =
    clamped <= 20 ? 'difficulty.easy' :
    clamped <= 50 ? 'difficulty.medium' :
    'difficulty.hard';

  return {
    score: clamped,
    factors: { size, boxCount },
    labelKey,
  };
}
