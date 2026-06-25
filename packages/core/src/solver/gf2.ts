// GF(2) 高斯消元求解器 — 用于 Lights Out 等线性系统游戏
// 所有运算在 GF(2) 上：加法 = XOR，乘法 = AND

export interface GF2Solution {
  /** 特解（满足 Ax = b 的一个解向量） */
  particular: number[] | null;
  /** 零空间基向量（Ax = 0 的基），空 = 唯一解 */
  nullSpace: number[][];
  /** 矩阵的秩 */
  rank: number;
  /** 零空间的维数 */
  nullity: number;
  /** 增广矩阵行数（方程数） */
  rows: number;
  /** 增广矩阵列数（变量数） */
  cols: number;
}

/**
 * 在 GF(2) 上求解线性方程组 Ax = b。
 * A 是 rows × cols 的 0-1 矩阵，b 是长度为 rows 的 0-1 向量。
 * 返回特解、零空间基、秩和零化度。
 */
export function solveGF2(A: number[][], b: number[]): GF2Solution {
  const rows = A.length;
  if (rows === 0) {
    return { particular: [], nullSpace: [], rank: 0, nullity: 0, rows: 0, cols: 0 };
  }
  const cols = A[0]!.length;
  if (cols === 0) {
    return { particular: [], nullSpace: [], rank: 0, nullity: 0, rows, cols: 0 };
  }

  // 构建增广矩阵 [A | b]，每行长度为 cols + 1
  const aug: number[][] = [];
  for (let i = 0; i < rows; i++) {
    aug.push([...A[i]!, b[i]!]);
  }

  // 记录哪些列是主元列，以及每行的主元列索引
  const pivotCols: (number | null)[] = new Array(rows).fill(null);
  const isPivotCol: boolean[] = new Array(cols).fill(false);

  let currentRow = 0;

  // 正向消元
  for (let col = 0; col < cols && currentRow < rows; col++) {
    // 查找当前列中值为 1 的行（从 currentRow 开始）
    let pivotRow = -1;
    for (let r = currentRow; r < rows; r++) {
      if (aug[r]![col] === 1) {
        pivotRow = r;
        break;
      }
    }

    if (pivotRow === -1) continue; // 该列没有主元，是自由变量

    // 交换到当前行
    if (pivotRow !== currentRow) {
      const tmp = aug[currentRow]!;
      aug[currentRow] = aug[pivotRow]!;
      aug[pivotRow] = tmp;
    }

    pivotCols[currentRow] = col;
    isPivotCol[col] = true;

    // 消去其他行中该列的 1
    for (let r = 0; r < rows; r++) {
      if (r !== currentRow && aug[r]![col] === 1) {
        xorRow(aug[r]!, aug[currentRow]!);
      }
    }

    currentRow++;
  }

  const rank = currentRow;

  // 检查可解性：消元后若某行系数全为 0 但 b 列为 1，则无解
  for (let r = rank; r < rows; r++) {
    let allZero = true;
    for (let c = 0; c < cols; c++) {
      if (aug[r]![c] !== 0) {
        allZero = false;
        break;
      }
    }
    if (allZero && aug[r]![cols] === 1) {
      // 无解
      return { particular: null, nullSpace: [], rank, nullity: cols - rank, rows, cols };
    }
  }

  // 提取特解：自由变量设为 0，主元变量由对应行的 b 列决定
  const particular = new Array(cols).fill(0);
  for (let r = 0; r < rank; r++) {
    const pcol = pivotCols[r];
    if (pcol != null) {
      const row = aug[r];
      if (row) particular[pcol] = row[cols]!;
    }
  }

  // 计算零空间基
  const nullity = cols - rank;
  const nullSpace: number[][] = [];

  if (nullity > 0) {
    // 收集自由变量列索引
    const freeCols: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (!isPivotCol[c]) freeCols.push(c);
    }

    // 为每个自由变量构建一个基向量
    for (const freeCol of freeCols) {
      const basisVec = new Array(cols).fill(0);
      basisVec[freeCol] = 1;

      // 回代求解主元变量
      for (let r = rank - 1; r >= 0; r--) {
        const pcol = pivotCols[r];
        if (pcol === null || pcol === undefined) continue;
        let sum = 0;
        const row = aug[r];
        for (let c = pcol + 1; c < cols; c++) {
          if (row) sum ^= (row[c] ?? 0) & (basisVec[c] ?? 0);
        }
        basisVec[pcol] = sum;
      }

      nullSpace.push(basisVec);
    }
  }

  return { particular, nullSpace, rank, nullity, rows, cols };
}

/**
 * 求 GF(2) 上所有解中 Hamming weight 最小的（最优解）。
 * 通过枚举零空间所有 2^nullity 个组合实现。
 * 当 nullity > 20 时不建议使用（会触发性能警告）。
 */
export function optimalSolution(solution: GF2Solution): number[] | null {
  if (solution.particular === null) return null;
  if (solution.nullity === 0) return solution.particular;

  const n = solution.nullSpace.length;
  const combinations = 1 << n;

  let best = solution.particular;
  let bestWeight = hammingWeight(best);

  for (let mask = 1; mask < combinations; mask++) {
    const candidate = [...solution.particular];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        xorVec(candidate, solution.nullSpace[i]!);
      }
    }
    const w = hammingWeight(candidate);
    if (w < bestWeight) {
      best = candidate;
      bestWeight = w;
    }
  }

  return best;
}

/**
 * 判断矩阵 A 在 GF(2) 上是否可逆（满秩方阵）。
 */
export function isInvertible(A: number[][]): boolean {
  const n = A.length;
  if (n === 0) return true;
  if (A[0]!.length !== n) return false;

  const b = new Array(n).fill(0);
  const sol = solveGF2(A, b);
  return sol.rank === n;
}

/** 计算 0-1 向量的 Hamming weight */
export function hammingWeight(vec: number[]): number {
  let w = 0;
  for (const v of vec) if (v === 1) w++;
  return w;
}

/** 在 GF(2) 上对 row 执行 row ^= source */
function xorRow(row: number[], source: number[]): void {
  for (let i = 0; i < row.length; i++) {
    row[i] = (row[i] ?? 0) ^ (source[i] ?? 0);
  }
}

/** 在 GF(2) 上对 vec 执行 vec ^= other */
function xorVec(vec: number[], other: number[]): void {
  for (let i = 0; i < vec.length; i++) {
    vec[i] = (vec[i] ?? 0) ^ (other[i] ?? 0);
  }
}

/**
 * 构建 Lights Out 的邻接矩阵 A (n² × n²)。
 * A[i][j] = 1 iff 按下格子 j 会翻转格子 i（自身 + 上下左右邻居）。
 */
export function buildLightsOutMatrix(n: number): number[][] {
  const N = n * n;
  const A: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const idx = r * n + c;
      const row = A[idx];
      if (!row) continue;
      row[idx] = 1; // 自身
      if (r > 0) row[(r - 1) * n + c] = 1; // 上
      if (r < n - 1) row[(r + 1) * n + c] = 1; // 下
      if (c > 0) row[r * n + (c - 1)] = 1; // 左
      if (c < n - 1) row[r * n + (c + 1)] = 1; // 右
    }
  }

  return A;
}

// ---- 逐步消元追踪 ----

export interface EliminationStep {
  /** 步骤序号（0-based） */
  step: number;
  /** 当前增广矩阵 [A | b] 的状态（每行长度为 cols + 1） */
  augmentedMatrix: number[][];
  /** 当前阶段：forward = 正向消元, back = 回代, done = 完成 */
  phase: 'forward' | 'back' | 'done';
  /** 主元行索引（-1 = 无主元/跳过列） */
  pivotRow: number;
  /** 主元列索引 */
  pivotCol: number;
  /** 被消去的行索引列表 */
  eliminatedRows: number[];
  /** 描述文本 */
  description: string;
}

export interface GF2SolutionWithTrace extends GF2Solution {
  /** 消元步骤轨迹 */
  eliminationSteps: EliminationStep[];
}

/**
 * 带逐步追踪的 GF(2) 高斯消元。
 * 录制增广矩阵在每次主元操作后的状态，供可视化消费。
 */
export function solveGF2WithTrace(A: number[][], b: number[]): GF2SolutionWithTrace {
  const rows = A.length;
  const steps: EliminationStep[] = [];

  if (rows === 0) {
    const empty: GF2Solution = { particular: [], nullSpace: [], rank: 0, nullity: 0, rows: 0, cols: 0 };
    return { ...empty, eliminationSteps: steps };
  }
  const cols = A[0]!.length;
  if (cols === 0) {
    const empty: GF2Solution = { particular: [], nullSpace: [], rank: 0, nullity: 0, rows, cols: 0 };
    return { ...empty, eliminationSteps: steps };
  }

  const aug: number[][] = [];
  for (let i = 0; i < rows; i++) {
    aug.push([...A[i]!, b[i]!]);
  }

  // 录制初始状态
  steps.push({
    step: 0,
    augmentedMatrix: aug.map(r => [...r]),
    phase: 'forward',
    pivotRow: -1,
    pivotCol: -1,
    eliminatedRows: [],
    description: `初始增广矩阵 [A | b]，${rows}×${cols + 1}`,
  });

  const pivotCols: (number | null)[] = new Array(rows).fill(null);
  const isPivotCol: boolean[] = new Array(cols).fill(false);
  let currentRow = 0;
  let stepNum = 1;

  // 正向消元
  for (let col = 0; col < cols && currentRow < rows; col++) {
    let pivotRow = -1;
    for (let r = currentRow; r < rows; r++) {
      if (aug[r]![col] === 1) {
        pivotRow = r;
        break;
      }
    }

    if (pivotRow === -1) {
      steps.push({
        step: stepNum++,
        augmentedMatrix: aug.map(r => [...r]),
        phase: 'forward',
        pivotRow: -1,
        pivotCol: col,
        eliminatedRows: [],
        description: `第 ${col + 1} 列无主元，跳过（自由变量）`,
      });
      continue;
    }

    if (pivotRow !== currentRow) {
      const tmp = aug[currentRow]!;
      aug[currentRow] = aug[pivotRow]!;
      aug[pivotRow] = tmp;
    }

    pivotCols[currentRow] = col;
    isPivotCol[col] = true;

    const eliminated: number[] = [];
    for (let r = 0; r < rows; r++) {
      if (r !== currentRow && aug[r]![col] === 1) {
        xorRow(aug[r]!, aug[currentRow]!);
        eliminated.push(r);
      }
    }

    steps.push({
      step: stepNum++,
      augmentedMatrix: aug.map(r => [...r]),
      phase: 'forward',
      pivotRow: currentRow,
      pivotCol: col,
      eliminatedRows: eliminated,
      description: eliminated.length > 0
        ? `主元 (${currentRow + 1}, ${col + 1})，消去第 ${eliminated.map(i => i + 1).join(', ')} 行`
        : `主元 (${currentRow + 1}, ${col + 1})，该列已无其他 1`,
    });

    currentRow++;
  }

  const rank = currentRow;
  const nullity = cols - rank;

  // 检查可解性
  for (let r = rank; r < rows; r++) {
    let allZero = true;
    for (let c = 0; c < cols; c++) {
      if (aug[r]![c] !== 0) { allZero = false; break; }
    }
    if (allZero && aug[r]![cols] === 1) {
      steps.push({
        step: stepNum,
        augmentedMatrix: aug.map(r => [...r]),
        phase: 'done',
        pivotRow: -1,
        pivotCol: -1,
        eliminatedRows: [],
        description: `无解：第 ${r + 1} 行系数全 0 但 b=1`,
      });
      const result: GF2Solution = { particular: null, nullSpace: [], rank, nullity, rows, cols };
      return { ...result, eliminationSteps: steps };
    }
  }

  // 提取特解
  const particular = new Array(cols).fill(0);
  for (let r = 0; r < rank; r++) {
    const pcol = pivotCols[r];
    if (pcol != null) {
      const row = aug[r];
      if (row) particular[pcol] = row[cols]!;
    }
  }

  // 零空间基
  const nullSpace: number[][] = [];
  if (nullity > 0) {
    const freeCols: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (!isPivotCol[c]) freeCols.push(c);
    }
    for (const freeCol of freeCols) {
      const basisVec = new Array(cols).fill(0);
      basisVec[freeCol] = 1;
      for (let r = rank - 1; r >= 0; r--) {
        const pcol = pivotCols[r];
        if (pcol === null || pcol === undefined) continue;
        let sum = 0;
        const row = aug[r];
        for (let c = pcol + 1; c < cols; c++) {
          if (row) sum ^= (row[c] ?? 0) & (basisVec[c] ?? 0);
        }
        basisVec[pcol] = sum;
      }
      nullSpace.push(basisVec);
    }
  }

  // 录制最终状态
  steps.push({
    step: stepNum,
    augmentedMatrix: aug.map(r => [...r]),
    phase: 'done',
    pivotRow: -1,
    pivotCol: -1,
    eliminatedRows: [],
    description: nullity === 0
      ? `消元完成 — 行最简形，解唯一`
      : `消元完成 — 秩=${rank}，零化度=${nullity}，${1 << nullity} 个解`,
  });

  return {
    particular, nullSpace, rank, nullity, rows, cols,
    eliminationSteps: steps,
  };
}
